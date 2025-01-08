import { history, indentWithTab, standardKeymap } from '@codemirror/commands'
import { MergeView } from '@codemirror/merge'
import { highlightSelectionMatches, search } from '@codemirror/search'
import { EditorState, Transaction } from '@codemirror/state'
import {
  EditorView,
  ViewPlugin,
  drawSelection,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import {
  type Debouncer,
  type IconName,
  ItemView,
  Notice,
  type ViewStateResult,
  type WorkspaceLeaf,
  debounce,
} from 'obsidian'
import { show } from '../lib/git.ts'
import { buildEvent } from '../utils.ts'

type DiffTarget = {
  path: string
  cached: boolean
}

export class DiffView extends ItemView {
  public static readonly type = 'diff'
  public static readonly name = 'Diff'
  public static readonly icon = 'diff'

  private state: DiffTarget | undefined
  private mergeView!: MergeView
  private fileSave: Debouncer<[string], void>
  private updating: boolean
  private ignoreNextUpdate: boolean

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
    this.navigation = true

    this.updating = false
    this.ignoreNextUpdate = false
    this.fileSave = debounce(
      async (data: string) => {
        const path = this.state?.path
        if (path && (await this.app.vault.adapter.exists(path))) {
          this.ignoreNextUpdate = true
          await this.app.vault.adapter.write(path, data)
        }
      },
      1000,
      false,
    )

    this.registerEvent(
      buildEvent(this.app, 'git:status-changed', () => {
        if (this.mergeView) {
          this.updateEditor('a')
          this.updateEditor('b')
        } else {
          this.createMergeView()
        }
      }),
    )
    this.registerEvent(
      this.app.vault.on('modify', () => {
        if (this.state?.cached === false) {
          if (this.ignoreNextUpdate) {
            this.ignoreNextUpdate = false
          } else {
            this.updateEditor('b', true)
          }
        }
      }),
    )
  }

  public async onOpen(): Promise<void> {
    await this.createMergeView()
    await super.onOpen()
  }

  public async onClose(): Promise<void> {
    await super.onClose()
  }

  public getViewType(): string {
    return DiffView.type
  }

  public getDisplayText(): string {
    return `${this.state?.path} (${this.state?.cached ? 'staging' : 'working'})`
  }

  public getIcon(): IconName {
    return DiffView.icon
  }

  public async setState(state: DiffTarget, _: ViewStateResult): Promise<void> {
    this.state = state
    await super.setState(state, _)
  }

  public getState(): Record<string, unknown> {
    return this.state ?? {}
  }

  private async getDoc(target: 'a' | 'b'): Promise<string> {
    if (!this.state) return ''

    const { path, cached } = this.state

    const out = (v: string) => v
    const err = (e: string) => {
      new Notice(e)
      return ''
    }

    if (cached) {
      return target === 'a'
        ? await show('HEAD', path).match(out, err)
        : await show('', path).match(out, err)
    }
    return target === 'a'
      ? await show('', path).match(out, err)
      : await this.app.vault.adapter.read(path)
  }

  private async updateEditor(
    target: 'a' | 'b',
    anotate?: boolean,
  ): Promise<void> {
    if (!this.mergeView || this.updating) return

    this.updating = true
    const editor = this.mergeView[target]
    const doc = await this.getDoc(target)
    if (editor.state.doc.toString() !== doc) {
      const tr = editor.state.update({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: doc,
        },
        annotations: anotate ? [Transaction.remote.of(true)] : [],
      })
      editor.dispatch(tr)
    }
    this.updating = false
  }

  private async createMergeView(): Promise<void> {
    if (!this.state || this.updating) return

    this.updating = true
    const bIsEditable = this.state.cached === false

    this.mergeView?.destroy()
    this.contentEl.empty()

    const autoSave = ViewPlugin.define((view) => ({
      update: (update) => {
        if (
          update.docChanged &&
          !update.transactions.some((t) => t.annotation(Transaction.remote))
        ) {
          this.fileSave(view.state.doc.toString())
        }
      },
    }))

    const extensions = (editable: boolean) => [
      lineNumbers(),
      highlightSelectionMatches(),
      drawSelection(),
      keymap.of([...standardKeymap, indentWithTab]),
      history(),
      search(),
      EditorView.lineWrapping,
      ...(editable
        ? [autoSave]
        : [EditorView.editable.of(false), EditorState.readOnly.of(true)]),
    ]

    this.mergeView = new MergeView({
      a: {
        doc: await this.getDoc('a'),
        extensions: extensions(false),
      },
      b: {
        doc: await this.getDoc('b'),
        extensions: extensions(bIsEditable),
      },
      diffConfig: {
        scanLimit: bIsEditable ? 1000 : 10000,
      },
      parent: this.contentEl,
    })

    this.updating = false
  }
}

// どうやら
// this.containerEl.children[0] -> view-header
// this.containerEl.children[1] -> view-content === this.contentEl
// みたい
