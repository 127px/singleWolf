import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/icon',
    '@vueuse/motion/nuxt',
    'shadcn-nuxt',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
  },

  nitro: {
    prerender: {
      routes: ['/', '/game'],
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/game': { prerender: true },
  },

  runtimeConfig: {
    public: {
      llmProvider: '',
      llmBaseUrl: '',
      llmApiKey: '',
      llmModel: '',
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  app: {
    head: {
      title: 'AI 狼人杀',
      meta: [
        { name: 'description', content: '与 AI 对决的沉浸式狼人杀体验' },
      ],
    },
    baseURL: '/singleWolf/',
  },

  compatibilityDate: '2025-01-01',
})
