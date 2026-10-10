import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NUXT_E2E !== 'true' },

  // Les fiches vivent dans IndexedDB, côté client uniquement : pas de rendu serveur
  ssr: false,
  spaLoadingTemplate: true,

  modules: ['@vite-pwa/nuxt'],

  // Application installable et utilisable hors ligne (service worker Workbox)
  pwa: {
    // Mise à jour proposée par un bandeau, jamais imposée en pleine partie
    registerType: 'prompt',
    manifest: {
      name: 'Codex — Donjon et Dragons',
      short_name: 'Codex D&D',
      description: 'Fiches de personnages D&D 5e, enregistrées sur l\'appareil.',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#0b0907',
      background_color: '#0b0907',
      icons: [
        { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Coquille de l'app : la page pré-rendue sert toutes les routes hors ligne
      navigateFallback: '/',
      // Exclus : portraits (copiés dans IndexedDB au premier lancement), icônes et favicons (gardés par le système)
      globPatterns: ['**/*.{js,css,html,woff2,svg}', 'img/fog*.png'],
      cleanupOutdatedCaches: true,
    },
    client: {
      // Intercepte beforeinstallprompt (Android/Chrome) pour proposer notre bouton
      installPrompt: 'codex:install-dismissed',
    },
    devOptions: { enabled: false },
  },

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
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
        { name: 'theme-color', content: '#0b0907' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/img/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/img/favicon-48.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/img/favicon-96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/img/apple-touch-icon.png' },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  nitro: {
    preset: 'vercel',
    // Coquille SPA statique, servie aussi hors ligne par le service worker
    prerender: { routes: ['/'] },
  },
})
