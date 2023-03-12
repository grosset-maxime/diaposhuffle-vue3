<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import routesMap from '@/router/routes';

// Components
import NavigationMenu from '@/components/NavigationMenu.vue';
import AppBar from '@/components/AppBar.vue';
import TheHelp from '@/components/TheHelp.vue';
import ThePlayer from '@/components/ThePlayer.vue';
import StartButton from '@/components/StartButton.vue';

// Stores
import { useGlobalState } from '@/stores';

const router = useRouter();
const route = useRoute();

// Refs
const {
  // Getters
  getShowMenu,
  getLastVisitedRoute,
  getTheme,
  isTheHelpShown,
  isThePlayerShown,

  // Actions
  setShowMenu,
  setLastVisitedRoute,
} = useGlobalState();

// Computeds
const routePath = computed((): string => route.path);
const title = computed((): string => routesMap.get(routePath.value)?.title || '');

// Actions
function onToggleMenu() {
  setShowMenu(!getShowMenu());
}

let isFirstLoad = true;
router.beforeEach((to, from, next) => {
  let lastVisitedRoute = getLastVisitedRoute();

  if (isFirstLoad) {
    isFirstLoad = false;

    if (!lastVisitedRoute) {
      next(router.getRoutes()[0]);
      return;
    }
    if (to.path === '/' && lastVisitedRoute) {
      next(lastVisitedRoute);
      return;
    }
  }

  if (lastVisitedRoute !== to.path) {
    setLastVisitedRoute(to.path);
  }

  next();
});
</script>

<template>
  <v-app
    :theme="getTheme()"
    :class="{
      app: true,
      'dark-theme': true,
    }"
  >
    <NavigationMenu :show="getShowMenu()" :items="routesMap" />

    <AppBar :title="title" @toggle-menu="onToggleMenu" />

    <v-main class="main">
      <RouterView />
    </v-main>

    <v-footer app class="the-footer">
      <div class="start-btn-ctn">
        <StartButton />
      </div>
    </v-footer>

    <TheHelp :show="isTheHelpShown()" />

    <ThePlayer v-if="isThePlayerShown()" />
  </v-app>
</template>

<style scoped>
.app,
.main {
  height: 100%;
  min-height: 100%;
}
.the-footer {
  display: flex;
  justify-content: center;

  .start-btn-ctn {
    width: 50%;
    text-align: center;
  }
}
</style>
