<script setup lang="ts">
// Types
import type { ItemName } from '@/logic/ThePlayer/useItemsPlayer'

import { ref, onMounted, inject } from 'vue'

import { useItemsPlayer } from '@/logic/ThePlayer/useItemsPlayer'
import { useThePlayer } from '@/logic/ThePlayer/useThePlayer'

import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
import { useAlertStore } from '@/stores/alertStore'
import { createAlert } from '@/utils/alertUtils'
import { logError } from '@/utils/errorUtils'
import { createCustomError, type CustomErrorData } from '@/models/customError'
import { thePlayerKey } from '@/interfaces/symbols'

const FILE_NAME = 'ThePlayer/ItemsPlayer.vue'

// Emits
const emit = defineEmits<{
  click: []
}>()

const thePlayerProvide = inject(thePlayerKey)

if (!thePlayerProvide) {
  throw logError(
    createCustomError(
      `Could not resolve ${thePlayerKey.description}`,
      { file: FILE_NAME },
    ),
  )
}

const alertStore = useAlertStore()

const {
  isMuteVideo,
} = usePlayerOptionsStore()

// #region ItemsPlayer vue
const itemsRefs = ref<Map<ItemName, HTMLDivElement>>(new Map())

function onClick () {
  emit('click')
}
// #endregion

const {
  items,

  switchWithTransition,

  setNextItem,
  showNextItem,

  getItemDuration,
  playItem,
  pauseItem,

  onItemLoaded,
  onItemError,
} = useItemsPlayer({ itemsRefs })

const thePlayer = useThePlayer({
  setNextItem,
  showNextItem,
  getItemDuration,
  playItem,
  pauseItem,
})

function onError (error: any, errorData: CustomErrorData): void {
  const customError = logError(
    createCustomError(error, {
      file: FILE_NAME,
      ...errorData,
    }),
  )

  alertStore.add(
    createAlert({ error: customError }),
  )

  thePlayer.stop()
  thePlayerProvide?.stopPlayer()
}

onMounted(() => {
  thePlayer.start()
    .catch((e) => {
      onError(e, { actionName: 'onMounted' })
    })
})

defineExpose({
  startPlayer () {
    try {
      thePlayer.start()
    } catch(e) {
      onError(e, { actionName: 'startPlayer' })
    }
  },
  stopPlayer () {
    try {
      thePlayer.stop()
    } catch(e) {
      onError(e, { actionName: 'stopPlayer' })
    }
  },
  pausePlayer: function ({ pauseItm = false }: { pauseItm?: boolean } = {}) {
    try {
      thePlayer.pause()

      if (pauseItm) {
        pauseItem()
      }
    } catch(e) {
      onError(e, { actionName: 'pausePlayer' })
    }
  },
  resumePlayer: function ({ resumeItm = false }: { resumeItm?: boolean } = {}) {
    try {
      thePlayer.resume()

      if (resumeItm) {
        playItem()
      }
    } catch(e) {
      onError(e, { actionName: 'resumePlayer' })
    }
  },

  goToNextItem () {
    try {
      thePlayer.next()
    } catch (e) {
      onError(e, { actionName: 'goToNextItem' })
    }
  },
  goToPreviousItem () {
    try {
      thePlayer.previous()
    } catch (e) {
      onError(e, { actionName: 'goToPreviousItem' })
    }
  },
  switchToHistoryPlayer () {
    try {
      thePlayer.switchToHistoryPlayer()
    } catch (e) {
      onError(e, { actionName: 'switchToHistoryPlayer' })
    }
  },
  switchBackToPreviousPlayer () {
    try {
      thePlayer.switchBackToPreviousPlayer()
    } catch (e) {
      onError(e, { actionName: 'switchBackToPreviousPlayer' })
    }
  },

  playItem () {
    try {
      playItem()
    } catch (e) {
      onError(e, { actionName: 'playItem' })
    }
  },
  pauseItem () {
    try {
      pauseItem()
    } catch (e) {
      onError(e, { actionName: 'pauseItem' })
    }
  },
})
</script>

<template>
  <div class="items-player" @click="onClick">
    <div
      v-for="[itemName, item] in items"
      :key="itemName"
      :ref="(el) => itemsRefs.set(itemName, el as HTMLDivElement)"
      :class="[
        'item-ctn',
        itemName,
        {
          transition: switchWithTransition,
        },
      ]"
      :style="item.styles"
    >
      <img
        v-if="item.src && (item.data || {})?.isImage"
        :src="item.src"
        class="item img"
        draggable="false"
        @load="onItemLoaded(itemName)"
        @error="onItemError(itemName, $event)"
      />
      <video
        v-if="item.src && (item.data || {})?.isVideo"
        :src="item.src"
        class="item vid"
        :autoplay="item.videoOptions.autoplay"
        :loop="item.videoOptions.loop"
        :muted="isMuteVideo"
        :controls="item.videoOptions.controls"
        :controlsList="item.videoOptions.controlsList"
        disablePictureInPicture
        @canplay="onItemLoaded(itemName)"
        @error="onItemError(itemName, $event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.items-player {
  width: 100%;
  height: 100%;
  position: relative;

  .item-ctn {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;

    &.transition {
      transition: opacity 200ms linear;
    }

    .item {
      object-fit: contain;
      width: 100%;
      height: 100%;
      outline: none;
    }

    .item.vid {
      &::-webkit-media-controls-fullscreen-button,
      &::-webkit-media-controls-download-button {
        display: none;
      }
    }
  }
}
</style>
