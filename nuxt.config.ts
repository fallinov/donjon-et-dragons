import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Codex — Donjon et Dragons',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/img/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/img/favicon-48.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/img/favicon-96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/img/favicon-180.png' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  nitro: {
    preset: 'vercel',
  },
})
