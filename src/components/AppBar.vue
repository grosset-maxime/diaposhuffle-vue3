<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'toggleMenu'): void;
  (e: 'toggleTheme'): void;
}>();

const appTitle = computed((): string => props.title || '');
</script>

<template>
  <v-app-bar height="44">
    <template v-slot:prepend>
      <v-app-bar-nav-icon variant="text" @click="emit('toggleMenu')"></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>{{ appTitle }}</v-app-bar-title>
  </v-app-bar>
</template>

<style></style>
