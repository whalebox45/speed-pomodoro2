import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import './style.scss'
import App from './App.vue'

registerSW({ immediate: true })

createApp(App).mount('#app')
