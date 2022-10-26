<script setup lang="ts">
import { computed } from 'vue'
import type { Permission } from '@/middleware/auth'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Action } from '@/middleware/auth'

const props = defineProps<{
  modelValue: Permission
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: Permission): void
  (e: 'delete'): void
}>()

const getAction = (action: Action) => (props.modelValue && (props.modelValue.action & action) === action)
const setAction = (action: Action, event: Event) => {
  if (!props.modelValue)
    return
  const checked = (event.target as HTMLInputElement).checked
  const newAction = checked ? (props.modelValue.action | action) : (props.modelValue.action & ~action)
  const modelValue = props.modelValue
  modelValue.action = newAction
  emit('update:modelValue', props.modelValue)
}

const model = computed(() => {
  return new Proxy(props.modelValue, {
    set(obj, key, value) {
      emit('update:modelValue', { ...obj, [key]: value || undefined })
      return true
    },
  })
})
</script>

<template>
  <div class="flex">
    <div class="flex pr:24 pt:6">
      <span class="flex fg:red jc:center">
        <i class="gg-remove" @click="emit('delete')" />
      </span>
    </div>
    <div class="flex:1 flex flex:col">
      <div class="flex:1 flex flex:row gap:20 py:8 mr:8_input">
        <label>
          <input
            type="checkbox" :checked="getAction(Action.List)"
            @change="setAction(Action.List, $event)"
          >List
        </label>
        <label>
          <input
            type="checkbox" :checked="getAction(Action.Get)"
            @change="setAction(Action.Get, $event)"
          >Get
        </label>
        <label>
          <input
            type="checkbox" :checked="getAction(Action.GetWithMetaData)"
            @change="setAction(Action.GetWithMetaData, $event)"
          >GetWithMetaData
        </label>
        <label>
          <input
            type="checkbox" :checked="getAction(Action.Put)"
            @change="setAction(Action.Put, $event)"
          >Put
        </label>
        <label>
          <input
            type="checkbox" :checked="getAction(Action.Delete)"
            @change="setAction(Action.Delete, $event)"
          >Delete
        </label>
      </div>
      <div class="flex flex:1 gap:12 {fg:sub-content;f:14}_label">
        <div class="flex:1">
          <label>namespaces</label>
          <input v-model="model.namespaces" class="mt:8 w:full f:16 p:12 r:8 b:1|solid|sub-content" type="text" placeholder="*">
        </div>
        <div class="flex:1">
          <label>keys</label>
          <input v-model="model.keys" class="mt:8 w:full f:16 p:12 r:8 b:1|solid|sub-content" type="text" placeholder="*">
        </div>
        <div v-if="getAction(Action.List)" class="flex:1">
          <label>list_keys_prefix</label>
          <input v-model="model.list_keys_prefix" class="mt:8 w:full f:16 p:12 r:8 b:1|solid|sub-content" type="text" placeholder="*">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('~css.gg/css/remove');
</style>
