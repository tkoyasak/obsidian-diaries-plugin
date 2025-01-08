import { err, ok } from 'neverthrow'
import { type App, Notice, normalizePath, moment } from 'obsidian'
import { add, commit, diffFiles, push } from '../lib/git.ts'
import type { Settings } from '../settings.ts'

export class Entries {
  constructor(
    private readonly app: App,
    private readonly settings: Settings,
  ) {}

  public async createNewEntry(): Promise<void> {
    const m = moment()
    const id = m.format('YYYYMM')
    const path = normalizePath(`${this.settings.newEntriesFolder}/${id}.md`)

    if (this.app.vault.getFileByPath(path)) {
      new Notice(`ERROR: The entry for \`${id}\` already exists.`)
      return
    }

    const file = await this.app.vault.create(path, template(m, id))

    await recordNewEntry(file.path, id)
    await this.app.workspace.getLeaf().openFile(file)
  }
}

function template(m: moment.Moment, id: string): string {
  const dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const created = m.format('YYYY-MM-DD')
  const n = m.daysInMonth()
  const w = m.startOf('month').weekday()

  const content = [
    `---
id: ${id}
created_at: ${created}
modified_at: ${created}
---
`,
  ]
  for (let i = 1; i <= n; i++) {
    const dd = i.toString().padStart(2, '0')
    const ddd = dow[(w + i - 1) % 7]
    content.push(`
###### ${id}${dd}${ddd}


`)
  }
  return content.join('')
}

async function recordNewEntry(path: string, id: string): Promise<void> {
  await add(path)
    .andThen(() => diffFiles(true))
    .andThen((files) =>
      files.length > 1
        ? err('ERROR: Multiple files are staged. Please commit manually.')
        : ok(`create ${id} entry`),
    )
    .andThen(commit)
    .andThen(push)
    .mapErr((e) => {
      new Notice(e)
    })
}
