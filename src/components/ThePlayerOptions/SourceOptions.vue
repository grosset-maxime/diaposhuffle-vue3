<script setup lang="ts">
// TODO: Feature: Add a component to create custom tags operator (aaa AND bbb OR ccc)
// TODO: Feature: Add a filter by: image or video types (subset: all image types or all video types)
// TODO: Enh: disable tag operator chip if only one tag is selected.

// Types
import type { TagId } from '@/models/tag'
import type { FolderPath } from '@/stores/TheFolderBrowserStore'

// Vendors Libs
import { computed, ref, watch } from 'vue'
import { eagerComputed } from '@vueuse/shared'

// Stores
import { useDiapoShuffleStore } from '@/stores/diapoShuffleStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptionsStore'

// Components
import TheFolderBrowser from '@/components/TheFolderBrowser/TheFolderBrowser.vue'
import TheTagger from '@/components/TheTagger/TheTagger.vue'
import TagChip from '@/components/TagChip.vue'
import { usePinedPlayerStore } from '@/stores/ThePlayer/players/pinedPlayerStore'

const { showTheTagger, showTheFolderBrowser } = useDiapoShuffleStore()
const sourceOptsStore = useSourceOptionsStore()
const pinedPlayerStore = usePinedPlayerStore()

//#region Folder Browser
const selectedFolders = ref<Set<FolderPath>>(new Set(sourceOptsStore.folders.value))
const nbSelectedFolders = eagerComputed(() => selectedFolders.value.size)

watch(
  selectedFolders,
  () => (sourceOptsStore.folders.value = selectedFolders.value),
)

function showTheFolderBrowserFn () {
  showTheFolderBrowser.value = true
}

function onCloseTheFolderBrowser () {
  showTheFolderBrowser.value = false
}

function onSaveTheFolderBrowser (folders: Set<FolderPath>) {
  selectedFolders.value = folders
}

function onUnselectAllFolders () {
  selectedFolders.value = new Set()
}

function onUnselectFolder (path: FolderPath) {
  const newSet = new Set(selectedFolders.value)
  newSet.delete(path)
  selectedFolders.value = newSet
}
//#endregion Folder Browser

//#region Tagger
const selectedTags = ref<Set<TagId>>(new Set(sourceOptsStore.tags.value))
const nbSelectedTags = computed(() => selectedTags.value.size)

watch(
  selectedTags,
  (val) => { sourceOptsStore.tags.value = val },
)

function showTheTaggerFn () {
  showTheTagger.value = true
}

function onCloseTaggerModal () {
  showTheTagger.value = false
}

function onSaveTaggerModal (selectedTagIds: Set<TagId>) {
  selectedTags.value = selectedTagIds
}

function onUnselectAllTags () {
  selectedTags.value = new Set()
}

function onUnselectTag (tagId: TagId) {
  const newSet = new Set(selectedTags.value)
  newSet.delete(tagId)
  selectedTags.value = newSet
}
//#endregion Tagger

//#region Types
const filterFileTypes = computed({
  get () {
    return sourceOptsStore.fileTypes.value.map((type) =>
      sourceOptsStore.availableFileTypes.value.indexOf(type),
    )
  },
  set (typesIndex) {
    const fileTypes = typesIndex.map((index) => sourceOptsStore.availableFileTypes.value[ index ])
    sourceOptsStore.setFileTypes(fileTypes)
  },
})
//#endregion Types

//#region Pineds
const isFromPinedComputed = computed({
  get () {
    return sourceOptsStore.isFromPined.value
  },
  set (isFromPined) {
    sourceOptsStore.isFromPined.value = isFromPined
  },
})

const pinedsLength = eagerComputed<number>(
  () => pinedPlayerStore.items.value.length,
)

function clearPineds () {
  isFromPinedComputed.value = false
  pinedPlayerStore.reset()
}
//#endregion Pineds
</script>

<template>
  <v-container class="source-options">
    <v-row align="center">
      <v-col>
        <span class="v-label"> Folder(s) </span>

        <v-btn color="secondary" @click="showTheFolderBrowserFn"> Browse... </v-btn>

        <v-btn
          v-if="nbSelectedFolders"
          color="secondary"
          class="unselect-all-folders-btn"
          @click="onUnselectAllFolders"
        >
          Unselect All
        </v-btn>

        <span class="v-label nb-selected-folders" v-if="nbSelectedFolders">
          Selected: {{ nbSelectedFolders }}
        </span>
      </v-col>
    </v-row>

    <v-row align="center" v-if="nbSelectedFolders">
      <v-col>
        <v-chip
          v-for="path in selectedFolders"
          :key="path"
          class="mr-3 mt-0 mb-2"
          variant="outlined"
          closable
          color="blue"
          @click:close="() => onUnselectFolder(path)"
        >
          {{ path }}
        </v-chip>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <hr class="source-separator"/>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <span class="v-label"> Tag(s) </span>

        <v-btn color="secondary" @click="showTheTaggerFn"> Select... </v-btn>

        <v-chip
          v-if="nbSelectedTags"
          class="tags-operator-chip ml-5 mr-5 mt-0 mb-0"
          color="primary"
          @click="sourceOptsStore.toggleTagsOperator()"
        >
          {{ sourceOptsStore.tagsOperator.value }}
        </v-chip>

        <v-btn
          v-if="nbSelectedTags"
          color="secondary"
          class="unselect-all-tags-btn"
          @click="onUnselectAllTags"
        >
          Unselect All
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="nbSelectedTags" align="center" class="selected-tags">
      <v-col>
        <TagChip
          v-for="tagId in selectedTags"
          :key="tagId"
          :tag-id="tagId"
          close
          @click:close="() => onUnselectTag(tagId)"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <hr class="source-separator"/>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="d-flex">
        <div class="v-label"> Type(s) : </div>
        <div>
          <v-chip-group v-model="filterFileTypes" multiple>
            <v-chip
              v-for="(type, i) in sourceOptsStore.availableFileTypes.value"
              :key="type"
              class="mr-3 mt-0 mb-0"
              variant="outlined"
              :color="filterFileTypes.includes(i) ? 'primary' : undefined"
              filter
            >
              {{ type }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <hr class="source-separator"/>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="pineds-col">
        <v-switch
          class="pineds-switch ma-0 pa-0"
          v-model="isFromPinedComputed"
          :disabled="!pinedsLength"
          color="primary"
          hide-details
          inset
        />
        <label class="pined-label v-label" @click="isFromPinedComputed = !isFromPinedComputed">
          Pined items - {{ pinedsLength }}
        </label>
        <v-btn
          :class="[{
            'clear-pineds-hide': !pinedsLength,
          }]"
          :disabled="!pinedsLength"
          icon
          @click="clearPineds"
        >
          <v-icon>mdi-close-circle-outline</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <Teleport to="body">
      <TheFolderBrowser
        :show="showTheFolderBrowser"
        :selected="selectedFolders"
        @close="onCloseTheFolderBrowser"
        @save="onSaveTheFolderBrowser"
      />

      <TheTagger
        :show="showTheTagger"
        :selected="selectedTags"
        @close="onCloseTaggerModal"
        @save="onSaveTaggerModal"
      />
    </Teleport>
  </v-container>
</template>

<style lang="scss" scoped>
.source-options {
  .unselect-all-folders-btn {
    text-transform: none;
    margin-left: 60px;
  }

  .unselect-all-tags-btn {
    text-transform: none;
  }

  .nb-selected-folders {
    margin-left: 20px;
  }

  .pineds-col {
    display: flex;
    align-items: center;

    .pineds-switch {
      max-width: 70px;
    }
  }

  .clear-pineds-hide {
    opacity: 0;
  }

  .v-label {
    margin-right: 20px;
  }
}
.source-separator {
  width: 70%;
  border-color: $grey-8;
  border-style: solid;
  margin: auto;
}
</style>
