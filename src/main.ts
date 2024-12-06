import { Plugin } from 'obsidian'
import { NewNotes } from './features/new-notes.ts'
import { DEFAULT_SETTINGS, Settings } from './settings.ts'
import { SettingTab } from './ui/setting-tab.ts'

export default class ObsidianPlugin extends Plugin {
  settings!: Settings
  newNotes!: NewNotes

  public override async onload() {
    this.settings = await this.loadSettings()

    this.newNotes = new NewNotes(this.app, this.settings)
    this.addCommand({
      id: 'create-new-note',
      name: 'Create New Note',
      callback: async () => {
        await this.newNotes.createNewNote()
      },
    })

    this.addSettingTab(new SettingTab(this, this.settings))
  }

  public override onunload(): void {
  }

  public async loadSettings(): Promise<Settings> {
    return Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }
}
