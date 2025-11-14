import * as esbuild from 'esbuild'
import { readFileSync, copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin to compile Tailwind + autoprefixer for the widget CSS
const inlineCssPlugin = {
  name: 'inline-css',
  setup(build) {
    const cssFilter = /\.css(?:\?inline)?$/

    build.onResolve({ filter: cssFilter }, (args) => {
      const inline = args.path.endsWith('?inline')
      const cleanedPath = args.path.replace(/\?inline$/, '')
      if (!cleanedPath.endsWith('widget.css')) return

      return {
        path: resolve(args.resolveDir, cleanedPath),
        namespace: 'inline-css',
        pluginData: { inline },
      }
    })

    build.onLoad({ filter: /.*/, namespace: 'inline-css' }, async (args) => {
      const css = readFileSync(args.path, 'utf8')
      const result = await postcss([tailwindcss(), autoprefixer()]).process(css, {
        from: args.path,
      })

      if (args.pluginData?.inline) {
        return {
          contents: `export default ${JSON.stringify(result.css)}`,
          loader: 'js',
        }
      }

      return {
        contents: result.css,
        loader: 'css',
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
        'process.env.NEXT_PUBLIC_WIDGET_API_URL': JSON.stringify(
          process.env.NEXT_PUBLIC_WIDGET_API_URL ?? ''
        ),
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
