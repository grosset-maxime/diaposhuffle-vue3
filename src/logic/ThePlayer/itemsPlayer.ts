// Types
import { type Ref, type CSSProperties, reactive } from 'vue'
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed, onMounted } from 'vue'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayer'

// import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayer'

type ItemName = 'item1' | 'item2'

// Refs
interface ItemObj {
  name: string
  src: string
  data: Item | undefined
  styles: CSSProperties
  videoOptions: videoOpts
  isLoaded: boolean
  isError: boolean
  onLoadPromise: Promise<void> | undefined
  onLoadResolve: ((value?: unknown) => void) | undefined
  onLoadReject: ((value?: unknown) => void) | undefined
  onLoad: () => void
  onError: (error: unknown) => void
}

interface videoOpts {
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  controlsList: string;
}
const defaultVideoOptions: videoOpts = {
  autoplay: false,
  loop: true,
  muted: true,
  controls: true,
  controlsList: [ 'nofullscreen', 'nodownload', 'noremoteplayback' ].join(' '),
}

interface UseItemsPlayer {
  itemsRefs: Ref<Map<string, HTMLDivElement>>
}

export const useItemsPlayer = ({ itemsRefs }: UseItemsPlayer) => {

  const thePlayerStore = useThePlayerStore()

  const ITEM_1_NAME: ItemName = 'item1'
  const ITEM_2_NAME: ItemName = 'item2'

  const createItemObj = (itemName: ItemName): ItemObj => ({
    name: itemName,
    src: '',
    data: undefined,
    styles: { opacity: 1, zIndex: 2 },
    videoOptions: { ...defaultVideoOptions },
    isLoaded: false,
    isError: false,
    onLoadPromise: undefined,
    onLoadResolve: undefined,
    onLoadReject: undefined,
    onLoad: itemName === 'item1'
      ? onLoadItem1
      : onLoadItem2,
    onError: itemName === 'item1'
      ? onErrorItem1
      : onErrorItem2,
  })

  const item1 = reactive(createItemObj(ITEM_1_NAME))
  const item2 = reactive(createItemObj(ITEM_2_NAME))

  const items: Map<ItemName, ItemObj> = new Map([
    [ ITEM_1_NAME, item1 ],
    [ ITEM_2_NAME, item2 ],
  ])

  const currentItemName = ref<ItemName>(ITEM_1_NAME)
  const switchWithTransition = ref(false)

  // Computeds
  const nextItemName = computed<ItemName>(() => {
    return currentItemName.value === ITEM_1_NAME
      ? ITEM_2_NAME
      : ITEM_1_NAME
  })

  function getItem (itemName: ItemName = currentItemName.value): ItemObj {
    return items.get(itemName)!
  }

  function getItemEl (itemName: ItemName = currentItemName.value): HTMLDivElement {
    return itemsRefs.value.get(itemName)!
  }

  function getItemData (itemName: ItemName = currentItemName.value): Item | undefined {
    return getItem(itemName).data
  }

  function getVideoEl (itemName: ItemName = currentItemName.value): HTMLVideoElement {
    return getItemEl(itemName).querySelector('.item.vid')!
  }

  function isItemVideo (itemName: ItemName = currentItemName.value): boolean {
    return !!getItemData(itemName)?.isVideo
  }

  function getItemDuration (itemName = currentItemName.value): number {
    let duration = NaN

    if (isItemVideo(itemName)) {
      const videoEl = getVideoEl(itemName)
      duration = (videoEl.duration || 0) * 1000
    }

    return duration
  }

  function createLoadItemPromise (itemName: ItemName = currentItemName.value): Promise<void> {
    const item = getItem(itemName)

    return new Promise((resolve, reject) => {
      item.onLoadResolve = resolve
      item.onLoadReject = reject
    })
      .then(() => {
        item.isError = false
        item.isLoaded = true
      })
      .catch(() => {
        item.isError = true
        item.isLoaded = false
      })
  }

  function resetItem (itemName: ItemName): void {
    const item = getItem(itemName)
    item.src = ''
    item.data = undefined
    item.isLoaded = false
    item.isError = false
  }

  function setItemData (itemName: ItemName, data: Item): void {
    const item = getItem(itemName)

    item.onLoadPromise = createLoadItemPromise(itemName)

    // To force item.data.src to be always different from previous item
    // even if it is the same item src.
    item.src = `${data.src}?b=${Date.now()}`

    item.data = data
  }

  function pauseVideo (itemName: ItemName = currentItemName.value): void {
    getVideoEl(itemName).pause()
  }

  function playVideo (itemName: ItemName = currentItemName.value): void {
    getVideoEl(itemName).play()
  }

  async function switchItems ({ animate = false } = {}): Promise<void> {
    let animateItemsPromise = Promise.resolve()

    const currentItem = getItem(currentItemName.value)
    const nextItem = getItem(nextItemName.value)

    switchWithTransition.value = animate

    if (animate) {
      let currentItemPromiseResolve: Function

      animateItemsPromise = new Promise((resolveCurrent) => {
        currentItemPromiseResolve = resolveCurrent
      })
      const currentItemEl = getItemEl(currentItemName.value)

      const onTransitionEndCurrentItem = () => {
        currentItemEl.removeEventListener('transitionend', onTransitionEndCurrentItem)
        currentItemPromiseResolve()
      }

      currentItemEl.addEventListener('transitionend', onTransitionEndCurrentItem, false)
    }

    pauseItem(currentItemName.value)

    nextItem.styles = { ...nextItem.styles, opacity: 1, zIndex: 2 }
    currentItem.styles = { ...currentItem.styles, opacity: 0, zIndex: 1 }

    await animateItemsPromise

    currentItemName.value = nextItemName.value
  }

  function onLoadItem1 (): void { item1.onLoadResolve?.() }
  function onLoadItem2 (): void { item2.onLoadResolve?.() }

  function onItemLoaded (itemName: ItemName) { getItem(itemName).onLoad?.() }
  function onItemError (itemName: ItemName, error: unknown): void {
    getItem(itemName).onError?.(error)
  }
  function onErrorItem1 (error: unknown) { item1.onLoadReject?.(error) }
  function onErrorItem2 (error: unknown) { item2.onLoadReject?.(error) }

  // #region exposed methods
  function setNextItem (nextItem: Item): void {
    setItemData(nextItemName.value, nextItem)
  }

  async function showNextItem ({ animate = false } = {}): Promise<void> {
    const item = getItem(nextItemName.value)

    await item.onLoadPromise

    await switchItems({ animate })

    resetItem(nextItemName.value)

    playItem()
  }

  function pauseItem (itemName: ItemName = currentItemName.value): void {
    if (isItemVideo(itemName)) {
      pauseVideo(itemName)
      thePlayerStore.isItemPaused.value = true
    }
  }

  function playItem (itemName: ItemName = currentItemName.value): void {
    if (isItemVideo(itemName)) {
      thePlayerStore.isItemVideo.value = true
      playVideo(itemName)
      thePlayerStore.isItemPaused.value = false
    } else {
      thePlayerStore.isItemVideo.value = false
    }
  }
  // #endregion exposed methods

  return {
    items,

    switchWithTransition: computed<boolean>(() => switchWithTransition.value),

    setNextItem,
    showNextItem,

    getItemDuration,
    playItem,
    pauseItem,

    onItemLoaded,
    onItemError,
  }
}
