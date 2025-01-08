import type { App, EventRef } from 'obsidian'

type CustomEvent = 'git:status-changed'
type EventScope = 'vault' | 'workspace'

function detectScope(name: CustomEvent): EventScope {
  switch (name) {
    case 'git:status-changed':
      return 'workspace'
  }
}

export function buildEvent(
  app: App,
  name: CustomEvent,
  cb: (...data: unknown[]) => unknown,
  ctx?: unknown,
): EventRef {
  const scope = detectScope(name)

  switch (scope) {
    case 'vault':
      // @ts-ignore
      return app.vault.on(name, cb, ctx)
    case 'workspace':
      // @ts-ignore
      return app.workspace.on(name, cb, ctx)
  }
}
