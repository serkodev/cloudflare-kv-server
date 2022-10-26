import { createApp } from 'vue'
import '@master/normal.css'
import MasterCSS, { configure, defaultColors } from '@master/css'
import App from './App.vue'

MasterCSS.init(configure({
  scheme: {
    preference: 'light',
    storage: {
      sync: true,
      key: 'scheme',
    },
  },
  colors: {
    'content': defaultColors.black,
    'sub-content': defaultColors.gray['60'],
  },
}))

createApp(App).mount('#app')
