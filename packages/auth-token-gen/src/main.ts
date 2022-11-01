import { createApp } from 'vue'
import MasterCSS from '@master/css'
// @ts-expect-error "js"
import config from '../master.css.js'
import '@master/normal.css'
import App from './App.vue'

export const css = new MasterCSS({ config })

createApp(App).mount('#app')
