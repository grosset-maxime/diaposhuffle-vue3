<script setup lang="ts">
// TODO: Enh: Display duration time for video at bottom corner?
// TODO: Feature: For small video try to not fit the screen and apply a scale instead.
// TODO: Enh: update index of current item on playing from bdd items when displaying
//            an item from history.
// TODO: Feature: Add options to play items not randomly but in row into a folder.

// Types
import type { Item } from '@/models/item'
import type { TagId } from '@/models/tag'
import { Position } from '@/interfaces/components/PinWrapper'

// Vendors Libs
import { ref, computed, watch, onMounted } from 'vue'

// Libs
import { buildError } from '@/api/api'
import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Stores
import { useGlobalState } from '@/stores'
import { useDiapoShuffleStore } from '@/stores/diapoShuffle'
import { useUIOptionsStore } from '@/stores/ThePlayerOptions/uiOptions'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayer'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoop'

// Components
import TheLoop from '@/components/ThePlayer/TheLoop.vue'
import PauseBtn from '@/components/ThePlayer/PauseBtn.vue'
import ItemsPlayer, { type ItemsPlayerCmpExpose } from '@/components/ThePlayer/ItemsPlayer.vue'
import TagsList from '@/components/ThePlayer/TagsList.vue'
// import HistoryChip from '@/components/ThePlayer/HistoryChip.vue'
import ItemsInfoChip from '@/components/ThePlayer/ItemsInfoChipChip.vue'
import PinWrapper from '@/components/ThePlayer/PinWrapper.vue'
import ItemPathChip from '@/components/ThePlayer/ItemPathChip.vue'

import TaggerModal from '@/components/TheTagger/TheTagger.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import { eagerComputed } from '@vueuse/shared'

const { showTheHelp } = useGlobalState()
const { showThePlayer } = useDiapoShuffleStore()
// const sourceOptsStore = useSourceOptionsStore()
const {
  // showHistory,
  showListIndex,
  showLoop,
  showPath,
  showPined,
  showTags,
  pinHistory,
  pinListIndex,
  pinLoop,
  pinPath,
  pinPined,
  pinTags,
} = useUIOptionsStore()
const thePlayerStore = useThePlayerStore()
const theLoopStore = useTheLoopStore()

const item = computed(() => thePlayerStore.item.value)
const isPaused = computed(() => thePlayerStore.isPaused.value)
const isItemVideo = computed(() => thePlayerStore.isItemVideo.value)
const playingItemTags = computed(() => item.value?.tags || new Set<TagId>())
const isLoopEnabled = computed(() => theLoopStore.enabled.value)
const isPinedItem = computed(() => thePlayerStore.isPinedItem.value)
// const historyLength = ref(0) // TODO
const isFromPinedsSource = ref(false) // TODO
const isSourceDB = ref(false) // TODO

// Refs to Components element in template.
const ItemsPlayerCmp = ref<ItemsPlayerCmpExpose | null>(null)

// Computeds
// const isFromPinedsSource = sourceOptsStore.isFromPined
// const isSourceDB = computed(() => playerStore.getFetchSource() === FetchSource.db)
// const historyLength = computed(() => playerStore.getHistoryLength())
// const historyIndex = computed({
//   get () {
//     return playerStore.getHistoryIndex()
//   },
//   set (index) {
//     playerStore.setHistoryIndex(index)
//   },
// })

// #region Delete Item Modal
const deleteModal = {
  show: ref(false),
  showOptions: ref(false),
  itemData: ref<Item | undefined>(),
}

const deleteSrcText = computed<string>(() => {
  return `Src: ${deleteModal.itemData.value?.src}`
})

function showDeleteModal (
  { item, showOptions = false }: { item: Item; showOptions?: boolean },
): void {
  showUI()
  pausePlayer()
  stopKSListener()

  deleteModal.itemData.value = item
  deleteModal.showOptions.value = !!showOptions
  deleteModal.show.value = true
}

function hideDeleteModal ({
  remove = false,
  fromBddOnly,
  ignoreIfNotExist,
}: {
  remove?: boolean;
  fromBddOnly?: boolean;
  ignoreIfNotExist?: boolean;
} = {}): void {
  const item = deleteModal.itemData.value

  hideUI()

  deleteModal.show.value = false
  deleteModal.itemData.value = undefined

  startKSListener()

  if (item && remove) {
    thePlayerStore.deleteItem({
      item,
      fromBddOnly,
      ignoreIfNotExist,
    }).catch((e: unknown) => {
      const error = buildError(e)

      pausePlayer()
      displayAlert(error)

      throw error
    })
  }
}
// #endregion Delete Item Modal

// #region The Tagger
const taggerModal = {
  show: ref(false),
}

function showTaggerModal (): void {
  pausePlayer({ pauseItm: false })
  stopKSListener()
  taggerModal.show.value = true
}

function hideTaggerModal (): void {
  taggerModal.show.value = false
  startKSListener()
  showUIDuring(3000)
}

async function onSaveTaggerModal (selectedTagIds: Set<TagId>): Promise<void> {
  const tags = selectedTagIds
  const itemVal = item.value!

  // TODO: reactivity?
  itemVal.tags = tags

  // editHistoryItem(historyIndex.value, itemVal)

  try {
    await thePlayerStore.setItemTags({ item: itemVal })
  } catch (e) {
    const error = buildError(e)

    pausePlayer()
    displayAlert(error)

    throw error
  }
}
// #endregion The Tagger

// #region The Player vue
const { startKSListener, stopKSListener }
  = useKeyboardShortcutsListener(keyboardShortcuts)

const showAlert = ref(false)
const alert = ref({
  publicMessage: '',
  severity: 'error',
  showDeleteBtn: false,
  onClose: () => {},
})

function stopPlayer (): void {
  ItemsPlayerCmp.value!.stopPlayer()
  showThePlayer.value = false
}
function pausePlayer (opts: { pauseItm?: boolean } = {}): void {
  ItemsPlayerCmp.value?.pausePlayer(opts)
}
function resumePlayer (opts: { resumeItm?: boolean } = {}): void {
  ItemsPlayerCmp.value?.resumePlayer(opts)
}
function goToNextItem (): void { ItemsPlayerCmp.value?.goToNextItem() }
function goToPreviousItem (): void { ItemsPlayerCmp.value?.goToPreviousItem() }

// TODO
function togglePinItem (item: Item): void {}

function onItemsPlayerClick () {
  if (isPaused.value) {
    resumePlayer()
  } else {
    pausePlayer()
  }
}

function displayAlert ({
  publicMessage = 'Unknow error.',
  severity = 'error',
  showDeleteBtn = false,
  onClose = () => {},
} = {}): void {
  alert.value = {
    publicMessage,
    severity,
    showDeleteBtn,
    onClose,
  }
  showAlert.value = true
}

function hideAlert (): void {
  showAlert.value = false
  alert.value.onClose?.()
}

function keyboardShortcuts (key: string): void {
  switch (key) {
  case 'Space':
    if (isPaused.value) {
      resumePlayer()
    } else {
      pausePlayer()
    }
    break

    // On ArrowDown only pause/resume looping to allow to play video in
    // infinite loop if wanted.
  case 'ArrowDown':
    if (isPaused.value) {
      resumePlayer({ resumeItm: false })
    } else {
      pausePlayer({ pauseItm: false })
    }
    break

  case 'Escape':
    stopPlayer()
    break

  case 'ArrowRight':
    goToNextItem()
    // goToNextItem({ pausePlayingIfStillInHistory: true }) // TODO: to manage with history player
    break

  case 'ArrowLeft':
    goToPreviousItem()
    break

  case 'Delete':
    showDeleteModal({ item: item.value! })
    break

  case 'h':
    pausePlayer()
    showTheHelp.value = true
    break

  case 'p':
    pausePlayer({ pauseItm: false })
    // TODO: togglePinItem({ item: item.value! })
    showUIDuring(3000)
    break

  case 't':
    showTaggerModal()
    break
  default:
  }
}
// #endregion The Player vue

// #region UI
const PINED_ANIMATION_DURATION = 1000
const UNPINED_ANIMATION_DURATION = 1000

const shouldShowUI = ref(false)
const showUITimeout = ref<number | undefined>()
const preventHideUI = ref(false)

const showPinedAnim = ref(false)
const showUnpinedAnim = ref(false)

const loop = {
  duration: ref(0),
  pined: ref(false),
}

const tagsList = {
  pined: ref(false),
}

const historyChip = {
  pined: ref(false),
}

const pinedChip = {
  pined: ref(false),
}

const itemsInfoChip = {
  pined: ref(false),
}

const itemPathChip = {
  pined: ref(false),
}

const showTheLoop = eagerComputed<boolean>(
  () => !!(showLoop.value && isLoopEnabled.value),
)
const showTheItemPathChip = eagerComputed<boolean>(
  () => !!(showPath.value && item.value),
)
const showTheTagsList = eagerComputed<boolean>(
  () => !!(showTags.value && item.value),
)
const showTheItemsInfoChip = eagerComputed<boolean>(
  () => !!(showListIndex.value && (isFromPinedsSource.value || isSourceDB)),
)
// const showTheHistoryChip = computed(() => !!historyLength.value)

function onMouseOverUI (): void {
  preventHideUI.value = true
  showUI()

  clearTimeout(showUITimeout.value)
  showUITimeout.value = undefined
}

function onMouseOutUI (): void {
  preventHideUI.value = false
  showUIDuring()
}

function showUIDuring (time = 2000): void {
  shouldShowUI.value = true

  if (preventHideUI.value) {
    return
  }

  clearTimeout(showUITimeout.value)
  showUITimeout.value = setTimeout(() => {
    if (preventHideUI.value) {
      return
    }
    hideUI()
  }, time)
}

function showUI (): void {
  shouldShowUI.value = true
}

function hideUI (): void {
  shouldShowUI.value = false
}

function togglePinUI (uiName: string): void {
  if (uiName === 'loop') {
    loop.pined.value = !loop.pined.value
  } else if (uiName === 'pinedChip') {
    pinedChip.pined.value = !pinedChip.pined.value
  } else if (uiName === 'tagsList') {
    tagsList.pined.value = !tagsList.pined.value
  } else if (uiName === 'historyChip') {
    historyChip.pined.value = !historyChip.pined.value
  } else if (uiName === 'itemsInfoChip') {
    itemsInfoChip.pined.value = !itemsInfoChip.pined.value
  } else if (uiName === 'itemPathChip') {
    itemPathChip.pined.value = !itemPathChip.pined.value
  }
}

function triggerPinedAnim () {
  if (showPinedAnim.value) {
    return
  }

  showPinedAnim.value = true

  setTimeout(() => {
    showPinedAnim.value = false
  }, PINED_ANIMATION_DURATION)
}

function triggerUnpinedAnim () {
  if (showUnpinedAnim.value) {
    return
  }

  showUnpinedAnim.value = true

  setTimeout(() => {
    showUnpinedAnim.value = false
  }, UNPINED_ANIMATION_DURATION)
}
// #endregion UI

watch(showTheHelp, (isShow) => {
  isShow
    ? stopKSListener()
    : startKSListener()
})

onMounted(async () => {
  // Init pined states from UI options.
  itemPathChip.pined.value = pinPath.value
  tagsList.pined.value = pinTags.value
  historyChip.pined.value = pinHistory.value
  pinedChip.pined.value = pinPined.value
  itemsInfoChip.pined.value = pinListIndex.value
  loop.pined.value = pinLoop.value

  startKSListener()
})

// onBeforeUnmount(() => { stop() })
</script>

<template>
  <div
    :class="[
      'the-player',
      {
        'video-item': isItemVideo,
        'show-ui': shouldShowUI,
      },
    ]"
    @mousemove="showUIDuring()"
  >
    <PinWrapper
      :class="[
        'the-loop-pin-wrapper',
        {
          pined: loop.pined.value,
        },
      ]"
      :is-pined="loop.pined.value"
      :icon-position="Position.middle"
      icon-position-top="-37px"
      @click="togglePinUI('loop')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <TheLoop
        v-if="showTheLoop "
        :dense="!loop.pined.value && !shouldShowUI"
      />
    </PinWrapper>

    <PauseBtn
      v-show="isPaused"
      class="the-pause-btn"
      @click="resumePlayer"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    />

    <PinWrapper
      v-if="showPined && isPinedItem"
      :class="[
        'the-pined-chip-pin-wrapper',
        {
          pined: pinedChip.pined.value,
        },
      ]"
      :is-pined="pinedChip.pined.value"
      :icon-position="Position.topLeft"
      @click="togglePinUI('pinedChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <v-chip
        class="is-pined-item pl-1 pr-1"
        color="orange"
        outlined
        x-small
        label
        @click="item && togglePinItem(item)"
      >
        Pined
      </v-chip>
    </PinWrapper>

    <div
      :class="[
        'pined-unpined-anim',
        {
          'pined-anim': showPinedAnim,
          'unpined-anim': showUnpinedAnim,
        },
      ]"
    />

    <v-alert
      class="alert"
      :model-value="showAlert"
      :type="alert.severity"
      dismissible
      prominent
      transition="slide-x-transition"
      @input="hideAlert()"
    >
      <v-row align="center">
        <v-col class="grow">
          {{ alert.publicMessage }}
        </v-col>
        <v-col class="shrink" v-if="alert.showDeleteBtn">
          <v-btn @click="item && showDeleteModal({ item, showOptions: true })">
            Delete
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>

    <!-- <PinWrapper
      v-if="showHistory"
      v-show="showTheHistoryChip"
      :class="[
        'the-history-chip-pin-wrapper',
        {
          pined: historyChip.pined.value,
        },
      ]"
      :is-pined="historyChip.pined.value"
      :icon-position="Position.topRight"
      @click="togglePinUI('historyChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <HistoryChip class="the-history-chip" @click="pausePlayer" />
    </PinWrapper> -->

    <PinWrapper
      v-if="showTheItemsInfoChip"
      :class="[
        'the-items-info-chip-pin-wrapper',
        {
          pined: itemsInfoChip.pined.value,
        },
      ]"
      :is-pined="itemsInfoChip.pined.value"
      :icon-position="Position.topRight"
      @click="togglePinUI('itemsInfoChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <ItemsInfoChip class="the-items-info-chip" @click="pausePlayer" />
    </PinWrapper>

    <PinWrapper
      v-if="showTheTagsList"
      :class="[
        'the-tags-list-pin-wrapper',
        {
          pined: tagsList.pined.value,
        },
      ]"
      :is-pined="tagsList.pined.value"
      :icon-position="Position.topRight"
      @click="togglePinUI('tagsList')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <TagsList :tags-ids="playingItemTags" class="the-tags-list" @click="showTaggerModal" />
    </PinWrapper>

    <DeleteModal
      :show="deleteModal.show.value"
      :show-options="deleteModal.showOptions.value"
      :show-preview="!!deleteModal.itemData.value"
      :show-src="!!deleteModal.itemData.value"
      @confirm="hideDeleteModal({ ...$event, remove: true })"
      @cancel="hideDeleteModal"
      @click:outside="hideDeleteModal"
    >
      <template v-if="!!deleteModal.itemData.value" #preview>
        <img
          v-if="!!deleteModal.itemData.value?.isImage"
          class="preview"
          :src="deleteModal.itemData.value?.src"
        />
        <video
          v-if="!!deleteModal.itemData.value?.isVideo"
          class="preview"
          :src="deleteModal.itemData.value?.src"
        />
      </template>
      <template #message> Delete this item? </template>
      <template #src>
        {{ deleteSrcText }}
      </template>
    </DeleteModal>

    <ItemsPlayer
      ref="ItemsPlayerCmp"
      class="the-items-player"
      @click="onItemsPlayerClick"
    />

    <PinWrapper
      v-if="showTheItemPathChip"
      :class="[
        'the-item-path-chip-pin-wrapper',
        {
          pined: itemPathChip.pined.value,
        },
      ]"
      :is-pined="itemPathChip.pined.value"
      :icon-position="Position.topLeft"
      @click="togglePinUI('itemPathChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <!-- TODO: FEATURE: add a dense/contracted mode which will expand on mouse hover -->
      <ItemPathChip
        class="the-item-path-chip"
        @click="pausePlayer"
        @mouseover="onMouseOverUI"
        @mouseout="onMouseOutUI"
      />
    </PinWrapper>

    <Teleport to="body">
      <TaggerModal
        :show="taggerModal.show.value"
        :selected-tag-ids="playingItemTags"
        @close="hideTaggerModal"
        @save="onSaveTaggerModal"
      />
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.the-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  background-color: $surface;
  cursor: none;

  &.show-ui {
    cursor: default;

    .the-history-chip-pin-wrapper,
    .the-items-info-chip-pin-wrapper,
    .the-tags-list-pin-wrapper,
    .the-item-path-chip-pin-wrapper {
      transform: translateX(0);
    }

    .the-pined-chip-pin-wrapper {
      transform: translateY(0);
    }
  }

  &.video-item {
    .the-item-path-chip-pin-wrapper {
      bottom: 80px; // To not cover the video controls.
    }
  }

  .the-pined-chip-pin-wrapper {
    position: absolute;
    top: 10px;
    right: 40px;
    z-index: 1000;
    transform: translateY(-150%);
    transition: transform 0.3s ease;

    &.pined {
      transform: none;
    }
  }

  .is-pined-item {
    opacity: 0.7;
  }

  .pined-unpined-anim {
    position: absolute;
    top: 16px;
    right: 51px;
    z-index: 1000;
    width: 14px;
    height: 14px;
    opacity: 0;
    background-color: transparent;
    border: 4px solid #aaa;
    border-radius: 12px;

    &.pined-anim {
      animation: pined 0.8s;
    }
    &.unpined-anim {
      animation: unpined 0.8s;
    }
  }

  .the-pause-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 1000;
  }

  .alert {
    $margin: 10px;
    z-index: 2000;
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - #{$margin * 2});
    margin: $margin;
  }

  .the-loop-pin-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1000;
    width: 100%;
  }

  .the-history-chip-pin-wrapper {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 1000;
    transform: translateX(-150%);
    transition: transform 0.3s ease;

    &.pined {
      transform: none;
    }
  }

  .the-items-info-chip-pin-wrapper {
    position: absolute;
    top: 35px;
    left: 5px;
    z-index: 1000;
    transform: translateX(-150%);
    transition: transform 0.3s ease;

    &.pined {
      transform: none;
    }
  }

  .the-tags-list-pin-wrapper {
    position: absolute;
    top: 80px;
    left: 5px;
    z-index: 1000;
    transform: translateX(-150%);
    transition: transform 0.3s ease;

    &.pined {
      transform: none;
    }

    .the-tags-list {
      cursor: pointer;
    }
  }

  .the-item-path-chip-pin-wrapper {
    position: absolute;
    bottom: 25px;
    right: 5px;
    z-index: 1000;
    transform: translateX(110%);
    transition: transform 0.3s ease;

    &.pined {
      transform: none;
    }
  }

  .the-items-player {
    position: relative;
  }
}
</style>
