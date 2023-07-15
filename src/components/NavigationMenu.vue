<script setup lang="ts">
import type { IRoute } from '../interfaces/route'

import { useMainStore } from '@/stores/mainStore'
import { useAlertStore } from '@/stores/alertStore'
import { eagerComputed } from '@vueuse/core'

const props = defineProps<{
  show: boolean;
  items: Map<string, IRoute>;
}>()

const {
  railMenu,
} = useMainStore()

const { errorsList } = useAlertStore()
const nbErrors = eagerComputed(() => errorsList.value.length)

const toggleRailMenu = () => railMenu.value = !railMenu.value

function shouldShowBadge (item: IRoute): boolean {
  let show = false

  if (item.name === 'errors') show = !!nbErrors.value

  return show
}

function badgeColor (item: IRoute): string {
  let color = ''
  if (item.name === 'errors') color = 'error'
  return color
}

function badgeContent (item: IRoute): number {
  let content = 0
  if (item.name === 'errors') content = nbErrors.value
  return content
}
</script>

<template>
  <v-navigation-drawer
    :class="{
      'is-rail': railMenu,
    }"
    :model-value="props.show"
    :rail="railMenu"
    permanent
    rail-width="60"
  >
    <v-btn height="44" block @click="toggleRailMenu()">
      <v-icon size="large">
        {{ railMenu ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
      </v-icon>
    </v-btn>

    <v-divider />

    <v-list density="compact" nav color="orange" class="menu-list">
      <v-list-item
        v-for="[key, item] in items"
        :key="key"
        :value="item.path"
        :to="item.path"
      >
        <template #default>
          <div class="item">
            <v-badge
              v-if="shouldShowBadge(item)"
              :color="badgeColor(item)"
              :content="badgeContent(item)"
              class="item-badge"
              max="999"
            />
            <v-icon class="item-icon">
              {{ item.icon }}
            </v-icon>
            <span class="item-title">
              {{ item.title }}
            </span>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.item {
  overflow: hidden;
  white-space: nowrap;
}
.item-icon {
  margin-left: 2px;
}
.item-badge {
transform: scale(0.7);
position: absolute;
top: 7px;
left: 10px;
z-index: 10;
}

.item-title {
  margin-left: 12px;
}

.menu-list {
  overflow-x: hidden; /* To fix vuetify overflow visible on rail state */
}
</style>
