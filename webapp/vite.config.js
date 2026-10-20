import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/x86-64-playground/',
  plugins: [svelte()],
  assetsInclude: ['**/*.elf'],
})
