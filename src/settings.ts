export type Settings = {
  newEntriesFolder: string
}

export const defaultSettings: Settings = {
  newEntriesFolder: 'entries',
} as const
