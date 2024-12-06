import { type App, moment, normalizePath, Notice } from 'obsidian'
import { Settings } from '../settings.ts'

export class NewNotes {
  constructor(
    private readonly app: App,
    private readonly settings: Settings,
  ) {}

  /**
   * Create a new note with a unique id.
   */
  public async createNewNote(): Promise<void> {
    const id = moment().format('YYYYMM')
    const path = normalizePath(`${this.settings.newEntriesFolder}/${id}.md`)

    if (this.app.vault.getFileByPath(path)) {
      new Notice('Error: Generated id collision. Please try again.')
      return
    }

    const file = await this.app.vault.create(path, entry(id))
    const leaf = this.app.workspace.getLeaf()
    await leaf.openFile(file)
  }
}

const DDD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function entry(id: string): string {
  let content = `---
id: ${id}
created_at:
modified_at:
---
`
  const m = moment(id, 'YYYYMM')
  const n = m.daysInMonth()
  let w = Number.parseInt(m.format('d'), 10)
  for (let i = 1; i <= n; i++) {
    const dd = i.toString().padStart(2, '0')
    const ddd = DDD[w]
    content += `
###### ${id}${dd}${ddd}


`
    w = (w + 1) % 7
  }
  return content
}
