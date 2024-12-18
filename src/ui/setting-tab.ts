import { PluginSettingTab, Setting } from 'obsidian'
import ObsidianPlugin from '../main.ts'
import { Settings } from '../settings.ts'

export class SettingTab extends PluginSettingTab {
  constructor(
    private readonly plugin: ObsidianPlugin,
    private readonly settings: Settings,
  ) {
    super(plugin.app, plugin)
  }

  public display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'Entries' })

    new Setting(containerEl)
      .setName('Folder to create new entries in')
      .setDesc('New entries are placed in this folder.')
      .addDropdown((c) => {
        c
          .setDisabled(true)
          .addOption('default', this.settings.newEntriesFolder)
      })
  }
}
