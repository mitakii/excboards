import { cpSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Self-host Excalidraw's canvas fonts instead of fetching them from esm.sh at runtime
function excalidrawFonts(): Plugin {
  let outDir = 'dist'
  return {
    name: 'excalidraw-fonts',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      cpSync(
        path.resolve(__dirname, 'node_modules/@excalidraw/excalidraw/dist/prod/fonts'),
        path.join(outDir, 'fonts'),
        { recursive: true },
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), excalidrawFonts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
