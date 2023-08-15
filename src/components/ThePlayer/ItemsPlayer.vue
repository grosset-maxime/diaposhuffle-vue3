<script setup lang="ts">
// Types
import type { ItemName } from '@/logic/ThePlayer/useItemsPlayer'
import type { Item } from '@/models/item'

import { ref, onMounted } from 'vue'

import { useItemsPlayer } from '@/logic/ThePlayer/useItemsPlayer'
import { useThePlayer } from '@/logic/ThePlayer/useThePlayer'

import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
import { logError } from '@/utils/errorUtils'
import { createCustomError, CustomError, type CustomErrorData } from '@/models/customError'

const FILE_NAME = 'ThePlayer/ItemsPlayer.vue'

// Emits
const emit = defineEmits<{
  click: [],
  loadError: [ {item?: Item, error: CustomError } ],
  error: [ error: CustomError ],
}>()

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

  emit('error', customError)
}

function onLoadItemError (itemName: ItemName, item: Item | undefined, event: Event) {
  onItemError(itemName, event)

  let src = ''
  try {
    const target = event.target as HTMLImageElement | HTMLVideoElement | undefined
    src = target?.src || ''
  } catch (e) { /* Fail silently */ }

  const error = logError(
    createCustomError(`Fail to load item: ${itemName} | src: ${src}`, {
      file: FILE_NAME,
      actionName: 'onLoadItemError',
    }),
  )

  emit('loadError', { item, error })
}

onMounted(() => {
  thePlayer.start()
    .catch((e) => { onError(e, { actionName: 'onMounted#thePlayer.start' }) })
})

defineExpose({
  async startPlayer () {
    try {
      await thePlayer.start()
    } catch(e) {
      throw onError(e, { actionName: 'startPlayer' })
    }
  },
  stopPlayer () {
    try {
      thePlayer.stop()
    } catch(e) {
      throw onError(e, { actionName: 'stopPlayer' })
    }
  },
  canPausePlayer (): boolean {
    try {
      return thePlayer.canPause()
    } catch(e) {
      throw onError(e, { actionName: 'canPausePlayer' })
    }
  },
  pausePlayer ({ pauseItm = false }: { pauseItm?: boolean } = {}) {
    try {
      thePlayer.pause()

      if (pauseItm) {
        pauseItem()
      }
    } catch(e) {
      throw onError(e, { actionName: 'pausePlayer' })
    }
  },
  canResumePlayer (): boolean {
    try {
      return thePlayer.canResume()
    } catch(e) {
      throw onError(e, { actionName: 'canResumePlayer' })
    }
  },
  resumePlayer ({ resumeItm = false }: { resumeItm?: boolean } = {}) {
    try {
      thePlayer.resume()

      if (resumeItm) {
        playItem()
      }
    } catch(e) {
      throw onError(e, { actionName: 'resumePlayer' })
    }
  },

  async goToNextItem () {
    try {
      await thePlayer.next()
    } catch (e) {
      throw onError(e, { actionName: 'goToNextItem' })
    }
  },
  async goToPreviousItem () {
    try {
      await thePlayer.previous()
    } catch (e) {
      throw onError(e, { actionName: 'goToPreviousItem' })
    }
  },
  switchToHistoryPlayer () {
    try {
      thePlayer.switchToHistoryPlayer()
    } catch (e) {
      throw onError(e, { actionName: 'switchToHistoryPlayer' })
    }
  },
  switchBackToPreviousPlayer () {
    try {
      thePlayer.switchBackToPreviousPlayer()
    } catch (e) {
      throw onError(e, { actionName: 'switchBackToPreviousPlayer' })
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
        :alt="item.src"
        @load="onItemLoaded(itemName)"
        @error="onLoadItemError(itemName, item.data, $event)"
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
        @error="onLoadItemError(itemName, item.data, $event)"
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
      outline: 0;
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
