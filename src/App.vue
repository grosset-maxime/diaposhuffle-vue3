<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import routesMap from '@/router/routes'

// Components
import NavigationMenu from '@/components/NavigationMenu.vue'
import AppBar from '@/components/AppBar.vue'
import TheHelp from '@/components/TheHelp.vue'
import ThePlayer from '@/components/ThePlayer.vue'

// Stores
import { useGlobalState } from '@/stores'
// TODO: should be move to DiapoShuffleView.
import { useDiapoShuffleStore } from '@/stores/diapoShuffle'

const router = useRouter()
const route = useRoute()

// Stores
const {
  showTheHelp,

  // Getters
  getShowMenu,
  getLastVisitedRoute,
  getTheme,

  // Actions
  setShowMenu,
  setLastVisitedRoute,
} = useGlobalState()
const { showThePlayer } = useDiapoShuffleStore()

// Computeds
const routePath = computed((): string => route.path)
const title = computed((): string => routesMap.get(routePath.value)?.title || '')

// Actions
function onToggleMenu () {
  setShowMenu(!getShowMenu())
}

let isFirstLoad = true
router.beforeEach((to, from, next) => {
  let lastVisitedRoute = getLastVisitedRoute()

  if (isFirstLoad) {
    isFirstLoad = false

    if (!lastVisitedRoute) {
      next(router.getRoutes()[ 0 ])
      return
    }
    if (to.path === '/' && lastVisitedRoute) {
      next(lastVisitedRoute)
      return
    }
  }

  if (lastVisitedRoute !== to.path) {
    setLastVisitedRoute(to.path)
  }

  next()
})
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

    <TheHelp :show="showTheHelp" />

    <!-- TODO: should be moved to DiapoShuffleView -->
    <ThePlayer v-if="showThePlayer" />
  </v-app>
</template>

<style scoped>
.app,
.main {
  height: 100%;
  min-height: 100%;
}
</style>
