import modules from 'node:module'
import process from 'node:process'
import esbuild from 'esbuild'

const prod = process.argv[2] === 'prod'

const options = {
  bundle: true,
  platform: 'node',
  entryPoints: ['./src/main.ts'],
  banner: {
    js: `/**
 * https://github.com/evanw/esbuild
 * ${new Date().toISOString()}
 */`,
  },
  format: 'cjs',
  outfile: './dist/main.js',
  external: [
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    'electron',
    'obsidian',
    ...modules.builtinModules,
  ],
  target: 'es2023',
  minify: prod,
  treeShaking: true,
  sourcemap: prod ? false : 'inline',
  logLevel: 'info',
} satisfies esbuild.BuildOptions

const context = await esbuild.context(options)

if (prod) {
  await context.rebuild()
  await context.dispose()
} else {
  await context.watch()
}
