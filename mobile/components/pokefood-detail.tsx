import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import type { Pokefood } from '../lib/types'
import { RarityBadge } from './rarity-badge'
import { StatBar } from './stat-bar'
import { InlineIcon } from './icon'
import { getNutritionIcon, getStatIcon, getTypeIcon } from '../lib/icons'
import { AppColors } from '../lib/theme'

interface MarqueeTextProps {
  text: string
  style?: object
}

function MarqueeText({ text, style }: MarqueeTextProps) {
  const translateX = useSharedValue(0)
  const containerWidth = useRef(0)
  const textWidth = useRef(0)

  const startAnimation = useCallback((overflow: number) => {
    if (overflow <= 0) {
      translateX.value = 0
      return
    }
    const durationMs = Math.min(10000, Math.max(5000, (3.5 + overflow / 30) * 1000))
    translateX.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(-overflow, { duration: durationMs })),
        withDelay(800, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    )
  }, [translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View
      style={styles.marqueeTrack}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width
        const overflow = Math.max(0, textWidth.current - containerWidth.current)
        startAnimation(overflow)
      }}
    >
      <Animated.Text
        style={[styles.marqueeText, style, animatedStyle]}
        numberOfLines={1}
        onTextLayout={(e) => {
          const newWidth = e.nativeEvent.lines.reduce((max, line) => Math.max(max, line.width), 0)
          textWidth.current = newWidth
          const overflow = Math.max(0, newWidth - containerWidth.current)
          startAnimation(overflow)
        }}
      >
        {text}
      </Animated.Text>
    </View>
  )
}

interface PokefoodDetailProps {
  pokefood: Pokefood
  onClose: () => void
  onBattle?: (pokefood: Pokefood) => void | Promise<void>
  isBattleLoading?: boolean
  onTransfer?: (pokefood: Pokefood) => Promise<void>
  isTransferring?: boolean
  visible: boolean
}

export function PokefoodDetail({
  pokefood,
  onClose,
  onBattle,
  isBattleLoading = false,
  onTransfer,
  isTransferring = false,
  visible,
}: PokefoodDetailProps) {
  const [confirmingTransfer, setConfirmingTransfer] = useState(false)

  const handleConfirmTransfer = useCallback(async () => {
    await onTransfer?.(pokefood)
  }, [onTransfer, pokefood])

  const statScaleMax = Math.max(pokefood.hp, pokefood.atk, 1)
  const displayedTypeLabel =
    pokefood.type === 'fruits_vegetables'
      ? 'FRUIT/VEGETABLE'
      : pokefood.type === 'grains'
        ? 'GRAIN'
        : 'MEAT'

  const hpIcon = getStatIcon('hp')
  const atkIcon = getStatIcon('atk')

  useEffect(() => {
    if (!visible) setConfirmingTransfer(false)
  }, [visible])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            disabled={isBattleLoading || isTransferring}
          >
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>

          <ScrollView bounces={false} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.imageBox}>
                  <Image
                    source={{ uri: pokefood.pixelArtUrl ?? pokefood.imageUrl }}
                    style={styles.image}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.headerInfo}>
                  <MarqueeText
                    text={pokefood.name}
                    style={styles.pokefoodName}
                  />
                  <View style={styles.badgeRow}>
                    <RarityBadge rarity={pokefood.rarity} />
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{displayedTypeLabel}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Stats & Nutrition */}
            <View style={styles.twoCol}>
              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Core Stats</Text>
                <View style={styles.statsBody}>
                  {hpIcon && (
                    <StatBar
                      label="HP"
                      current={pokefood.hp}
                      max={statScaleMax}
                      color="#FF6B6B"
                      iconSrc={hpIcon.src}
                      iconAlt="Health Points"
                      showMax={false}
                    />
                  )}
                  {atkIcon && (
                    <StatBar
                      label="ATK"
                      current={pokefood.atk}
                      max={statScaleMax}
                      color="#FFA500"
                      iconSrc={atkIcon.src}
                      iconAlt="Attack Power"
                      showMax={false}
                    />
                  )}
                </View>
              </View>

              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Nutrition</Text>
                <View style={styles.statsBody}>
                  {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => {
                    const icon = getNutritionIcon(key)
                    const value = pokefood.nutritionInfo[key]
                    const label = key.charAt(0).toUpperCase() + key.slice(1)
                    return (
                      <View key={key} style={styles.nutritionRow}>
                        {icon && <InlineIcon src={icon.src} alt={label} size="sm" />}
                        <Text style={styles.nutritionText}>
                          {label}:{' '}
                          <Text style={styles.nutritionValue}>
                            {value}{key !== 'calories' ? 'g' : ''}
                          </Text>
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>

            {/* Moves */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>Moves</Text>
              <View style={styles.movesGrid}>
                {pokefood.moves.map((move) => {
                  const typeIcon = getTypeIcon(move.type)
                  return (
                    <View key={move.id} style={styles.moveItem}>
                      <View style={styles.moveLeft}>
                        {typeIcon && (
                          <InlineIcon src={typeIcon.src} alt={move.type} size="sm" />
                        )}
                        <View style={styles.moveName}>
                          <MarqueeText text={move.name} style={styles.moveNameText} />
                        </View>
                      </View>
                      <Text style={styles.movePower}>PWR {move.power}</Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Battle button */}
            {onBattle && (
              <TouchableOpacity
                style={[styles.primaryButton, (isBattleLoading || isTransferring) && styles.dimmed]}
                onPress={() => void onBattle(pokefood)}
                disabled={isBattleLoading || isTransferring}
              >
                {isBattleLoading && (
                  <ActivityIndicator color={AppColors.onPrimary} size="small" style={styles.spinner} />
                )}
                <Text style={styles.primaryButtonText}>
                  {isBattleLoading ? 'Finding match...' : 'Battle'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Transfer */}
            {onTransfer && (
              confirmingTransfer ? (
                <View style={styles.confirmCard}>
                  <Text style={styles.confirmText}>
                    Transfer <Text style={styles.confirmName}>{pokefood.name}</Text>? This cannot be undone.
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, isTransferring && styles.dimmed]}
                      onPress={() => void handleConfirmTransfer()}
                      disabled={isTransferring}
                    >
                      {isTransferring && (
                        <ActivityIndicator color="#f87171" size="small" style={styles.spinner} />
                      )}
                      <Text style={styles.confirmBtnText}>
                        {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setConfirmingTransfer(false)}
                      disabled={isTransferring}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.secondaryButton, (isBattleLoading || isTransferring) && styles.dimmed]}
                  onPress={() => setConfirmingTransfer(true)}
                  disabled={isBattleLoading || isTransferring}
                >
                  <Text style={styles.secondaryButtonText}>Transfer</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 20, color: AppColors.onSurfaceVariant },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  headerCard: {
    borderRadius: 12,
    backgroundColor: AppColors.surfaceContainerHigh,
    padding: 16,
  },
  headerRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  headerInfo: { flex: 1, gap: 8, minWidth: 0 },
  pokefoodName: { fontSize: 18, color: AppColors.onSurface, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  typeBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    color: AppColors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  twoCol: { flexDirection: 'row', gap: 12 },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceContainerHigh,
    padding: 16,
  },
  sectionTitle: { fontSize: 12, color: AppColors.onSurface, marginBottom: 12 },
  statsBody: { gap: 12 },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nutritionText: { fontSize: 11, color: AppColors.onSurfaceVariant, flex: 1 },
  nutritionValue: { color: AppColors.onSurface },
  movesGrid: { gap: 8 },
  moveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moveLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  moveName: { flex: 1, minWidth: 0 },
  moveNameText: { fontSize: 11, color: AppColors.onSurfaceVariant },
  movePower: { fontSize: 10, color: AppColors.onSurfaceVariant, flexShrink: 0 },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: AppColors.onPrimary, fontSize: 12 },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: AppColors.onSurfaceVariant, fontSize: 12 },
  dimmed: { opacity: 0.8 },
  spinner: { marginRight: 4 },
  confirmCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainerHigh,
    padding: 16,
    gap: 12,
  },
  confirmText: { fontSize: 12, color: AppColors.onSurfaceVariant },
  confirmName: { color: AppColors.onSurface },
  confirmButtons: { flexDirection: 'row', gap: 8 },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: { fontSize: 11, color: '#f87171' },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 11, color: AppColors.onSurface },
  marqueeTrack: { overflow: 'hidden', flex: 1 },
  marqueeText: {},
})
