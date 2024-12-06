import { PluginSettingTab, Setting } from 'obsidian'
import type ObsidianPlugin from '../main.ts'
import type { Settings } from '../settings.ts'

export class SettingTab extends PluginSettingTab {
  constructor(
    private readonly plugin: ObsidianPlugin,
    private readonly settings: Settings,
  ) {
    super(plugin.app, plugin)
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'Settings' })

    new Setting(containerEl)
      .setName('Folder to create new entries in')
      .setDesc('New entries are placed in this folder.')
      .addDropdown((c) => {
        const folders = this.app.vault.getAllFolders()
        c.addOptions(
          folders.reduce((acc, folder) => {
            acc[folder.path] = folder.path
            return acc
          }, {} as Record<string, string>),
        )
          .setValue(this.settings.newEntriesFolder)
          .onChange(async (v) => {
            this.settings.newEntriesFolder = v
            await this.plugin.saveSettings()
          })
      })
  }
}
