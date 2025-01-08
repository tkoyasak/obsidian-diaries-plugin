import { Notice, Plugin } from 'obsidian'
import { Entries } from './features/entries.ts'
import { type Settings, defaultSettings } from './settings.ts'
import { DiffView } from './ui/diff.ts'
import { SettingTab } from './ui/setting-tab.ts'
import { SourceControlView } from './ui/source-control.ts'

export default class ObsidianPlugin extends Plugin {
  private settings!: Settings
  private entries!: Entries

  public override async onload(): Promise<void> {
    this.settings = await this.loadSettings()
    this.entries = new Entries(this.app, this.settings)

    /**
     * add commands
     */
    this.addCommand({
      id: 'create-new-entry',
      name: 'Create New Entry',
      callback: async () => {
        await this.entries.createNewEntry()
      },
    })

    /**
     * register views
     */
    this.registerView(SourceControlView.type, (leaf) => {
      return new SourceControlView(leaf)
    })
    this.registerView(DiffView.type, (leaf) => {
      return new DiffView(leaf)
    })

    /**
     * add ribbon icons
     */
    this.addRibbonIcon(
      SourceControlView.icon,
      SourceControlView.name,
      async () => {
        await this.activateView(SourceControlView.type, 'left')
      },
    )

    /**
     * add setting tab
     */
    this.addSettingTab(new SettingTab(this, this.settings))
  }

  public override onunload(): void {}

  public async loadSettings(): Promise<Settings> {
    return Object.assign({}, defaultSettings, await this.loadData())
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }

  private async activateView(
    type: string,
    place?: 'left' | 'right' | 'root',
    newLeaf?: boolean,
  ): Promise<void> {
    const ws = this.app.workspace
    const leaf = newLeaf
      ? ws.getLeaf(true)
      : (ws.getLeafById(type) ??
        (place === 'left'
          ? ws.getLeftLeaf(false)
          : place === 'right'
            ? ws.getRightLeaf(false)
            : ws.getLeaf(false)))

    if (!leaf) {
      new Notice(`ERROR: Failed to open view: \`${type}\`.`)
      return
    }

    await leaf.setViewState({ type, active: true })
    await ws.revealLeaf(leaf)
  }
}
