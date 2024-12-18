export type Settings = {
  newEntriesFolder: string
}

export const DEFAULT_SETTINGS: Settings = {
  newEntriesFolder: 'entries',
} as const
