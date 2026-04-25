import React, { useState } from 'react'
import type { Pokefood, Move } from '../types'
import { StatBar } from '../components/StatBar'
import { MoveButton } from '../components/MoveButton'
import { RarityBadge } from '../components/RarityBadge'

interface BattleScreenProps {
  playerPokefood: Pokefood
  opponentPokefood: Pokefood
  onExit: () => void
}

interface BattleState {
  playerHp: number
  opponentHp: number
  playerMp: number
  opponentMp: number
  currentTurn: 'player' | 'opponent'
  battleLog: string[]
  isFinished: boolean
  winner: 'player' | 'opponent' | null
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  playerPokefood,
  opponentPokefood,
  onExit,
}) => {
  const [battleState, setBattleState] = useState<BattleState>({
    playerHp: playerPokefood.hp,
    opponentHp: opponentPokefood.hp,
    playerMp: playerPokefood.mp,
    opponentMp: opponentPokefood.mp,
    currentTurn: 'player',
    battleLog: ['Battle started!'],
    isFinished: false,
    winner: null,
  })

  const handleMoveSelect = (move: Move) => {
    if (battleState.isFinished || battleState.currentTurn !== 'player') return
    if (battleState.playerMp < move.mpCost) {
      setBattleState((prev) => ({
        ...prev,
        battleLog: [...prev.battleLog, 'Not enough MP!'],
      }))
      return
    }

    // Simplified battle logic
    const damage = Math.floor(playerPokefood.atk * (move.power / 100))
    const newOpponentHp = Math.max(0, battleState.opponentHp - damage)
    const newPlayerMp = Math.max(0, battleState.playerMp - move.mpCost)

    const newLog = [
      ...battleState.battleLog,
      `${playerPokefood.name} used ${move.name}!`,
      `${opponentPokefood.name} took ${damage} damage!`,
    ]

    if (newOpponentHp <= 0) {
      setBattleState({
        playerHp: battleState.playerHp,
        opponentHp: 0,
        playerMp: newPlayerMp,
        opponentMp: battleState.opponentMp,
        currentTurn: 'player',
        battleLog: [...newLog, 'Victory!'],
        isFinished: true,
        winner: 'player',
      })
      return
    }

    // Opponent's turn
    setTimeout(() => {
      const opponentMove =
        opponentPokefood.moves[
          Math.floor(Math.random() * opponentPokefood.moves.length)
        ]
      if (!opponentMove) return

      const opponentDamage = Math.floor(
        opponentPokefood.atk * (opponentMove.power / 100)
      )
      const newPlayerHp = Math.max(0, battleState.playerHp - opponentDamage)

      const finalLog = [
        ...newLog,
        `${opponentPokefood.name} used ${opponentMove.name}!`,
        `${playerPokefood.name} took ${opponentDamage} damage!`,
      ]

      if (newPlayerHp <= 0) {
        setBattleState({
          playerHp: 0,
          opponentHp: newOpponentHp,
          playerMp: newPlayerMp,
          opponentMp: battleState.opponentMp,
          currentTurn: 'opponent',
          battleLog: [...finalLog, 'Defeat!'],
          isFinished: true,
          winner: 'opponent',
        })
      } else {
        setBattleState({
          playerHp: newPlayerHp,
          opponentHp: newOpponentHp,
          playerMp: newPlayerMp,
          opponentMp: battleState.opponentMp,
          currentTurn: 'player',
          battleLog: finalLog,
          isFinished: false,
          winner: null,
        })
      }
    }, 1000)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <button className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-4 py-2 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] md:text-sm" onClick={onExit}>
        Exit Battle
      </button>

      <div className="grid gap-4 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-4 md:grid-rows-[1fr_auto_1fr] md:p-6">
        {/* Opponent */}
        <div className="grid place-items-center gap-3 text-center">
          <div className="space-y-2">
            <h3 className="text-sm text-[var(--color-on-surface)] md:text-base">{opponentPokefood.name}</h3>
            <RarityBadge rarity={opponentPokefood.rarity} />
          </div>
          <div className="h-40 w-40 overflow-hidden rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] md:h-48 md:w-48">
            <img
              src={opponentPokefood.pixelArtUrl || opponentPokefood.imageUrl}
              alt={opponentPokefood.name}
              className="h-full w-full object-cover"
            />
          </div>
          <StatBar
            label="HP"
            current={battleState.opponentHp}
            max={opponentPokefood.hp}
            color="#FF6B6B"
            className="w-full max-w-xs"
          />
        </div>

        {/* Battle Log */}
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] p-3 md:p-4">
          {battleState.battleLog.map((log, idx) => (
            <p key={idx} className="text-[10px] text-[var(--color-on-surface-variant)] md:text-xs">{log}</p>
          ))}
        </div>

        {/* Player */}
        <div className="grid place-items-center gap-3 text-center">
          <div className="space-y-2">
            <h3 className="text-sm text-[var(--color-on-surface)] md:text-base">{playerPokefood.name}</h3>
            <RarityBadge rarity={playerPokefood.rarity} />
          </div>
          <div className="h-40 w-40 overflow-hidden rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] md:h-48 md:w-48">
            <img
              src={playerPokefood.pixelArtUrl || playerPokefood.imageUrl}
              alt={playerPokefood.name}
              className="h-full w-full object-cover"
            />
          </div>
          <StatBar
            label="HP"
            current={battleState.playerHp}
            max={playerPokefood.hp}
            color="#FF6B6B"
            className="w-full max-w-xs"
          />
          <StatBar
            label="MP"
            current={battleState.playerMp}
            max={playerPokefood.mp}
            color="#4169E1"
            className="w-full max-w-xs"
          />
        </div>
      </div>

      {/* Battle Controls */}
      <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-4 md:p-6">
        {!battleState.isFinished ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {playerPokefood.moves.map((move) => (
              <MoveButton
                key={move.id}
                move={move}
                onSelect={handleMoveSelect}
                disabled={battleState.playerMp < move.mpCost}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-2xl text-[var(--color-on-surface)] md:text-3xl">
              {battleState.winner === 'player'
                ? 'You Won!'
                : 'You Lost!'}
            </h2>
            <button className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs text-[var(--color-on-primary)] transition hover:brightness-110 md:text-sm" onClick={onExit}>Return to Collection</button>
          </div>
        )}
      </div>
    </div>
  )
}
