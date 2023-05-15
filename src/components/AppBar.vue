<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { computed } from 'vue'

const props = defineProps<{
  title?: string;
}>()

const emit = defineEmits<{
  (e: 'toggleMenu'): void;
  (e: 'toggleTheme'): void;
}>()

const { showTheHelp } = useMainStore()

// Computeds
const appTitle = computed(() => props.title || '')
</script>

<template>
  <v-app-bar height="44">
    <template v-slot:prepend>
      <v-app-bar-nav-icon variant="text" @click="emit('toggleMenu')"></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>{{ appTitle }}</v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn class="help" icon @click="showTheHelp = true">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<style></style>
