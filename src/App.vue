<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import routesMap from '@/router/routes'

// Components
import FloatingAlert from '@/components/FloatingAlert.vue'
import NavigationMenu from '@/components/NavigationMenu.vue'
import AppBar from '@/components/AppBar.vue'
import TheHelp from '@/components/TheHelp/TheHelp.vue'

// Stores
import { useMainStore } from '@/stores/mainStore'

const router = useRouter()
const route = useRoute()

// Stores
const {
  showMenu,
  theme,
  lastVisitedRoute,
  showTheHelp,
  showFloatingAlert,
} = useMainStore()

// Computeds
const routePath = computed((): string => route.path)
const title = computed((): string => routesMap.get(routePath.value)?.title || '')

// Actions
function onToggleMenu () {
  showMenu.value = !showMenu.value
}

let isFirstLoad = true
router.beforeEach((to, from, next) => {
  let lastVisitedRouteVal = lastVisitedRoute.value

  if (isFirstLoad) {
    isFirstLoad = false

    if (!lastVisitedRouteVal) {
      next(router.getRoutes()[ 0 ])
      return
    }
    if (to.path === '/' && lastVisitedRouteVal) {
      next(lastVisitedRouteVal)
      return
    }
  }

  if (lastVisitedRouteVal !== to.path) {
    lastVisitedRoute.value = to.path
  }

  next()
})
</script>

<template>
  <v-app
    :theme="theme"
    :class="{
      app: true,
      'dark-theme': true,
    }"
  >
    <!-- Floating error alert. -->
    <FloatingAlert :show="showFloatingAlert"/>

    <!-- Navigation menu. -->
    <NavigationMenu :show="showMenu" :items="routesMap" />

    <!-- App bar. -->
    <AppBar :title="title" @toggle-menu="onToggleMenu" />

    <!-- Main. -->
    <v-main class="main">
      <RouterView />
    </v-main>

    <!-- The Help. -->
    <TheHelp :show="showTheHelp" />
  </v-app>
</template>

<style scoped>
.app,
.main {
  height: 100%;
  min-height: 100%;
}
</style>
