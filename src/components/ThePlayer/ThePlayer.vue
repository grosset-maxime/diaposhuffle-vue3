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
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { eagerComputed } from '@vueuse/shared'

// Libs
import { useKeyboardShortcutsListener } from '@/logic/useKeyboardShortcutsListener'
import {
  emitter,
  ON_ITEM_DELETED,
  ON_THE_PLAYER_EXIT,
} from '@/logic/useEmitter'

// Stores
import { useMainStore } from '@/stores/mainStore'
import { useDiapoShuffleStore } from '@/stores/diapoShuffleStore'
import { useUIOptionsStore } from '@/stores/ThePlayerOptions/uiOptionsStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { usePinedPlayerStore } from '@/stores/ThePlayer/players/pinedPlayerStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'

// Components
import TheLoop from '@/components/ThePlayer/TheLoop.vue'
import GenericBtn from '@/components/ThePlayer/GenericBtn.vue'
import ItemsPlayer from '@/components/ThePlayer/ItemsPlayer.vue'
import TagsList from '@/components/ThePlayer/TagsList.vue'
import ItemsInfoChip from '@/components/ThePlayer/ItemsInfoChipChip.vue'
import PinWrapper from '@/components/ThePlayer/PinWrapper.vue'
import ItemPathChip from '@/components/ThePlayer/ItemPathChip.vue'
import TheTagger from '@/components/TheTagger/TheTagger.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import FloatingAlert from '@/components/FloatingAlert.vue'

import { PlayerName } from '@/logic/ThePlayer/useThePlayer'
import type { ErrorAlert } from '@/models/Alerts/errorAlert'
import { logError } from '@/utils/errorUtils'
import { createCustomError, CustomError, type CustomErrorData } from '@/models/customError'
import { createAlert } from '@/utils/alertUtils'
import type { WarningAlert } from '@/models/Alerts/warningAlert'
import type { InfoAlert } from '@/models/Alerts/infoAlert'

const { showTheHelp } = useMainStore()
const { showThePlayer } = useDiapoShuffleStore()
const {
  showListIndex: showItemsInfo,
  showLoop,
  showPath,
  showPined,
  showTags,
  pinListIndex,
  pinLoop,
  pinPath,
  pinPined,
  pinTags,
} = useUIOptionsStore()
const thePlayerStore = useThePlayerStore()
const pinedPlayerStore = usePinedPlayerStore()
const historyPlayerStore = useHistoryPlayerStore()

const item = computed<Item | undefined>(() => thePlayerStore.item.value)
const isPaused = computed<boolean>(() => thePlayerStore.isPaused.value)
const isItemVideo = computed<boolean>(() => thePlayerStore.isItemVideo.value)
const itemTags = computed<Set<TagId>>(() => item.value?.tags || new Set<TagId>())
const isTheLoopEnabled = computed<boolean>(() => thePlayerStore.theLoopEnabled.value)
const isItemsInfoEnabled = computed<boolean>(() => thePlayerStore.itemsInfoEnabled.value)
const isPinedItem = eagerComputed<boolean>(() => pinedPlayerStore.has(item.value))
const historyCount = historyPlayerStore.count

// Refs to Components element in template.
const ItemsPlayerCmp = ref<InstanceType<typeof ItemsPlayer> | null>(null)

// #region Delete Item Modal
const deleteModal: {
  show: Ref<boolean>
  itemData: Ref<Item | undefined>
  onHide: Ref<(((submitted: boolean) => void) | undefined)>
} = {
  show: ref(false),
  itemData: ref(),
  onHide: ref(),
}

const deleteSrcText = computed<string>(() => {
  return `Src: ${deleteModal.itemData.value?.src}`
})

function showDeleteModal (
  { item, onHide }: { item: Item, onHide?: (submitted: boolean) => void },
): void {
  deleteModal.itemData.value = item
  deleteModal.show.value = true
  deleteModal.onHide.value = onHide
}

function showDeleteModalFromCustomAlert (): void {
  item.value && showDeleteModal({
    item: item.value,
    onHide (submitted) {
      if (submitted) {
        hideAlert()
      }
    },
  })
}

async function hideDeleteModal (
  { submitted = false }: { submitted?: boolean } = {},
): Promise<void> {
  const item = deleteModal.itemData.value

  if (item && submitted) {
    try {
      await thePlayerStore.deleteItem({ item })

      emitter.emit(ON_ITEM_DELETED, item)

      deleteModal.onHide.value?.(submitted)
    } catch (e) {
      throw onError(e)
    }
  }

  deleteModal.show.value = false
  deleteModal.onHide.value = undefined
  deleteModal.itemData.value = undefined
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
  if (!item.value) { return }

  const tags = selectedTagIds
  const itemVal = item.value

  // TODO: reactivity?
  itemVal.tags = tags

  // editHistoryItem(historyIndex.value, itemVal)

  try {
    await thePlayerStore.setItemTags({ item: itemVal })
  } catch (e) {
    onError(e)
  }
}
// #endregion The Tagger

// #region The Player Alert
const showAlert = ref(false)

interface ThePlayerAlert {
  customAlert?: ErrorAlert | InfoAlert | WarningAlert
  showFooter?: boolean
  showDeleteBtn?: boolean
  onClose: () => void
}
const alert = ref<ThePlayerAlert>({
  customAlert: undefined,
  showFooter: false,
  showDeleteBtn: false,
  onClose: () => {},
})

function displayAlert ({
  customAlert = undefined,
  showFooter = false,
  showDeleteBtn = false,
  onClose = () => {},
}: Partial<ThePlayerAlert> = {}): void {
  alert.value = {
    customAlert,
    showFooter,
    showDeleteBtn,
    onClose,
  }

  showAlert.value = true
}

function hideAlert (): void {
  showAlert.value = false
  alert.value.onClose?.()

  alert.value = {
    customAlert: undefined,
    showFooter: false,
    showDeleteBtn: false,
    onClose () {},
  }
}
// #endregion The Player Alert

// #region The Player vue
const { startKSListener, stopKSListener }
  = useKeyboardShortcutsListener(keyboardShortcuts)

function switchToHistoryPlayer (): void {
  ItemsPlayerCmp.value?.switchToHistoryPlayer()
}
function closeActivePlayer (): void {
  ItemsPlayerCmp.value?.switchBackToPreviousPlayer()
}

function exitThePlayer (): void {
  ItemsPlayerCmp.value?.stopPlayer()

  showThePlayer.value = false

  emitter.emit(ON_THE_PLAYER_EXIT)
}

async function startPlayer (): Promise<void> {
  try {
    await ItemsPlayerCmp.value?.startPlayer()
  } catch (e) {
    throw onError(e, { actionName: 'startPlayer' })
  }
}
function stopPlayer (): void {
  ItemsPlayerCmp.value?.stopPlayer()
}
function canPausePlayer (): boolean {
  return !!ItemsPlayerCmp.value?.canPausePlayer()
}
function pausePlayer (opts: { pauseItm?: boolean } = {}): void {
  ItemsPlayerCmp.value?.pausePlayer(opts)
}
function canResumePlayer (): boolean {
  return !!ItemsPlayerCmp.value?.canResumePlayer()
}
function resumePlayer (opts: { resumeItm?: boolean } = {}): void {
  ItemsPlayerCmp.value?.resumePlayer(opts)
}
async function goToNextItem ({ animate }: { animate?: boolean} = {}): Promise<void> {
  try {
    await ItemsPlayerCmp.value?.goToNextItem({ animate })
  } catch (e) {
    throw onError(e, { actionName: 'goToNextItem' })
  }
}
async function goToPreviousItem ({ animate }: {animate?: boolean } = {}): Promise<void> {
  try {
    await ItemsPlayerCmp.value?.goToPreviousItem({ animate })
  } catch (e) {
    throw onError(e, { actionName: 'goToPreviousItem' })
  }
}

function togglePinItem (): void {
  if (!item.value) { return }

  if (pinedPlayerStore.has(item.value)) {
    pinedPlayerStore.remove(item.value)
    triggerUnpinedAnim()
  } else {
    pinedPlayerStore.add(item.value)
    triggerPinedAnim()
  }
}

function onItemsPlayerClick (): void {
  if (isPaused.value) {
    resumePlayer()
  } else {
    pausePlayer()
  }
}

function onPlayingItemError ({ item, error }: { item?: Item, error: CustomError }) {
  console.error('### Failing item:', item)

  canPausePlayer()
    ? pausePlayer()
    : stopPlayer()

  stopKSListener()

  const customAlert = createAlert({ error })

  displayAlert({
    showDeleteBtn: true,
    customAlert,
    async onClose () {
      startKSListener()

      try {
        await goToNextItem()

        await canResumePlayer()
          ? resumePlayer()
          : startPlayer()
      } catch (e) {
        onError(e, { actionName: 'displayAlert#onClose' })
      }
    },
  })
}

function onError (error: unknown, errorData?: CustomErrorData): CustomError {
  const customError = createCustomError(error, {
    ...errorData,
    file: 'ThePlayer/ThePlayer.vue',
  })
  logError(customError)

  canPausePlayer()
    ? pausePlayer()
    : stopPlayer()

  stopKSListener()

  const customAlert = createAlert({ error: customError })

  displayAlert({
    customAlert,
    onClose () {
      startKSListener()
    },
  })

  return customError
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
    exitThePlayer()
    break

  case 'ArrowRight':
    goToNextItem({ animate: false })
    break

  case 'ArrowLeft':
    goToPreviousItem({ animate: false })
    break

  case 'Delete':
    showUI()
    pausePlayer()
    stopKSListener()
    showDeleteModal({
      item: item.value!,
      onHide () {
        startKSListener()
        hideUI()
      },
    })
    break

  case 'h':
    pausePlayer()
    showTheHelp.value = true
    break

  case 'p':
    showUIDuring(3000)
    togglePinItem()
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
  () => !!(showLoop.value && isTheLoopEnabled.value),
)
const showTheItemPathChip = eagerComputed<boolean>(
  () => !!(showPath.value && item.value),
)
const showTheTagsList = eagerComputed<boolean>(
  () => !!(showTags.value && item.value),
)
const showTheItemsInfoChip = eagerComputed<boolean>(
  () => !!(showItemsInfo.value && isItemsInfoEnabled.value),
)
const showPinedChip = eagerComputed<boolean>(
  () => !!(showPined.value && isPinedItem.value),
)
const showCloseActivePlayerBtn = eagerComputed<boolean>(
  () => thePlayerStore.playerName.value === PlayerName.history,
)

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
  pinedChip.pined.value = pinPined.value
  itemsInfoChip.pined.value = pinListIndex.value
  loop.pined.value = pinLoop.value

  startKSListener()

  thePlayerStore.isPaused.value = false
})
</script>

<template>
  <div
    class="the-player"
    :class="[{
      'video-item': isItemVideo,
      'show-ui': shouldShowUI,
    }]"
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
      :icon-top="-52"
      :show-icon="shouldShowUI"
      @click="togglePinUI('loop')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <TheLoop
        v-if="showTheLoop"
        :up="loop.pined.value || shouldShowUI"
      />
    </PinWrapper>

    <GenericBtn
      v-if="thePlayerStore.pauseEnabled.value"
      v-show="isPaused"
      class="the-pause-btn"
      @click="resumePlayer"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <div class="pause-icon">
        <div class="stick" />
        <div class="stick" />
      </div>
    </GenericBtn>

    <GenericBtn
      v-if="showCloseActivePlayerBtn"
      class="the-close-active-player-btn ui-top"
      @click="closeActivePlayer"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <v-icon class="history-icon">mdi-close</v-icon>
    </GenericBtn>

    <GenericBtn
      v-if="thePlayerStore.historyEnabled.value"
      class="the-history-btn ui-right"
      :disabled="historyCount <= 0"
      @click="switchToHistoryPlayer"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <v-icon class="history-icon">mdi-history</v-icon>
      <span class="history-count-badge">{{ historyCount }}</span>
    </GenericBtn>

    <GenericBtn
      class="the-settings-btn ui-right"
      @click="pausePlayer"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <v-icon class="settings-icon">mdi-cog</v-icon>
    </GenericBtn>

    <PinWrapper
      v-if="showPinedChip"
      class="the-pined-chip-pin-wrapper ui-top"
      :class="[{
        pined: pinedChip.pined.value,
      }]"
      :is-pined="pinedChip.pined.value"
      :icon-position="Position.bottomLeft"
      :show-icon="shouldShowUI"
      @click="togglePinUI('pinedChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <v-chip
        class="is-pined-item pl-1 pr-1"
        color="primary"
        variant="outlined"
        density="compact"
        label
        @click="togglePinItem()"
      >
        Pined
      </v-chip>
    </PinWrapper>

    <div
      class="pined-unpined-anim"
      :class="[{
        'pined-anim': showPinedAnim,
        'unpined-anim': showUnpinedAnim,
      }]"
    />

    <FloatingAlert
      v-if="alert.customAlert"
      :show="showAlert"
      :custom-alert="alert.customAlert"
      @close="hideAlert"
    >
      <template #alertFooter>
        <div class="alert-footer">
          <v-btn
            v-if="alert.showDeleteBtn"
            @click="showDeleteModalFromCustomAlert"
          >
            Delete
          </v-btn>
          <v-btn @click="exitThePlayer">
            Exit Player
          </v-btn>
          <v-btn @click="hideAlert">
            Ignore
          </v-btn>
        </div>
      </template>
    </FloatingAlert>

    <PinWrapper
      v-if="showTheItemsInfoChip"
      class="the-items-info-chip-pin-wrapper ui-left"
      :class="[{
        pined: itemsInfoChip.pined.value,
      }]"
      :is-pined="itemsInfoChip.pined.value"
      :icon-position="Position.right"
      :icon-top="-7"
      :icon-right="-31"
      :show-icon="shouldShowUI"
      @click="togglePinUI('itemsInfoChip')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <ItemsInfoChip class="the-items-info-chip" @click="pausePlayer" />
    </PinWrapper>

    <PinWrapper
      v-if="showTheTagsList"
      class="the-tags-list-pin-wrapper ui-left"
      :class="[{
        pined: tagsList.pined.value,
      }]"
      :is-pined="tagsList.pined.value"
      :icon-position="Position.topRight"
      :show-icon="shouldShowUI"
      @click="togglePinUI('tagsList')"
      @mouseover="onMouseOverUI"
      @mouseout="onMouseOutUI"
    >
      <TagsList :tags-ids="itemTags" class="the-tags-list" @click="showTaggerModal" />
    </PinWrapper>

    <DeleteModal
      :show="deleteModal.show.value"
      :show-preview="!!deleteModal.itemData.value"
      :show-src="!!deleteModal.itemData.value"
      @confirm="hideDeleteModal({ submitted: true })"
      @cancel="hideDeleteModal({ submitted: false })"
      @click:outside="hideDeleteModal({ submitted: false })"
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
      @load-error="onPlayingItemError"
      @error="onError"
    />

    <PinWrapper
      v-if="showTheItemPathChip"
      class="the-item-path-chip-pin-wrapper ui-right"
      :class="[{
        pined: itemPathChip.pined.value,
      }]"
      :is-pined="itemPathChip.pined.value"
      :icon-position="Position.topLeft"
      :show-icon="shouldShowUI"
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
      <TheTagger
        :show="taggerModal.show.value"
        :selected="itemTags"
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

  .ui-left, .ui-right, .ui-top, .ui-bottom {
    transition: transform 0.3s ease;
    position: absolute;
    z-index: 1000;
  }
  .ui-left {
    transform: translateX(-150%);
    left: 5px;
  }
  .ui-right {
    transform: translateX(150%);
    right: 5px;
  }
  .ui-top {
    transform: translateY(-150%);
  }
  .ui-bottom {
    transform: translateY(150%);
  }
  &.show-ui {
    cursor: default;

    .ui-left, .ui-right {
      transform: translateX(0);
    }

    .ui-top, .ui-bottom {
      transform: translateY(0);
    }
  }

  &.show-ui {
    &.video-item {
      .the-item-path-chip-pin-wrapper {
        bottom: 70px; // To not cover the video controls.
      }
    }

    .the-item-path-chip-pin-wrapper {
      bottom: 25px; // To not cover the video controls.
    }
  }

  .the-pined-chip-pin-wrapper {
    top: 15px;
    right: 60px;

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
    background-color: #{$grey-7 + '30'};

    .pause-icon {
      display: flex;
      justify-content: center;
      align-items: center;

      .stick {
        width: 5px;
        height: 16px;
        margin: auto 1px;
        background: #{$grey-0 + 'EE'};
        border: 1px solid #{$grey-7 + 'EE'};
      }
    }
  }

  .the-close-active-player-btn {
    left: calc(50% - 33px);
  }

  .the-history-btn {
    top: calc(50% - 66px);

    .history-count-badge {
      font-size: 11px;
      position: absolute;
      bottom: 2px;
    }
  }

  .the-settings-btn {
    top: calc(50% - 11px);
  }

  .alert-footer {
    margin-top: 20px;
    display: flex;
    justify-content: end;
    column-gap: 5px;
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
    top: 5px;

    &.pined {
      transform: none;
    }
  }

  .the-items-info-chip-pin-wrapper {
    top: 5px;

    &.pined {
      transform: none;
    }
  }

  .the-tags-list-pin-wrapper {
    top: 55px;

    &.pined {
      transform: none;
    }

    .the-tags-list {
      cursor: pointer;
    }
  }

  .the-item-path-chip-pin-wrapper {
    bottom: 10px;

    &.pined {
      transform: none;
    }
  }

  .the-items-player {
    position: relative;
  }
}
</style>
