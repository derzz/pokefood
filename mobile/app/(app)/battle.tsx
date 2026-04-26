import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { buildBattleWebSocketUrl } from '../../lib/api'
import type {
  BattleActionResult,
  BattleMatchSession,
  BattleRoomSnapshot,
  Move,
  Pokefood,
} from '../../lib/types'
import { StatBar } from '../../components/stat-bar'
import { MoveButton } from '../../components/move-button'
import { RarityBadge } from '../../components/rarity-badge'
import { AppColors } from '../../lib/theme'
import { useAppContext } from '../../context/AppContext'

type WsEvent = { type: string; payload: unknown }
type WsErrorPayload = { code?: string; message?: string; retryable?: boolean }
type WsOpponentDisconnectedPayload = { player_id?: string; message?: string }

const MAX_RECONNECT_ATTEMPTS = 4
const AUTO_EXIT_DELAY_MS = 1600
const ATTACK_ANIMATION_TOTAL_MS = 580

function toRawBase64(imageUrl: string): string {
  const parts = imageUrl.split(',')
  return parts.length > 1 ? parts[1] : imageUrl
}

function toDataUrl(base64: string): string {
  return base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`
}

function buildJoinPayload(pokefood: Pokefood): Record<string, unknown> {
  return {
    pokefood: {
      personal_name: pokefood.name,
      name: pokefood.name,
      image_base64: toRawBase64(pokefood.imageUrl),
      labels: ['battle'],
      hp: pokefood.hp,
      type: pokefood.type,
      moves: pokefood.moves.map((m) => ({ name: m.name, damage: m.power })),
    },
  }
}

type AnimPhase = 'idle' | 'player-attack' | 'opponent-attack'

export default function BattleScreen() {
  const { pokefood: pfJson, session: sessJson } = useLocalSearchParams<{
    pokefood: string
    session: string
  }>()
  const { handleBattleResult } = useAppContext()

  const playerPokefood = useMemo<Pokefood>(() => {
    const parsed = JSON.parse(pfJson)
    return { ...parsed, createdAt: new Date(parsed.createdAt) }
  }, [pfJson])

  const matchSession = useMemo<BattleMatchSession>(() => JSON.parse(sessJson), [sessJson])

  const [roomState, setRoomState] = useState<BattleRoomSnapshot | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>(['Connecting to battle server...'])
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const [showClash, setShowClash] = useState(false)

  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldStopReconnectRef = useRef(false)
  const wsUrl = useMemo(() => buildBattleWebSocketUrl(matchSession), [matchSession])

  // Reanimated shared values
  const playerLunge = useSharedValue(0)
  const opponentLunge = useSharedValue(0)
  const playerFlash = useSharedValue(0)
  const opponentFlash = useSharedValue(0)
  const arenaShakeX = useSharedValue(0)
  const clashOpacity = useSharedValue(0)
  const clashScale = useSharedValue(0.5)

  const playerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(playerLunge.value, [0, 0.38, 1], [0, 105, 0]) },
      { translateY: interpolate(playerLunge.value, [0, 0.38, 1], [0, -12, 0]) },
      { scale: interpolate(playerLunge.value, [0, 0.38, 1], [1, 1.22, 1]) },
      { rotate: `${interpolate(playerLunge.value, [0, 0.38, 1], [0, 8, 0])}deg` },
    ],
  }))

  const opponentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(opponentLunge.value, [0, 0.38, 1], [0, -105, 0]) },
      { translateY: interpolate(opponentLunge.value, [0, 0.38, 1], [0, -12, 0]) },
      { scale: interpolate(opponentLunge.value, [0, 0.38, 1], [1, 1.22, 1]) },
      { rotate: `${interpolate(opponentLunge.value, [0, 0.38, 1], [0, -8, 0])}deg` },
    ],
  }))

  const playerFlashStyle = useAnimatedStyle(() => ({ opacity: playerFlash.value }))
  const opponentFlashStyle = useAnimatedStyle(() => ({ opacity: opponentFlash.value }))

  const arenaStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arenaShakeX.value }],
  }))

  const clashStyle = useAnimatedStyle(() => ({
    opacity: clashOpacity.value,
    transform: [{ scale: clashScale.value }],
  }))

  const triggerAttackAnimation = useCallback((attacker: 'player' | 'opponent') => {
    if (animTimerRef.current !== null) {
      clearTimeout(animTimerRef.current)
      animTimerRef.current = null
    }
    setAnimPhase(attacker === 'player' ? 'player-attack' : 'opponent-attack')
    setShowClash(true)

    const lungeSV = attacker === 'player' ? playerLunge : opponentLunge
    const flashSV = attacker === 'player' ? opponentFlash : playerFlash

    lungeSV.value = withTiming(1, { duration: 480, easing: Easing.bezier(0.12, 0.92, 0.22, 1) }, () => {
      lungeSV.value = 0
    })
    flashSV.value = withDelay(160, withSequence(
      withTiming(0.85, { duration: 60 }),
      withTiming(0, { duration: 200 }),
    ))
    arenaShakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    )
    clashOpacity.value = withSequence(
      withTiming(1, { duration: 56 }),
      withTiming(0, { duration: 224 }),
    )
    clashScale.value = withSequence(
      withTiming(1, { duration: 56 }),
      withTiming(1.4, { duration: 224 }),
    )

    animTimerRef.current = setTimeout(() => {
      setAnimPhase('idle')
      setShowClash(false)
      animTimerRef.current = null
    }, ATTACK_ANIMATION_TOTAL_MS)
  }, [playerLunge, opponentLunge, playerFlash, opponentFlash, arenaShakeX, clashOpacity, clashScale])

  useEffect(() => {
    let isDisposed = false
    shouldStopReconnectRef.current = false

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const clearExitTimer = () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }

    const returnUserToHome = (message: string) => {
      clearReconnectTimer()
      clearExitTimer()
      shouldStopReconnectRef.current = true
      setErrorMessage(message)
      setBattleLog((prev) => [...prev, message, 'Returning to collection...'])
      const sock = websocketRef.current
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.close(4400, 'room-error')
      }
      exitTimerRef.current = setTimeout(() => {
        if (!isDisposed) router.back()
      }, AUTO_EXIT_DELAY_MS)
    }

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      websocketRef.current = ws

      ws.onopen = () => {
        if (isDisposed || websocketRef.current !== ws) { ws.close(); return }
        setIsConnected(true)
        setBattleLog((prev) => [...prev, `Match found. Go! ${playerPokefood.name}!`])
        ws.send(JSON.stringify({ type: 'join', payload: buildJoinPayload(playerPokefood) }))
        ws.send(JSON.stringify({ type: 'ready', payload: {} }))
      }

      ws.onmessage = (event) => {
        if (isDisposed || websocketRef.current !== ws) return
        const incoming = JSON.parse(event.data) as WsEvent

        if (incoming.type === 'error') {
          const p = incoming.payload as WsErrorPayload
          const msg = p.message || 'Battle connection error'
          setErrorMessage(msg)
          setBattleLog((prev) => [...prev, msg])
          if (p.code === 'room_error' && p.retryable !== true) returnUserToHome(msg)
          return
        }
        if (incoming.type === 'state_update') {
          setRoomState(incoming.payload as BattleRoomSnapshot)
          return
        }
        if (incoming.type === 'opponent_disconnected') {
          const p = incoming.payload as WsOpponentDisconnectedPayload
          returnUserToHome(p.message || 'Opponent disconnected. Returning to collection...')
          return
        }
        if (incoming.type === 'action_result') {
          const result = incoming.payload as BattleActionResult
          const attacker = result.attacker_id === matchSession.playerId ? 'player' : 'opponent'
          triggerAttackAnimation(attacker)
          setBattleLog((prev) => [
            ...prev,
            `${result.attacker_id} used ${result.move}!`,
            `${result.defender_id} took ${result.damage} damage.`,
          ])
          return
        }
        if (incoming.type === 'battle_end') {
          const result = incoming.payload as BattleActionResult
          setWinnerId(result.winner_id)
          const won = result.winner_id === matchSession.playerId
          setBattleLog((prev) => [...prev, won ? 'Victory!' : 'Defeat!'])
          void handleBattleResult(won ? 'win' : 'loss')
          return
        }
      }

      ws.onerror = () => {
        if (isDisposed || websocketRef.current !== ws) return
        setErrorMessage('Battle socket connection failed. Retrying...')
      }

      ws.onclose = () => {
        if (isDisposed || websocketRef.current !== ws) return
        setIsConnected(false)
        if (shouldStopReconnectRef.current) return

        const nextAttempt = reconnectAttemptsRef.current + 1
        if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
          returnUserToHome('Could not connect to battle server. Please retry from Home.')
          return
        }
        reconnectAttemptsRef.current = nextAttempt
        const delay = Math.min(1200, nextAttempt * 300)
        setBattleLog((prev) => [...prev, `Connection dropped. Retrying (${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})...`])
        reconnectTimerRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      isDisposed = true
      clearReconnectTimer()
      clearExitTimer()
      reconnectAttemptsRef.current = 0
      shouldStopReconnectRef.current = false
      if (animTimerRef.current !== null) clearTimeout(animTimerRef.current)
      websocketRef.current?.close()
      websocketRef.current = null
    }
  }, [matchSession.playerId, triggerAttackAnimation, wsUrl, playerPokefood.name, handleBattleResult])

  const handleMoveSelect = (move: Move) => {
    const ws = websocketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setBattleLog((prev) => [...prev, 'Connection is not ready yet.'])
      return
    }
    if (isFinished || !isPlayerTurn) return
    ws.send(JSON.stringify({ type: 'action', payload: { move: move.name } }))
  }

  const playerSnapshot = roomState?.players[matchSession.playerId] ?? null
  const opponentSnapshot = useMemo(() => {
    if (!roomState) return null
    return roomState.players[matchSession.opponentId] ?? null
  }, [roomState, matchSession.opponentId])

  const playerHp = playerSnapshot?.current_hp ?? playerPokefood.hp
  const opponentHp = opponentSnapshot?.current_hp ?? opponentSnapshot?.pokefood?.hp ?? 0
  const isPlayerTurn = roomState?.turn_player_id === matchSession.playerId
  const isFinished = roomState?.status === 'finished' || winnerId !== null

  const opponentName = opponentSnapshot?.pokefood?.personal_name ?? 'Waiting for opponent...'
  const opponentImage = opponentSnapshot?.pokefood
    ? toDataUrl(opponentSnapshot.pokefood.image_base64)
    : null

  const victoryLabel =
    winnerId === null
      ? 'Battle finished'
      : winnerId === matchSession.playerId
        ? 'You Won!'
        : 'You Lost!'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
          <Text style={styles.exitBtnText}>Exit Battle</Text>
        </TouchableOpacity>

        {/* Arena */}
        <Animated.View style={[styles.arenaCard, arenaStyle]}>
          {/* Clash flash */}
          {showClash && (
            <Animated.View style={[styles.clashFlash, clashStyle]} pointerEvents="none" />
          )}

          {/* Sprites */}
          <View style={styles.spritesRow}>
            {/* Player */}
            <View style={styles.spriteCol}>
              <View style={styles.spriteLabels}>
                <Text style={styles.spriteName}>{playerPokefood.name}</Text>
                <RarityBadge rarity={playerPokefood.rarity} />
              </View>
              <View style={styles.spriteBox}>
                <Animated.View style={[styles.spriteWrapper, playerStyle]}>
                  <Image
                    source={{ uri: playerPokefood.pixelArtUrl ?? playerPokefood.imageUrl }}
                    style={styles.spriteImage}
                    contentFit="contain"
                  />
                </Animated.View>
                <Animated.View style={[styles.flashOverlay, playerFlashStyle]} pointerEvents="none" />
              </View>
              <StatBar label="HP" current={playerHp} max={playerPokefood.hp} color="#FF6B6B" />
            </View>

            {/* Opponent */}
            <View style={styles.spriteCol}>
              <View style={styles.spriteLabels}>
                <Text style={styles.spriteName}>{opponentName}</Text>
                <RarityBadge rarity="Common" />
              </View>
              <View style={styles.spriteBox}>
                {opponentImage ? (
                  <>
                    <Animated.View style={[styles.spriteWrapper, opponentStyle]}>
                      <Image
                        source={{ uri: opponentImage }}
                        style={styles.spriteImage}
                        contentFit="contain"
                      />
                    </Animated.View>
                    <Animated.View style={[styles.flashOverlay, opponentFlashStyle]} pointerEvents="none" />
                  </>
                ) : (
                  <View style={styles.waitingBox}>
                    <Text style={styles.waitingText}>Matchmaking...</Text>
                  </View>
                )}
              </View>
              <StatBar
                label="HP"
                current={opponentHp}
                max={opponentSnapshot?.pokefood?.hp || 1}
                color="#FF6B6B"
              />
            </View>
          </View>

          {/* Battle log */}
          <ScrollView
            style={styles.log}
            contentContainerStyle={styles.logContent}
            nestedScrollEnabled
          >
            {battleLog.map((line, idx) => (
              <Text key={idx} style={styles.logLine}>{line}</Text>
            ))}
            {errorMessage && <Text style={styles.logError}>{errorMessage}</Text>}
          </ScrollView>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controlsCard}>
          {!isFinished ? (
            <View style={styles.movesGrid}>
              {playerPokefood.moves.map((move) => (
                <MoveButton
                  key={move.id}
                  move={move}
                  onSelect={handleMoveSelect}
                  disabled={!isConnected || !isPlayerTurn}
                />
              ))}
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>{victoryLabel}</Text>
              <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
                <Text style={styles.returnBtnText}>Return to Collection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.surface },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  exitBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  exitBtnText: { fontSize: 11, color: AppColors.onSurface },
  arenaCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    padding: 16,
    overflow: 'visible',
  },
  clashFlash: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  spritesRow: { flexDirection: 'row', gap: 12 },
  spriteCol: { flex: 1, alignItems: 'center', gap: 10 },
  spriteLabels: { alignItems: 'center', gap: 4 },
  spriteName: { fontSize: 11, color: AppColors.onSurface, textAlign: 'center' },
  spriteBox: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  spriteWrapper: { width: '100%', height: '100%' },
  spriteImage: { width: '100%', height: '100%' },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  waitingBox: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: { fontSize: 10, color: AppColors.onSurfaceVariant },
  log: {
    maxHeight: 120,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainerHigh,
  },
  logContent: { padding: 12, gap: 4 },
  logLine: { fontSize: 10, color: AppColors.onSurfaceVariant },
  logError: { fontSize: 10, color: '#f87171' },
  controlsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    padding: 16,
  },
  movesGrid: { gap: 10 },
  resultContainer: { alignItems: 'center', gap: 16 },
  resultTitle: { fontSize: 22, color: AppColors.onSurface, fontWeight: 'bold' },
  returnBtn: {
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  returnBtnText: { color: AppColors.onPrimary, fontSize: 12 },
})
