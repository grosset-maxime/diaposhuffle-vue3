// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
import colors from '@/plugins/vuetify-colors'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#111111',
          surface: '#000000',
          primary: colors.orange.base,
          secondary: colors.grey.darken4,
          error: colors.red.darken4,
        },
      },
    },
  },
})
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
