<script setup lang="ts">
// Types
import type { Item } from '@/models/item'

import { ref, onMounted } from 'vue'

import { useItemsPlayer } from '@/logic/ThePlayer/useItemsPlayer'
import { useThePlayer } from '@/logic/ThePlayer/useThePlayer'

import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'

export interface ItemsPlayerCmpExpose {
  startPlayer: () => void
  stopPlayer: () => void
  pausePlayer: (opts?: { pauseItm?: boolean }) => void
  resumePlayer: (opts?: { resumeItm?: boolean }) => void

  goToNextItem: () => void
  goToPreviousItem: () => void
  switchToHistoryPlayer: () => void
  switchBackToPreviousPlayer: () => void
  onDeleteItem: (itm: Item) => void

  playItem: () => void
  pauseItem: () => void
}

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
}>()

const {
  isMuteVideo,
} = usePlayerOptionsStore()

// #region ItemsPlayer vue
const itemsRefs = ref<Map<string, HTMLDivElement>>(new Map())
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

onMounted(async () => {
  thePlayer.start()
})

defineExpose<ItemsPlayerCmpExpose>({
  startPlayer: thePlayer.start,
  stopPlayer: thePlayer.stop,
  pausePlayer: function ({ pauseItm = false }: { pauseItm?: boolean } = {}) {
    thePlayer.pause()

    if (pauseItm) {
      pauseItem()
    }
  },
  resumePlayer: function ({ resumeItm = false }: { resumeItm?: boolean } = {}) {
    thePlayer.resume()

    if (resumeItm) {
      playItem()
    }
  },

  goToNextItem: thePlayer.next,
  goToPreviousItem: thePlayer.previous,
  switchToHistoryPlayer: thePlayer.switchToHistoryPlayer,
  switchBackToPreviousPlayer: thePlayer.switchBackToPreviousPlayer,
  onDeleteItem: thePlayer.onDeleteItem,

  playItem,
  pauseItem,
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
