<script setup lang="ts">
// TODO: Enh: Display duration time for video at bottom corner?
// TODO: Feature: For small video try to not fit the screen and apply a scale instead.
// TODO: Enh: update index of current item on playing from bdd items when displaying
//            an item from history.
// TODO: Feature: Add options to play items not randomly but in row into a folder.

// Types
import type { Ref } from 'vue'
import type { Item } from '@/models/item'
import type { TagId } from '@/models/tag'
import { Position } from '@/interfaces/components/PinWrapper'

// Vendors Libs
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Libs
import { ERROR_SEVERITY_INFO, buildError } from '@/api/api'
import { clone } from '@/utils/utils'
import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Stores
import { useGlobalState } from '@/stores'
import { useDiapoShuffleStore } from '@/stores/diapoShuffle'
import { usePlayerOptionsStore } from '@/stores/playerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/playerOptions/sourceOptions'
import { useUIOptionsStore } from '@/stores/playerOptions/uiOptions'
import { usePlayerStore, FetchSource } from '@/stores/player'
import { useTaggerStore } from '@/stores/tagger'

// Components
import TheLoop from './TheLoop.vue'
import PauseBtn from './PauseBtn.vue'
import DeleteModal from './DeleteModal.vue'
import TaggerModal from '@/components/TheTagger/TheTagger.vue'
import ItemPathChip from './ItemPathChip.vue'
import ItemsPlayer from './ItemsPlayer.vue'
import TagsList from './ThePlayer/TagsList.vue'
import HistoryChip from './ThePlayer/HistoryChip.vue'
import ItemsInfoChip from './ThePlayer/ItemsInfoChipChip.vue'
import PinWrapper from './ThePlayer/PinWrapper.vue'

const PINED_ANIMATION_DURATION = 1000
const UNPINED_ANIMATION_DURATION = 1000

let fetchNextItemPromise: Promise<Item> | undefined = undefined

const { startKSListener, stopKSListener }
  = useKeyboardShortcutsListener(keyboardShortcuts)

// Stores
const { showTheHelp } = useGlobalState()
const diapoShuffleStore = useDiapoShuffleStore()
const sourceOptsStore = useSourceOptionsStore()
const {
  showHistory,
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
const {
  interval,
  isMuteVideo,
  isFetchItemRandomly,
} = usePlayerOptionsStore()
const playerStore = usePlayerStore()
const taggerStore = useTaggerStore()

// Refs
const loop = {
  duration: ref(0),
  pined: ref(false),
}

const isLoadingItem = ref(false)

const pause = ref(false)
const stop = ref(true)

// Playing item
const playingItemData = ref<Item | undefined>()
const isPlayingItemVideo = ref(false)
const playingItemPinedIndex = ref(-1)

// Next item
const nextItemData = ref<Item | undefined>()
const isNextItemSet = ref(false)

const loadErrorItemData = ref<Item | undefined>()

const deleteModal = {
  show: ref(false),
  showOptions: ref(false),
  itemData: ref<Item | undefined>(),
}

const taggerModal = {
  show: ref(false),
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

const showAlert = ref(false)
const alert = ref({
  publicMessage: '',
  severity: 'error',
  showDeleteBtn: false,
  onClose: () => {},
})

const fetchPreviousItem = ref(false)

const shouldShowUI = ref(false)
const showUITimeout = ref<number | undefined>()
const preventHideUI = ref(false)

const showPinedAnim = ref(false)
const showUnpinedAnim = ref(false)

// Refs to Components element in template.
const TheLoopCmp = ref<{
  goToLoopStart: Function;
  startLooping: Function;
  stopLooping: Function;
  pauseLooping: Function;
  resumeLooping: Function;
  setIndeterminate: Function;
  value: Ref<number>;
} | null>(null)

const ItemsPlayerCmp = ref<{
  setNextItemData: Function;
  showNextItem: Function;
  isItemVideo: Function;
  playItem: Function;
  pauseItem: Function;
  getItemDuration: Function;
} | null>(null)

// Computeds

const hasFileTypesSource = computed(() => !!sourceOptsStore.fileTypes.value.length)
const hasTagsSource = computed(() => !!sourceOptsStore.tags.value.size)
const isFromPinedsSource = sourceOptsStore.isFromPined

const isSourceDB = computed(() => playerStore.getFetchSource() === FetchSource.db)

const intervalMs = computed(() => interval.value * 1000)

const playingItemSelectedPath = computed(() => {
  return playingItemData.value?.customFolderPath || ''
})

const playingItemRandomPath = computed(() => {
  return playingItemData.value?.randomPublicPath || ''
})

const playingItemTags = computed(() => {
  return playingItemData.value?.tags || new Set<TagId>()
})

const isPinedPlayingItem = computed(() => {
  return playingItemPinedIndex.value >= 0
})

const showTheItemPathChip = computed(() => {
  return !!playingItemData.value
})

const showTheTagsList = computed(() => {
  return !!playingItemData.value
})

const showTheHistoryChip = computed(() => {
  return !!historyLength.value
})

const historyLength = computed(() => playerStore.getHistoryLength())

const historyIndex = computed({
  get () {
    return playerStore.getHistoryIndex()
  },
  set (index) {
    playerStore.setHistoryIndex(index)
  },
})

const deleteSrcText = computed(() => {
  return `Src: ${deleteModal.itemData.value?.src}`
})

onMounted(async () => {
  // Reset history index.
  historyIndex.value = historyLength.value - 1

  stop.value = false
  pause.value = false

  // Init pined states from UI options.
  itemPathChip.pined.value = pinPath.value
  tagsList.pined.value = pinTags.value
  historyChip.pined.value = pinHistory.value
  pinedChip.pined.value = pinPined.value
  itemsInfoChip.pined.value = pinListIndex.value
  loop.pined.value = pinLoop.value

  if (isFromPinedsSource.value) {
    await playerStore.fetchItemsFromPineds()
  } else if (hasTagsSource.value || hasFileTypesSource) {
    setLoopIndeterminate(true)

    try {
      await playerStore.fetchItemsFromDB()
    } catch (e) {
      const error = buildError(e)

      setLoopIndeterminate(false)
      displayAlert({ ...error, onClose: stopPlaying })

      if (error.severity === ERROR_SEVERITY_INFO) {
        return Promise.resolve()
      }

      throw error
    }
  } else {
    await playerStore.fetchItemsFromFS()
  }

  await taggerStore.taggerReadyPromise

  goToNextItem()

  return Promise.resolve()
})

onBeforeUnmount(() => {
  stopPlaying()
})

function startPlaying ({ startLooping = true, playItem = true } = {}) {
  stop.value = false
  pause.value = false

  TheLoopCmp.value?.goToLoopStart()

  if (playItem) {
    startPlayingItem()
  }
  if (startLooping) {
    TheLoopCmp.value?.startLooping()
  }
}

function stopPlaying () {
  stop.value = true

  stopPlayingItem()

  TheLoopCmp.value?.stopLooping()

  diapoShuffleStore.showThePlayer.value = false
}

function pausePlaying ({ pauseItem = true, pauseLooping = true } = {}) {
  pause.value = true

  if (pauseItem) {
    pausePlayingItem()
  }
  if (pauseLooping) {
    TheLoopCmp.value?.pauseLooping()
  }
}

function resumePlaying ({ resumeItem = true, resumeLooping = true } = {}) {
  stop.value = false
  pause.value = false

  if (resumeItem) {
    resumePlayingItem()
  }
  if (resumeLooping) {
    TheLoopCmp.value?.resumeLooping()
  }
}

function setLoopIndeterminate (state: boolean) {
  TheLoopCmp.value?.setIndeterminate(state)
}

function setCurrentItemIndex (index: number) {
  if (typeof index !== 'number') {
    return
  }

  if (isSourceDB.value) {
    playerStore.setCurrentItemIndex(index)
  } else if (isFromPinedsSource.value) {
    playerStore.setCurrentPinedIndex(index)
  }
}

async function onLoopEnd () {
  await TheLoopCmp.value?.stopLooping()

  if (stop.value) {
    return Promise.resolve()
  }

  setLoopIndeterminate(true)

  let itemData
  try {
    if (nextItemData.value) {
      itemData = clone(nextItemData.value)
    } else {
      itemData = await (fetchNextItemPromise || fetchItem())
    }
  } catch (e) {
    const error = buildError(e)
    pausePlaying()
    displayAlert(error)
    throw error
  }

  if (stop.value) {
    return Promise.resolve()
  }

  // TODO
  // setCurrentItemIndex(itemData.index);

  fetchNextItem()

  setLoopIndeterminate(false)

  return showAndPlayNextItem(itemData, { isNextItemSet: isNextItemSet.value, animate: true })
}

async function onPlayingItemLoaded () {
  if (!nextItemData.value) {
    await fetchNextItemPromise
  }

  setNextItemData(nextItemData.value!)
}

function onPlayingItemError ({ item }: { item: Item }) {
  loadErrorItemData.value = item

  pausePlaying()

  displayAlert({
    publicMessage: `Fail to load item: ${item.src}`,
    showDeleteBtn: true,
    onClose: goToNextItem,
  })

  onPlayingItemLoaded()
}

function onItemsPlayerClick () {
  if (pause.value) {
    resumePlaying()
  } else {
    pausePlaying()
  }
}

function onMouseOverUI () {
  preventHideUI.value = true
  showUI()

  clearTimeout(showUITimeout.value)
  showUITimeout.value = undefined
}

function onMouseOutUI () {
  preventHideUI.value = false
  showUIDuring()
}

function setNextItemData (itemData: Item) {
  ItemsPlayerCmp.value?.setNextItemData(itemData)
  isNextItemSet.value = true
}

function resetNextItemData () {
  isNextItemSet.value = false
  nextItemData.value = undefined
  fetchNextItemPromise = undefined
}

async function showAndPlayNextItem (
  itemData: Item,
  { isNextItemSet = false, animate = false } = {},
) {
  if (stop.value) {
    return Promise.resolve()
  }

  if (!isNextItemSet) {
    setNextItemData(itemData)
  }

  // Await for next tick to let the next item to load.
  await nextTick()

  if (stop.value) {
    return Promise.resolve()
  }

  // Switch to the next item.
  await ItemsPlayerCmp.value?.showNextItem({ animate })

  playingItemData.value = itemData
  isPlayingItemVideo.value = ItemsPlayerCmp.value?.isItemVideo()
  playingItemPinedIndex.value = getPinedIndex(itemData)

  if (stop.value) {
    return Promise.resolve()
  }

  return playNextItem()
}

function startPlayingItem () {
  ItemsPlayerCmp.value?.playItem()
}

function stopPlayingItem () {
  pausePlayingItem()
}

function pausePlayingItem () {
  ItemsPlayerCmp.value?.pauseItem()
}

function resumePlayingItem () {
  ItemsPlayerCmp.value?.playItem()
}

function setLoopDuration () {
  const itemDuration = ItemsPlayerCmp.value?.getItemDuration()
  const duration = Math.max(itemDuration, intervalMs.value)

  loop.duration.value = duration
}

async function fetchItem () {
  let item
  let error

  try {
    item = fetchPreviousItem.value
      ? playerStore.fetchPreviousItem()
      : playerStore.fetchNextItem()
  } catch (e) {
    error = buildError(e)
    displayAlert(error)
    throw error
  }

  // Return next item data.
  return item
}

function fetchNextItem () {
  // Start fetching the next item of the current next item.
  resetNextItemData()

  fetchNextItemPromise = fetchItem()
    .then((item) => {
      nextItemData.value = item
      return nextItemData.value
    })
    .catch((e) => {
      console.error('On fetch next Item:', e)

      // TODO: Enh: manage the error, do not try to load next item, and display
      //            error message when trying to display next item.
      const error = buildError(e)
      pausePlaying()
      displayAlert(error)
      throw error
    })

  return fetchNextItemPromise
}

async function goToLoopEnd ({ addToHistory = false } = {}) {
  try {
    await onLoopEnd()

    if (stop.value) {
      return Promise.resolve()
    }

    if (addToHistory) {
      addHistoryItem(playingItemData.value!)
      historyIndex.value = historyLength.value - 1
    }
  } catch (e) {
    const error = buildError(e)

    pausePlaying()
    displayAlert(error)

    throw error
  }
  return Promise.resolve()
}

async function goToItem (item: Item, nextItem: Item) {
  // TODO
  // setCurrentItemIndex(item.index);

  if (nextItemData.value) {
    isNextItemSet.value = false
    nextItemData.value = nextItem
  } else {
    fetchNextItem()
  }

  return showAndPlayNextItem(item)
}

async function goToNextItem ({ pausePlayingIfStillInHistory = false } = {}) {
  if (isLoadingItem.value) {
    return Promise.resolve()
  }

  isLoadingItem.value = true

  if (fetchPreviousItem.value) {
    resetNextItemData()
    fetchPreviousItem.value = false
  }

  // If requested history's index is greater than history length,
  // call onLoopEnd to fetch next item and then add it to the history list.
  if (historyIndex.value + 1 >= historyLength.value) {
    // Set stop and pause to false.
    resumePlaying({ resumeItem: false, resumeLooping: false })

    await goToLoopEnd({ addToHistory: true })
  } else {
    await goToNextHistoryItem({ pausePlayingIfStillInHistory })
  }

  isLoadingItem.value = false

  return Promise.resolve()
}

async function goToPreviousItem () {
  if (isLoadingItem.value) {
    return Promise.resolve()
  }

  isLoadingItem.value = true

  pausePlaying()

  if (!fetchPreviousItem.value) {
    resetNextItemData()
    fetchPreviousItem.value = true
  }

  if (!isFetchItemRandomly.value && (isSourceDB.value || isFromPinedsSource)) {
    await goToLoopEnd()
  } else {
    await goToPreviousHistoryItem()
  }

  isLoadingItem.value = false

  return Promise.resolve()
}

async function goToNextHistoryItem ({ pausePlayingIfStillInHistory = false } = {}) {
  if (stop.value) {
    return Promise.resolve()
  }

  pausePlayingItem()

  if (pausePlayingIfStillInHistory) {
    pausePlaying({ pauseItem: false, pauseLooping: false })
  }

  await TheLoopCmp.value?.stopLooping()

  if (stop.value) {
    return Promise.resolve()
  }

  historyIndex.value = historyIndex.value + 1

  // Get item data.
  const itemData = getHistoryItem(historyIndex.value)
  const nextItemData = getHistoryItem(historyIndex.value + 1)

  return goToItem(itemData, nextItemData)
}

async function goToPreviousHistoryItem ({ pausePlayingIfStillInHistory = false } = {}) {
  if (stop.value) {
    return Promise.resolve()
  }

  pausePlayingItem()

  if (historyIndex.value - 1 < 0) {
    historyIndex.value = 0
    return Promise.resolve()
  }

  if (pausePlayingIfStillInHistory) {
    pausePlaying({ pauseItem: false, pauseLooping: false })
  }

  await TheLoopCmp.value?.stopLooping()

  if (stop.value) {
    return Promise.resolve()
  }

  historyIndex.value = historyIndex.value - 1

  // Get item data.
  const itemData = getHistoryItem(historyIndex.value)
  const nextItemData = getHistoryItem(historyIndex.value - 1)

  return goToItem(itemData, nextItemData)
}

function getHistoryItem (index: number) {
  return playerStore.getHistoryItemAt(index)
}

function addHistoryItem (item: Item) {
  // TODO: should we need to clone the item here?
  return playerStore.addHistoryItem(item)
}

function editHistoryItem (index: number, item: Item) {
  // TODO: should need to clone item here?
  return playerStore.setHistoryItemIndex(index, item)
}

function showDeleteModal ({ item, showOptions = false }: { item: Item; showOptions?: boolean }) {
  showUI()
  pausePlaying()
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
} = {}) {
  const item = deleteModal.itemData.value

  hideUI()

  deleteModal.show.value = false
  deleteModal.itemData.value = undefined

  startKSListener()

  if (item && remove) {
    deleteItem({
      item,
      fromBddOnly,
      ignoreIfNotExist,
    }).catch((e: unknown) => {
      const error = buildError(e)

      pausePlaying()
      displayAlert(error)

      throw error
    })
  }
}

function showTaggerModal () {
  pausePlaying({ pauseItem: false })
  stopKSListener()
  taggerModal.show.value = true
}

function hideTaggerModal () {
  taggerModal.show.value = false
  startKSListener()
  showUIDuring(3000)
}

async function onSaveTaggerModal (selectedTagIds: Set<TagId>) {
  const tags = selectedTagIds
  const item = playingItemData.value!

  // TODO: reactivity?
  item.tags = tags

  editHistoryItem(historyIndex.value, item)

  try {
    await playerStore.setItemTags({ item })
  } catch (e) {
    const error = buildError(e)

    pausePlaying()
    displayAlert(error)

    throw error
  }
}

async function deleteItem ({
  item,
  fromBddOnly,
  ignoreIfNotExist,
}: {
  item: Item;
  fromBddOnly?: boolean;
  ignoreIfNotExist?: boolean;
}) {
  if (!item) {
    return Promise.resolve()
  }

  playerStore.deleteHistoryItem(item)

  goToNextItem({ pausePlayingIfStillInHistory: true })

  let response
  let error

  try {
    response = await playerStore.deleteItem({
      item,
      fromBddOnly,
      ignoreIfNotExist,
    })
  } catch (e) {
    error = buildError(e)

    pausePlaying()
    displayAlert(error)

    throw error
  }

  return response
}

function getPinedIndex (item: Item) {
  return item
    ? playerStore.getPinedItemIndex(item)
    : -1
}

function togglePinItem ({ item }: { item: Item }) {
  let index

  if (isPinedPlayingItem.value) {
    playerStore.splicePinedItem(playingItemPinedIndex.value)
    triggerUnpinedAnim()
    index = -1
  } else {
    playerStore.addPinedItem(item)
    index = getPinedIndex(item)
    triggerPinedAnim()
  }

  playingItemPinedIndex.value = index
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

function displayAlert ({
  publicMessage = 'Unknow error.',
  severity = 'error',
  showDeleteBtn = false,
  onClose = () => {},
} = {}) {
  alert.value = {
    publicMessage,
    severity,
    showDeleteBtn,
    onClose,
  }
  showAlert.value = true
}

function hideAlert () {
  showAlert.value = false
  alert.value.onClose?.()
}

function keyboardShortcuts (key: string) {
  switch (key) {
  case 'Space':
    if (pause.value) {
      resumePlaying()
    } else {
      pausePlaying()
    }
    break

    // On ArrowDown only pause/resume looping to allow to play video in
    // infinite loop if wanted.
  case 'ArrowDown':
    if (pause.value) {
      resumePlaying({ resumeItem: false })
    } else {
      pausePlaying({ pauseItem: false })
    }
    break

  case 'Escape':
    stopPlaying()
    break

  case 'ArrowRight':
    goToNextItem({ pausePlayingIfStillInHistory: true })
    break

  case 'ArrowLeft':
    goToPreviousItem()
    break

  case 'Delete':
    if ((TheLoopCmp.value?.value || NaN) < loop.duration.value || pause.value) {
      showDeleteModal({ item: playingItemData.value! })
    }
    break

  case 'h':
    pausePlaying()
    showTheHelp.value = true
    break

  case 'p':
    pausePlaying({ pauseItem: false })
    togglePinItem({ item: playingItemData.value! })
    showUIDuring(3000)
    break

  case 't':
    if ((TheLoopCmp.value?.value || NaN) < loop.duration.value || pause.value) {
      showTaggerModal()
    }
    break
  default:
  }
}

async function playNextItem () {
  await TheLoopCmp.value?.goToLoopStart()

  setLoopDuration()

  if (pause.value) {
    TheLoopCmp.value?.pauseLooping()
  } else {
    TheLoopCmp.value?.startLooping()
  }

  startPlayingItem()
}

function showUIDuring (time = 2000) {
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

function showUI () {
  shouldShowUI.value = true
}

function hideUI () {
  shouldShowUI.value = false
}

function togglePinUI (uiName: string) {
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

watch(showTheHelp, (isShow) => {
  if (isShow) {
    stopKSListener()
  } else {
    startKSListener()
  }
})
</script>

<template>
  <div
    :class="[
      'the-player',
      {
        'video-item': isPlayingItemVideo,
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
        ref="TheLoopCmp"
        v-show="showLoop"
        :duration="loop.duration.value"
        :dense="!loop.pined.value && !shouldShowUI"
        :show-duration-time="isPlayingItemVideo"
        show-remaining-time
        @end="goToNextItem"
      />
    </PinWrapper>

    <PauseBtn
      v-show="pause"
      class="the-pause-btn"
      @click="resumePlaying"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    />

    <PinWrapper
      v-if="showPined && isPinedPlayingItem"
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
        @click="playingItemData && togglePinItem({ item: playingItemData })"
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
          <v-btn @click="showDeleteModal({ item: loadErrorItemData!, showOptions: true })">
            Delete
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>

    <PinWrapper
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
      <HistoryChip class="the-history-chip" @click="pausePlaying" />
    </PinWrapper>

    <PinWrapper
      v-if="showListIndex && (isFromPinedsSource || isSourceDB)"
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
      <ItemsInfoChip class="the-items-info-chip" @click="pausePlaying" />
    </PinWrapper>

    <PinWrapper
      v-if="showTags"
      v-show="showTheTagsList"
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
      :mute-video="isMuteVideo"
      @click="onItemsPlayerClick"
      @currentItem:loaded="onPlayingItemLoaded"
      @currentItem:error="onPlayingItemError"
    />

    <PinWrapper
      v-if="showPath"
      v-show="showTheItemPathChip"
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
        :path-start="playingItemSelectedPath"
        :path-end="playingItemRandomPath"
        @click="pausePlaying"
        @mouseover="onMouseOverUI"
        @mouseout="onMouseOutUI"
      />
    </PinWrapper>

    <TaggerModal
      :show="taggerModal.show.value"
      :selected-tag-ids="playingItemTags"
      @close="hideTaggerModal"
      @save="onSaveTaggerModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.the-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  background-color: $grey-8;
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
