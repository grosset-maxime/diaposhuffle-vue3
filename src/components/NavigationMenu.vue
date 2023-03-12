<script setup lang="ts">
import type { IRoute } from '../interfaces/route';

import { useGlobalState } from '@/stores';

const props = defineProps<{
  show: boolean;
  items: Map<string, IRoute>;
}>();

const {
  // Getters
  getRailMenu,

  // Actions
  setRailMenu,
} = useGlobalState();

const toggleRailMenu = () => setRailMenu(!getRailMenu());
</script>

<template>
  <v-navigation-drawer
    :class="{
      'is-rail': getRailMenu(),
    }"
    :model-value="props.show"
    :rail="getRailMenu()"
    permanent
    rail-width="60"
  >
    <v-btn height="44" block @click="toggleRailMenu()">
      <v-icon>
        {{ getRailMenu() ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
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
