import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { fromAsyncThrowable } from 'neverthrow'

const exec = fromAsyncThrowable(
  async (args: string[], input?: string): Promise<string> => {
    const child = spawn('/usr/bin/git', args)

    if (input) {
      child.stdin.end(input, 'utf8')
    }

    const [code, stdout, stderr] = await Promise.all([
      new Promise<number>((c, e) => {
        child.once('error', e)
        child.once('exit', c)
      }),
      new Promise<string>((c) => {
        const stream = child.stdout
        const buf: Buffer[] = []
        stream.on('data', (data) => buf.push(data))
        stream.once('close', () => c(Buffer.concat(buf).toString('utf8')))
      }),
      new Promise<string>((c) => {
        const stream = child.stderr
        const buf: Buffer[] = []
        stream.on('data', (data) => buf.push(data))
        stream.once('close', () => c(Buffer.concat(buf).toString('utf8')))
      }),
    ])

    if (code) {
      console.error(stderr)
      throw new Error(
        `GIT_COMMAND_FAILED: \`git ${args.join(' ')}\` exited with ${code}.`,
      )
    }

    return stdout
  },
  (e) => {
    return (e as Error).message
  },
)

const noop = () => {}

/**
 * `git add [--update] <path>`
 */
export function add(path: string, update?: boolean) {
  return exec(update ? ['add', '--update', path] : ['add', path]).map(noop)
}

/**
 * `git commit -m <msg>`
 */
export function commit(msg: string) {
  return exec(['commit', '-m', msg]).map(noop)
}

/**
 * `git diff [--cached] <path>`
 */
export function diff(path: string, cached?: boolean) {
  return exec(cached ? ['diff', '--cached', path] : ['diff', path])
}

/**
 * `git diff --name-only [--cached]`
 */
export function diffFiles(cached?: boolean) {
  return exec(
    cached ? ['diff', '--name-only', '--cached'] : ['diff', '--name-only'],
  ).map((stdout) => stdout.split('\n').filter(Boolean))
}

/**
 * `git pull origin main`
 */
export function pull() {
  return exec(['pull', 'origin', 'main']).map(noop)
}

/**
 * `git push origin main`
 */
export function push() {
  return exec(['push', 'origin', 'main']).map(noop)
}

/**
 * `git restore [--staged] <path>`
 */
export function restore(path: string, cached?: boolean) {
  return exec(cached ? ['restore', '--staged', path] : ['restore', path]).map(
    noop,
  )
}

/**
 * `git show <hash>:<path>`
 */
export function show(hash: string, path: string) {
  return exec(['show', `${hash}:${path}`])
}

/**
 * `git hash-object -w --stdin <path>`
 * `git update-index --cacheinfo 100644 <hash> <path>`
 */
export function stage(path: string, data: string) {
  return exec(['hash-object', '-w', '--stdin', path], data)
    .andThen((hash) =>
      exec(['update-index', '--cacheinfo', '100644', hash, path]),
    )
    .map(noop)
}
