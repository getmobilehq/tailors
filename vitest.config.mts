import { defineConfig } from 'vitest/config'
import path from 'path'

// Standalone config: the app is plain Next.js, so there is no vite.config.ts
// for vitest to inherit. Mirror the "@/*" -> repo root alias from tsconfig.json.
// .mts so Vite loads it as ESM (package.json has no "type": "module").
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './') },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
