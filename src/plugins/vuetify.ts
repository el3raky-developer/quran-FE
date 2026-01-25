import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1B5E20',
          secondary: '#4CAF50',
          accent: '#FFC107',
          error: '#F44336',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FF9800',
        },
      },
    },
  },
})
