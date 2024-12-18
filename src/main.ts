import { Plugin } from 'obsidian'
import { Entries } from './features/entries.ts'
import { DEFAULT_SETTINGS, Settings } from './settings.ts'
import { SettingTab } from './ui/setting-tab.ts'

export default class ObsidianPlugin extends Plugin {
  private settings!: Settings
  private entries!: Entries

  public override async onload(): Promise<void> {
    this.settings = await this.loadSettings()
    this.entries = new Entries(this.app, this.settings)

    this.addCommand({
      id: 'create-new-entry',
      name: 'Create New Entry',
      callback: async () => {
        await this.entries.createNewEntry()
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
