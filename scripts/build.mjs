import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  format: 'esm',
  sourcemap: true,
  external: [
    '@deepseek-ai/*',
    '@deepseek-ai/cordis',
    '@deepseek-ai/dsh-skill',
  ],
})

console.log('Build completed: dist/index.js')
