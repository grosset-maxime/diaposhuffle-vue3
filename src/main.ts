// Vendors libs
import { createApp } from 'vue'
import mitt from 'mitt'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

import './assets/main.css'

loadFonts()

const emitter = mitt()

const app = createApp(App)

app.config.globalProperties.emitter = emitter

app.use(router)
app.use(vuetify)

app.mount('#app')
