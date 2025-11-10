import * as esbuild from 'esbuild'
import { readFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin to handle CSS imports with ?inline
const inlineCssPlugin = {
  name: 'inline-css',
  setup(build) {
    build.onResolve({ filter: /\.css\?inline$/ }, (args) => ({
      path: resolve(args.resolveDir, args.path.replace('?inline', '')),
      namespace: 'inline-css',
    }))

    build.onLoad({ filter: /.*/, namespace: 'inline-css' }, (args) => {
      const css = readFileSync(args.path, 'utf8')
      return {
        contents: `export default ${JSON.stringify(css)}`,
        loader: 'js',
      }
    })
  },
}

async function buildWidget() {
  try {
    // Build widget to dist folder
    await esbuild.build({
      entryPoints: [resolve(__dirname, '../src/widget.tsx')],
      bundle: true,
      minify: true,
      sourcemap: true,
      format: 'iife',
      globalName: 'HandleChatWidget',
      outfile: 'dist/widget.js',
      plugins: [inlineCssPlugin],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
    })
    console.log('✓ Widget build completed successfully')

    // Copy to public folder for Next.js to serve
    const publicDir = resolve(__dirname, '../public')
    mkdirSync(publicDir, { recursive: true })
    copyFileSync(
      resolve(__dirname, '../dist/widget.js'),
      resolve(publicDir, 'widget.js')
    )
    copyFileSync(
      resolve(__dirname, '../dist/widget.js.map'),
      resolve(publicDir, 'widget.js.map')
    )
    console.log('✓ Widget copied to public folder')
  } catch (error) {
    console.error('✗ Widget build failed:', error)
    process.exit(1)
  }
}

buildWidget()
