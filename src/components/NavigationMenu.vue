<script setup lang="ts">
import type { IRoute } from '../interfaces/route'

import { useMainStore } from '@/stores/mainStore'

const props = defineProps<{
  show: boolean;
  items: Map<string, IRoute>;
}>()

const {
  railMenu,
} = useMainStore()

const toggleRailMenu = () => railMenu.value = !railMenu.value
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

    <v-divider></v-divider>

    <v-list density="compact" nav color="orange" class="menu-list">
      <v-list-item
        v-for="[key, item] in items"
        :key="key"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.path"
        :to="item.path"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped>
.menu-list {
  overflow-x: hidden; /* To fix vuetify overflow visible on rail state */
}
</style>
