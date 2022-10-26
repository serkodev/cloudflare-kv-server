<script setup lang="ts">
import { ref } from 'vue'
import PermissionItem from './components/PermissionItem.vue'
import type { Permission } from '@/middleware/auth'
import { Action, createToken } from '@/middleware/auth'

const permissions = ref<Permission[]>([{ action: Action.Get }])
const secret = ref('')
const expire = ref('')
const token = ref('')

const addPermission = () => {
  permissions.value.push({
    action: Action.Get,
  })
}

const generate = async () => {
  try {
    if (!secret.value)
      throw new Error('Please input token secret')

    let expireTime: number | undefined
    if (expire.value) {
      const t = new Date(expire.value).getTime()
      if (!t || isNaN(t))
        throw new Error('Invlid expire date')
      expireTime = t
    }

    const ps: Permission[] = JSON.parse(JSON.stringify(permissions.value))
    const p = ps.map((permission) => {
      if ((!permission.list_keys_prefix || permission.action & Action.List) !== Action.List)
        delete permission.list_keys_prefix
      return permission
    })

    token.value = await createToken(p, expireTime, secret.value)
  } catch (e) {
    token.value = ''
    // eslint-disable-next-line no-alert
    window.alert(e)
  }
}
</script>

<template>
  <div class="flex flex:col flex:row w:full ai:center">
    <div class="w:768 flex flex:col gap:12 py:12">
      <div class="py:36">
        <div class="f:30 f:bold py:8">
          Auth Token Generator
        </div>
        <a class="fg:sub-content" href="https://github.com/serkodev/cloudflare-kv-server">
          cloudflare-kv-server
        </a>
      </div>

      <div>
        <div class="f:bold py:16">
          Permissions <span class="fg:red">*</span>
        </div>
        <div class="flex flex:col gap:20">
          <template v-for="(_, i) in permissions" :key="i">
            <PermissionItem v-model="permissions[i]" @delete="permissions.splice(i, 1)" />
          </template>
          <div class="w:full flex ac:center jc:center fg:green-50 bg:green-94 r:12 py:16" @click="addPermission">
            <i class="gg-add" />
          </div>
        </div>
      </div>

      <div class="flex gap:12">
        <div class="flex:1">
          <div class="f:bold py:16">
            Secret <span class="fg:red">*</span>
          </div>
          <input v-model="secret" class="w:full f:16 p:12 r:8 b:1|solid|sub-content" type="text">
        </div>
        <div class="flex:1">
          <div class="f:bold py:16">
            Expire (optional)
          </div>
          <input v-model="expire" class="w:full f:16 p:12 r:8 b:1|solid|sub-content" type="text" placeholder="YYYY-MM-DD">
        </div>
      </div>

      <pre v-if="token" class="p:16 bg:gray-95 r:12 break-word white-space:pre-wrap">{{ token }}</pre>

      <div class="w:full flex ac:center jc:center fg:white bg:blue r:12 f:bold py:16" @click="generate">
        Generate
      </div>
    </div>
  </div>
</template>

<style>
@import url('~css.gg/css/add');
</style>
