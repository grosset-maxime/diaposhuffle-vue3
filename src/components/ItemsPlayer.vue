<script setup lang="ts">
// Types
import type { Ref, CSSProperties } from 'vue';

// Vendors Libs
import { ref, computed, onMounted } from 'vue';

import type { Item } from '@/models/item';

const ITEM_1_NAME = 'item1';
const ITEM_2_NAME = 'item2';

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
  controlsList: ['nofullscreen', 'nodownload', 'noremoteplayback'].join(' '),
};

// Props
interface Props {
  muteVideo?: boolean;
}
withDefaults(defineProps<Props>(), {
  muteVideo: true,
});

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'video:pause'): void;
  (e: 'video:play'): void;
  (e: 'currentItem:loaded', itemName: string): void;
  (e: 'currentItem:error', error: { item: Item }): void;
}>();

// Refs
interface ItemObj {
  name: string;
  src: Ref<string>;
  data: Ref<Item | undefined>;
  styles: Ref<CSSProperties>;
  videoOptions: Ref<videoOpts>;
  isLoaded: Ref<boolean>;
  isError: Ref<boolean>;
  onLoadPromise: Promise<void> | undefined;
  onLoadResolve: Function | undefined;
  onLoadReject: Function | undefined;
  onLoad: Function | undefined;
  onError: Function | undefined;
}

const createItemObj = (itemName: string): ItemObj => ({
  name: itemName,
  src: ref(''),
  data: ref(),
  styles: ref({ opacity: 1, zIndex: 2 }),
  videoOptions: ref({ ...defaultVideoOptions }),
  isLoaded: ref(false),
  isError: ref(false),
  onLoadPromise: undefined,
  onLoadResolve: undefined,
  onLoadReject: undefined,
  onLoad: undefined,
  onError: undefined,
});

const item1 = createItemObj(ITEM_1_NAME);
const item2 = createItemObj(ITEM_2_NAME);

const items = ref<Map<string, ItemObj>>(
  new Map([
    [ITEM_1_NAME, item1],
    [ITEM_2_NAME, item2],
  ])
);

const currentItemName = ref(ITEM_1_NAME);
const switchWithTransition = ref(false);

const itemRefs = ref(new Map());

// Computeds
const currentItemData = computed(() => {
  return items.value.get(currentItemName.value)!.data.value;
});

const nextItemName = computed(() => {
  return currentItemName.value === ITEM_1_NAME ? ITEM_2_NAME : ITEM_1_NAME;
});

onMounted(() => {
  item1.onLoad = onLoadItem1;
  item1.onLoad = onLoadItem2;
  item2.onError = onErrorItem1;
  item2.onError = onErrorItem2;
});

function getItemName(i: number) {
  return `item${i + 1}`;
}

function getItems() {
  return [item1, item2];
}

function getItem(itemName = currentItemName.value) {
  return items.value.get(itemName)!;
}

function getItemEl(itemName = currentItemName.value): HTMLDivElement {
  return itemRefs.value.get(itemName);
}

function getItemData(itemName = currentItemName.value) {
  return getItem(itemName).data.value;
}

function getImageEl(itemName = currentItemName.value): HTMLImageElement {
  return getItemEl(itemName).querySelector('.item.img')!;
}

function getVideoEl(itemName = currentItemName.value): HTMLVideoElement {
  return getItemEl(itemName).querySelector('.item.vid')!;
}

/**
 * @public
 */
function getItemDuration(itemName = currentItemName.value) {
  let duration = 0;

  if (isItemVideo(itemName)) {
    const videoEl = getVideoEl(itemName);
    if (videoEl) {
      duration = (videoEl.duration || 0) * 1000;
    }
  }

  return duration;
}

function getCurrentItemSrc() {
  return currentItemData.value?.src;
}

function isItemImage(itemName = currentItemName.value) {
  return !isItemVideo(itemName);
}

function isItemVideo(itemName = currentItemName.value) {
  return !!getItemData(itemName)?.isVideo;
}

function createLoadItemPromise(itemName = currentItemName.value) {
  const item = getItem(itemName);

  return new Promise((resolve, reject) => {
    item.onLoadResolve = resolve;
    item.onLoadReject = reject;
  })
    .then(() => {
      item.isError.value = false;
      item.isLoaded.value = true;
    })
    .catch(() => {
      item.isError.value = true;
      item.isLoaded.value = false;
    });
}

function resetItem(itemName: string) {
  const item = getItem(itemName);
  item.src.value = '';
  item.data.value = undefined;
  item.isLoaded.value = false;
  item.isError.value = false;
}

function setItemData(itemName: string, data: Item) {
  const item = getItem(itemName);

  item.onLoadPromise = createLoadItemPromise(itemName);

  // To force item.data.src to be always different from previous item
  // even if it is the same item src.
  item.src.value = `${data.src}?b=${Date.now()}`;

  item.data.value = data;
}

/**
 * @public
 */
function setNextItemData(nextItemData: Item) {
  setItemData(nextItemName.value, nextItemData);
}

/**
 * @public
 */
async function showNextItem({ animate = false } = {}) {
  const item = getItem(nextItemName.value);

  await item.onLoadPromise;

  await switchItems({ animate });

  resetItem(nextItemName.value);

  if (item.isLoaded) {
    emit('currentItem:loaded', currentItemName.value);
  } else if (item.isError) {
    emit('currentItem:error', { item: item.data.value! });
  }
}

/**
 * @public
 */
function pauseItem(itemName = currentItemName.value) {
  if (isItemVideo(itemName)) {
    pauseVideo(itemName);
  }
}

/**
 * @public
 */
function playItem(itemName = currentItemName.value) {
  if (isItemVideo(itemName)) {
    playVideo(itemName);
  }
}

function pauseVideo(itemName = currentItemName.value) {
  getVideoEl(itemName).pause();
}

function playVideo(itemName = currentItemName.value) {
  getVideoEl(itemName).play();
}

async function switchItems({ animate = false } = {}) {
  let animateItemsPromise = Promise.resolve();

  const currentItem = getItem(currentItemName.value);
  const nextItem = getItem(nextItemName.value);

  switchWithTransition.value = animate;

  if (animate) {
    let currentItemPromiseResolve: Function;

    animateItemsPromise = new Promise((resolveCurrent) => {
      currentItemPromiseResolve = resolveCurrent;
    });
    const currentItemEl = getItemEl(currentItemName.value);

    const onTransitionEndCurrentItem = () => {
      currentItemEl.removeEventListener('transitionend', onTransitionEndCurrentItem);
      currentItemPromiseResolve();
    };

    currentItemEl.addEventListener('transitionend', onTransitionEndCurrentItem, false);
  }

  pauseItem(currentItemName.value);

  nextItem.styles.value = { ...nextItem.styles.value, opacity: 1, zIndex: 2 };
  currentItem.styles.value = { ...currentItem.styles.value, opacity: 0, zIndex: 1 };

  await animateItemsPromise;

  currentItemName.value = nextItemName.value;
}

function onItemLoaded(itemName: string) {
  getItem(itemName).onLoad!();
}

function onItemError(itemName: string, error: unknown) {
  getItem(itemName).onError!(error);
}

function onLoadItem1() {
  item1.onLoadResolve!();
}

function onLoadItem2() {
  item2.onLoadResolve!();
}

function onErrorItem1(error: unknown) {
  item1.onLoadReject!(error);
}

function onErrorItem2(error: unknown) {
  item2.onLoadReject!(error);
}

function onClick() {
  emit('click');
}

function onPauseVideo() {
  emit('video:pause');
}

function onPlayVideo() {
  emit('video:play');
}
</script>

<template>
  <div class="items-player" @click="onClick">
    <div
      v-for="(item, i) in getItems()"
      :key="getItemName(i)"
      :ref="(el) => itemRefs.set(getItemName(i), el)"
      :class="[
        'item-ctn',
        getItemName(i),
        {
          transition: switchWithTransition,
        },
      ]"
      :style="item.styles.value"
    >
      <img
        v-if="item.src && (item.data || {}).value?.isImage"
        :src="item.src.value"
        class="item img"
        draggable="false"
        @load="onItemLoaded(getItemName(i))"
        @error="onItemError(getItemName(i), $event)"
      />
      <video
        v-if="item.src && (item.data || {}).value?.isVideo"
        :src="item.src.value"
        class="item vid"
        :autoplay="item.videoOptions.value.autoplay"
        :loop="item.videoOptions.value.loop"
        :muted="muteVideo"
        :controls="item.videoOptions.value.controls"
        :controlsList="item.videoOptions.value.controlsList"
        disablePictureInPicture
        @canplay="onItemLoaded(getItemName(i))"
        @pause="onPauseVideo()"
        @play="onPlayVideo()"
        @error="onItemError(getItemName(i), $event)"
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
