<script setup lang="ts">
// Vendors Libs
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// Stores
import { useGlobalState } from '@/stores';

const route = useRoute();
const { setShowThePlayer } = useGlobalState();

interface PagesInfo {
  [key: string]: {
    content: string;
    action: Function;
    bgColor: string;
  };
}
const pagesInfo: PagesInfo = {
  ['/diaposhuffle']: {
    content: 'Start',
    action: () => setShowThePlayer(true),
    bgColor: 'primary',
  },
  ['/export']: {
    content: 'Export',
    action: () => {},
    bgColor: '#57B847', // $green-1
  },
  ['/settings']: {
    content: 'Save',
    action: () => {},
    bgColor: '#F564A3', // $pink-dv-0:
  },
};

// Computeds
const pageInfo = computed(() => {
  return pagesInfo[route.name as string] || {};
});
const content = computed(() => {
  return pageInfo.value.content || '';
});
const bgColor = computed(() => {
  return pageInfo.value.bgColor || '';
});

// Methods
function action() {
  pageInfo.value.action();
}
</script>

<template>
  <v-btn class="start-btn" :color="bgColor" @click="action">
    {{ content }}
  </v-btn>
</template>

<style lang="scss" scoped>
.start-btn {
  width: 100%;
}
</style>
