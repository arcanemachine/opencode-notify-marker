/**
 * notifier-marker
 * Marker file plugin for OpenCode
 *
 * Creates marker files in /workspace/tmp/notifier/ when specific events occur.
 * Useful for external monitoring scripts to detect when AI needs attention.
 *
 * Features:
 * - Creates marker files for session.idle, session.error, permission.updated events
 * - Creates marker file for question tool execution
 * - Parent session only (no spam from child sessions)
 * - No terminal detection, no quiet hours, no sounds
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { Plugin } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"

const PI_NOTIFY_MARKER_DIR = process.env.MARKER_DIR || "/tmp/opencode-notify-marker-files"

interface MarkerConfig {
  /** Create markers for child/sub-session events (default: false) */
  notifyChildSessions: boolean
}

const DEFAULT_CONFIG: MarkerConfig = {
  notifyChildSessions: false,
}

async function loadConfig(): Promise<MarkerConfig> {
  const configPath = path.join(
    typeof process.env.HOME !== "undefined" ? process.env.HOME : "/root",
    ".config",
    "opencode",
    "opencode-notify-marker.json",
  )

  try {
    const content = await fs.readFile(configPath, "utf8")
    const userConfig = JSON.parse(content) as Partial<MarkerConfig>
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

async function isParentSession(client: any, sessionID: string): Promise<boolean> {
  try {
    const session = await client.session.get({ path: { id: sessionID } })
    return !session.data?.parentID
  } catch {
    return true
  }
}

async function createMarker(eventName: string): Promise<void> {
  try {
    await fs.mkdir(MARKER_DIR, { recursive: true })
    const markerPath = path.join(MARKER_DIR, eventName)
    await fs.writeFile(markerPath, JSON.stringify({ created: new Date().toISOString() }))
  } catch {
    // Silently fail - markers are best-effort
  }
}

async function handleSessionIdle(client: any, sessionID: string, config: MarkerConfig): Promise<void> {
  if (!config.notifyChildSessions) {
    const isParent = await isParentSession(client, sessionID)
    if (!isParent) return
  }
  await createMarker("SESSION_IDLE")
}

async function handleSessionError(client: any, sessionID: string, config: MarkerConfig): Promise<void> {
  if (!config.notifyChildSessions) {
    const isParent = await isParentSession(client, sessionID)
    if (!isParent) return
  }
  await createMarker("SESSION_ERROR")
}

async function handlePermissionUpdated(config: MarkerConfig): Promise<void> {
  await createMarker("PERMISSION_UPDATED")
}

async function handleQuestionAsked(config: MarkerConfig): Promise<void> {
  await createMarker("TOOL_EXECUTE_BEFORE")
}

export const NotifierMarkerPlugin: Plugin = async (ctx) => {
  const { client } = ctx
  const config = await loadConfig()

  return {
    "tool.execute.before": async (input: { tool: string; sessionID: string; callID: string }) => {
      if (input.tool === "question") {
        await handleQuestionAsked(config)
      }
    },
    event: async ({ event }: { event: Event }): Promise<void> => {
      switch (event.type) {
        case "session.idle": {
          const sessionID = event.properties.sessionID
          if (sessionID) {
            await handleSessionIdle(client, sessionID, config)
          }
          break
        }
        case "session.error": {
          const sessionID = event.properties.sessionID
          if (sessionID) {
            await handleSessionError(client, sessionID, config)
          }
          break
        }
        case "permission.updated": {
          await handlePermissionUpdated(config)
          break
        }
      }
    },
  }
}

export default NotifierMarkerPlugin
