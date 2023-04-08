
// Types
import type { Ref } from 'vue'
import type { TagCategoryId, TagId, Tag, TagCategory } from '@/models/tag'
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Libs
import { ERROR_SEVERITY_INFO, buildError } from '@/api/api'
import { clone } from '@/utils/utils'

// Stores
import { useGlobalState } from '@/stores'
import { useDiapoShuffleStore } from '@/stores/diapoShuffle'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'
import { useUIOptionsStore } from '@/stores/ThePlayerOptions/uiOptions'
import { usePlayerStore, FetchSource } from '@/stores/ThePlayer/ThePlayer'
import { useTaggerStore } from '@/stores/tagger'

interface UseThePlayer {
}
export const useThePlayer = ({
}: UseThePlayer) => {

  let fetchNextItemPromise: Promise<Item> | undefined = undefined

  const playerStore = usePlayerStore()
  const taggerStore = useTaggerStore()

  // #region Refs
  const loop = {
    duration: ref(0),
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

  const fetchPreviousItem = ref(false)
  // #endregion Refs

  // #region Computeds
  const hasFileTypesSource = computed(() => !!sourceOptsStore.fileTypes.value.length)
  const hasTagsSource = computed(() => !!sourceOptsStore.tags.value.size)
  const isFromPinedsSource = sourceOptsStore.isFromPined

  const isSourceDB = computed(() => playerStore.getFetchSource() === FetchSource.db)

  const intervalMs = computed(() => interval.value * 1000)

  const isPinedPlayingItem = computed(() => {
    return playingItemPinedIndex.value >= 0
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
  // #endregion Computeds

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

  return {

  }
}
