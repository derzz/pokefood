import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildBattleWebSocketUrl } from '../api'
import type {
  BattleActionResult,
  BattleMatchSession,
  BattleRoomSnapshot,
  Move,
  Pokefood,
} from '../types'
import { StatBar } from '../components/StatBar'
import { MoveButton } from '../components/MoveButton'
import { RarityBadge } from '../components/RarityBadge'

interface BattleScreenProps {
  playerPokefood: Pokefood
  matchSession: BattleMatchSession
  onExit: () => void
}

type WsEvent = {
  type: string
  payload: unknown
}

function toRawBase64(imageUrl: string): string {
  const parts = imageUrl.split(',')
  return parts.length > 1 ? parts[1] : imageUrl
}

function toDataUrl(base64: string): string {
  if (base64.startsWith('data:image')) {
    return base64
  }
  return `data:image/png;base64,${base64}`
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
      moves: pokefood.moves.map((move) => ({
        name: move.name,
        damage: move.power,
      })),
    },
  }
}

type BattleAnimationPhase = 'idle' | 'player-attack' | 'opponent-attack'

/** Total window (ms) before animation state resets to idle. */
const ATTACK_ANIMATION_TOTAL_MS = 580

function spriteClasses(side: 'player' | 'opponent', phase: BattleAnimationPhase): string {
  if (side === 'player') {
    if (phase === 'player-attack') return 'battle-sprite--lunge-right'
    if (phase === 'opponent-attack') return 'battle-sprite--recoil-left'
  } else {
    if (phase === 'opponent-attack') return 'battle-sprite--lunge-left'
    if (phase === 'player-attack') return 'battle-sprite--recoil-right'
  }
  return ''
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  playerPokefood,
  matchSession,
  onExit,
}) => {
  const [roomState, setRoomState] = useState<BattleRoomSnapshot | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>(['Connecting to battle server...'])
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [battleAnimation, setBattleAnimation] = useState<BattleAnimationPhase>('idle')
  const [showClashFlash, setShowClashFlash] = useState(false)
  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<number | null>(null)
  const animationTimerRef = useRef<number | null>(null)

  const playerSnapshot = roomState?.players[matchSession.playerId] || null
  const opponentSnapshot = useMemo(() => {
    if (!roomState) {
      return null
    }
    return roomState.players[matchSession.opponentId] || null
  }, [roomState, matchSession.opponentId])

  const playerHp = playerSnapshot?.current_hp ?? playerPokefood.hp
  const opponentHp = opponentSnapshot?.current_hp ?? opponentSnapshot?.pokefood?.hp ?? 0
  const isPlayerTurn = roomState?.turn_player_id === matchSession.playerId
  const isFinished = roomState?.status === 'finished' || winnerId !== null
  const wsUrl = useMemo(() => buildBattleWebSocketUrl(matchSession), [matchSession])
  const joinPayload = useRef(() => buildJoinPayload(playerPokefood))

  useEffect(() => {
    joinPayload.current = () => buildJoinPayload(playerPokefood)
  }, [playerPokefood])

  const triggerAttackAnimation = useCallback((attacker: 'player' | 'opponent') => {
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    setBattleAnimation(attacker === 'player' ? 'player-attack' : 'opponent-attack')
    setShowClashFlash(true)
    animationTimerRef.current = window.setTimeout(() => {
      setBattleAnimation('idle')
      setShowClashFlash(false)
      animationTimerRef.current = null
    }, ATTACK_ANIMATION_TOTAL_MS)
  }, [])

  useEffect(() => {
    let isDisposed = false

    setBattleLog(['Connecting to battle server...'])
    setErrorMessage(null)
    setWinnerId(null)
    setIsConnected(false)

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const connect = () => {
      const websocket = new WebSocket(wsUrl)
      websocketRef.current = websocket

      websocket.onopen = () => {
        if (isDisposed || websocketRef.current !== websocket) {
          websocket.close()
          return
        }
        setIsConnected(true)
        setBattleLog((prev) => [...prev, `Match found. Go! ${playerPokefood.name}!`])
        websocket.send(JSON.stringify({ type: 'join', payload: joinPayload.current() }))
        websocket.send(JSON.stringify({ type: 'ready', payload: {} }))
      }

      websocket.onmessage = (messageEvent) => {
        if (isDisposed || websocketRef.current !== websocket) {
          return
        }

        const incoming = JSON.parse(messageEvent.data) as WsEvent

        if (incoming.type === 'error') {
          const payload = incoming.payload as { message?: string }
          const message = payload.message || 'Battle connection error'
          setErrorMessage(message)
          console.error(message)
          setBattleLog((prev) => [...prev, message])
          return
        }

        if (incoming.type === 'state_update') {
          setRoomState(incoming.payload as BattleRoomSnapshot)
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
          setBattleLog((prev) => [...prev, result.winner_id === matchSession.playerId ? 'Victory!' : 'Defeat!'])
          return
        }
      }

      websocket.onerror = () => {
        if (isDisposed || websocketRef.current !== websocket) {
          return
        }
        setErrorMessage('Battle socket connection failed. Retrying...')
      }

      websocket.onclose = () => {
        if (isDisposed || websocketRef.current !== websocket) {
          return
        }
        setIsConnected(false)

        const nextAttempt = reconnectAttemptsRef.current + 1
        if (nextAttempt > 4) {
          setBattleLog((prev) => [...prev, 'Could not connect to battle server. Please return and retry.'])
          return
        }

        reconnectAttemptsRef.current = nextAttempt
        const retryDelayMs = Math.min(1200, nextAttempt * 300)
        setBattleLog((prev) => [...prev, `Connection dropped. Retrying (${nextAttempt}/4)...`])
        reconnectTimerRef.current = window.setTimeout(connect, retryDelayMs)
      }
    }

    connect()

    return () => {
      isDisposed = true
      clearReconnectTimer()
      reconnectAttemptsRef.current = 0
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current)
        animationTimerRef.current = null
      }
      const websocket = websocketRef.current
      if (websocket) {
        websocket.close()
      }
      websocketRef.current = null
    }
  }, [matchSession.playerId, triggerAttackAnimation, wsUrl])

  const handleMoveSelect = (move: Move) => {
    const websocket = websocketRef.current
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      setBattleLog((prev) => [...prev, 'Connection is not ready yet.'])
      return
    }
    if (isFinished || !isPlayerTurn) return

    websocket.send(JSON.stringify({ type: 'action', payload: { move: move.name } }))
  }

  const opponentName = opponentSnapshot?.pokefood?.personal_name || 'Waiting for opponent...'
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
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <button className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-4 py-2 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] md:text-sm" onClick={onExit}>
        Exit Battle
      </button>

      <div className={`relative rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-4 md:p-6 ${battleAnimation !== 'idle' ? 'battle-arena--shaking' : ''}`}>
        {/* Clash flash — appears at the horizontal midpoint between sprites */}
        {showClashFlash && <div className="battle-clash-flash" />}

        {/* Sprites side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Player (left) */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="space-y-1">
              <h3 className="text-xs text-[var(--color-on-surface)] md:text-sm">{playerPokefood.name}</h3>
              <RarityBadge rarity={playerPokefood.rarity} />
            </div>
            {/* overflow-visible so the sprite can travel outside its box during the lunge */}
            <div className="relative flex h-36 w-36 items-center justify-center overflow-visible md:h-44 md:w-44">
              <img
                src={playerPokefood.pixelArtUrl || playerPokefood.imageUrl}
                alt={playerPokefood.name}
                className={`battle-sprite h-full w-full object-contain ${spriteClasses('player', battleAnimation)}`.trim()}
              />
            </div>
            <StatBar
              label="HP"
              current={playerHp}
              max={playerPokefood.hp}
              color="#FF6B6B"
              className="w-full"
            />
          </div>

          {/* Opponent (right) */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="space-y-1">
              <h3 className="text-xs text-[var(--color-on-surface)] md:text-sm">{opponentName}</h3>
              <RarityBadge rarity="Common" />
            </div>
            {/* overflow-visible so the sprite can travel outside its box during the lunge */}
            <div className="relative flex h-36 w-36 items-center justify-center overflow-visible md:h-44 md:w-44">
              {opponentImage ? (
                <img
                  src={opponentImage}
                  alt={opponentName}
                  className={`battle-sprite h-full w-full object-contain ${spriteClasses('opponent', battleAnimation)}`.trim()}
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] text-xs text-[var(--color-on-surface-variant)]">
                  Matchmaking...
                </div>
              )}
            </div>
            <StatBar
              label="HP"
              current={opponentHp}
              max={opponentSnapshot?.pokefood?.hp || 1}
              color="#FF6B6B"
              className="w-full"
            />
          </div>
        </div>

        {/* Battle Log */}
        <div className="mt-4 max-h-32 space-y-1 overflow-y-auto rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] p-3 md:p-4">
          {battleLog.map((log, idx) => (
            <p key={idx} className="text-[10px] text-[var(--color-on-surface-variant)] md:text-xs">{log}</p>
          ))}
          {errorMessage && <p className="text-[10px] text-red-400 md:text-xs">{errorMessage}</p>}
        </div>
      </div>

      {/* Battle Controls */}
      <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-4 md:p-6">
        {!isFinished ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {playerPokefood.moves.map((move) => (
              <MoveButton
                key={move.id}
                move={move}
                onSelect={handleMoveSelect}
                disabled={!isConnected || !isPlayerTurn}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl text-[var(--color-on-surface)] md:text-3xl">
              {victoryLabel}
            </h2>
            <button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs text-[var(--color-on-primary)] transition hover:brightness-110 md:text-sm" onClick={onExit}>Return to Collection</button>
          </div>
        )}
      </div>
    </div>
  )
}
