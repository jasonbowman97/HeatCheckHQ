/**
 * Lightweight event bus for the Command Palette → Prop Analyzer communication.
 *
 * When a player is selected from ⌘K while already on /check,
 * router.push won't re-mount the page. This event bus lets the
 * command palette notify the Prop Analyzer to load a new player.
 */

type CommandSelectHandler = (playerId: string) => void

const listeners = new Set<CommandSelectHandler>()

export const commandEvents = {
  /** Subscribe to player-select events from the command palette */
  onPlayerSelect(handler: CommandSelectHandler) {
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  },

  /** Emit a player-select event (called by CommandPalette) */
  emitPlayerSelect(playerId: string) {
    listeners.forEach((handler) => handler(playerId))
  },
}
