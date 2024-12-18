import { App, moment, normalizePath, Notice } from 'obsidian'
import { Settings } from '../settings.ts'

export class Entries {
  constructor(
    private readonly app: App,
    private readonly settings: Settings,
  ) {}

  public async createNewEntry(): Promise<void> {
    const id = moment().format('YYYYMM')
    const path = normalizePath(`${this.settings.newEntriesFolder}/${id}.md`)

    if (this.app.vault.getFileByPath(path)) {
      new Notice(`Error: the entry for \`${id}\` already exists.`)
      return
    }

    const file = await this.app.vault.create(path, entry(id))

    const leaf = this.app.workspace.getLeaf()
    await leaf.openFile(file)
  }
}

function entry(id: string): string {
  const dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const fom = moment(id, 'YYYYMM')
  const n = fom.daysInMonth()
  let w = Number.parseInt(fom.format('d'), 10)
  let content = `---
id: ${id}
created_at:
modified_at:
---
`
  for (let i = 1; i <= n; i++) {
    const dd = i.toString().padStart(2, '0')
    const ddd = dow[w]
    content += `
###### ${id}${dd}${ddd}


`
    w = (w + 1) % 7
  }
  return content
}
