<script setup lang="ts">
// TODO: Feature: Add a component to create custom tags operator (aaa AND bbb OR ccc)
// TODO: Feature: Add a filter by: image or video types. DONE ?
// TODO: Enh: dispable tag operator chip if only one tag is selected.

// Vendors Libs
import { ref, computed } from 'vue';

// Stores
import { useSourceOptionsStore } from '@/stores/playerOptions/sourceOptions';
import { usePlayerStore } from '@/stores/player';

// Components
import FolderBrowser from '../FolderBrowser/FolderBrowser.vue';
import TaggerModal from '../Tagger/TaggerModal.vue';
import TagChip from '../TagChip.vue';

const sourceOptsStore = useSourceOptionsStore();
const playerStore = usePlayerStore();

const emit = defineEmits<{
  (e: 'showFolderBrowser'): void;
  (e: 'hideFolderBrowser'): void;
  (e: 'showTaggerModal'): void;
  (e: 'hideTaggerModal'): void;
}>();

// Refs
const folderBrowser = ref({ show: false, selected: [] as Array<string> });
const taggerModal = ref({ show: false, selectedTagIds: [] as Array<string> });

// Computeds
const filterFileTypes = computed({
  get() {
    return sourceOptsStore
      .getFileTypes()
      .map((type) => sourceOptsStore.getAvailableFileTypes().indexOf(type));
  },
  set(typesIndex) {
    const fileTypes = typesIndex.map((index) => sourceOptsStore.getAvailableFileTypes()[index]);
    sourceOptsStore.setFileTypes(fileTypes);
  },
});

const nbSelectedFolders = computed(() => {
  return folderBrowser.value.selected.length;
});

const nbSelectedTags = computed(() => {
  return taggerModal.value.selectedTagIds.length;
});

const isFromPinedComputed = computed({
  get() {
    return sourceOptsStore.isFromPined();
  },
  set(isFromPined) {
    sourceOptsStore.setIsFromPined(isFromPined);
  },
});

const pinedsLength = computed(() => {
  return playerStore.getPinedLength();
});

// Mehods
function showFolderBrowser() {
  emit('showFolderBrowser');
  folderBrowser.value.show = true;
}

function onCloseFolderBrowser() {
  emit('hideFolderBrowser');
  folderBrowser.value.show = false;
}

function onSaveFolderBrowser(selectedFolders: Array<string>) {
  folderBrowser.value.selected = selectedFolders;
  setFolders(selectedFolders);
}

function onUnselectAllFolders() {
  folderBrowser.value.selected = [];
  setFolders([]);
}

function onUnselectFolder(path: string) {
  folderBrowser.value.selected = folderBrowser.value.selected.filter((p) => p !== path);
  setFolders(folderBrowser.value.selected);
}

function setFolders(selectedFolders: Array<string>) {
  const folders = [...selectedFolders];
  sourceOptsStore.setFolders(folders);
}

function showTaggerModal() {
  emit('showTaggerModal');
  taggerModal.value.show = true;
}

function onCloseTaggerModal() {
  taggerModal.value.show = false;
  emit('hideTaggerModal');
}

function onSaveTaggerModal(selectedTagIds: Array<string>) {
  taggerModal.value.selectedTagIds = selectedTagIds;
  sourceOptsStore.setTags(selectedTagIds);
}

function onUnselectAllTags() {
  taggerModal.value.selectedTagIds = [];
  sourceOptsStore.setTags([]);
}

function onUnselectTag(tagId: string) {
  taggerModal.value.selectedTagIds = taggerModal.value.selectedTagIds.filter((id) => id !== tagId);
  sourceOptsStore.setTags(taggerModal.value.selectedTagIds);
}

function clearPineds() {
  isFromPinedComputed.value = false;
  playerStore.clearPineds();
}
</script>

<template>
  <v-container class="source-options">
    <v-row align="center">
      <v-col>
        <span class="v-label theme--dark"> Folder(s) </span>

        <v-btn class="secondary" @click="showFolderBrowser"> Browse... </v-btn>

        <v-btn
          v-if="nbSelectedFolders"
          class="secondary unselect-all-folders-btn"
          @click="onUnselectAllFolders"
        >
          Unselect All
        </v-btn>

        <span class="v-label theme--dark nb-selected-folders" v-if="nbSelectedFolders">
          Selected: {{ nbSelectedFolders }}
        </span>
      </v-col>
    </v-row>

    <v-row align="center" v-if="nbSelectedFolders">
      <v-col>
        <v-chip
          v-for="path in folderBrowser.selected"
          :key="path"
          class="mr-3 mt-0 mb-2"
          outlined
          close
          color="blue"
          @click:close="onUnselectFolder(path)"
        >
          {{ path }}
        </v-chip>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <span class="v-label theme--dark"> Tag(s) </span>

        <v-btn class="secondary" @click="showTaggerModal"> Select... </v-btn>

        <v-chip
          v-if="nbSelectedTags"
          class="tags-operator-chip ml-5 mr-5 mt-0 mb-0"
          outlined
          color="orange"
          filter
          @click="sourceOptsStore.toggleTagsOperator()"
        >
          {{ sourceOptsStore.getTagsOperator() }}
        </v-chip>

        <v-btn
          v-if="nbSelectedTags"
          class="secondary unselect-all-tags-btn"
          @click="onUnselectAllTags"
        >
          Unselect All
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="taggerModal.selectedTagIds.length" align="center" class="selected-tags">
      <v-col>
        <TagChip
          v-for="tagId in taggerModal.selectedTagIds"
          :key="tagId"
          :tag-id="tagId"
          close
          @click:close="onUnselectTag"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="flex-col">
        <span class="v-label theme--dark"> Type(s) </span>
        <span>
          <v-chip-group v-model="filterFileTypes" multiple>
            <v-chip
              v-for="(type, i) in sourceOptsStore.getAvailableFileTypes()"
              :key="type"
              class="mr-3 mt-0 mb-0"
              outlined
              :color="filterFileTypes.includes(i) ? 'orange' : undefined"
              filter
            >
              {{ type }}
            </v-chip>
          </v-chip-group>
        </span>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="pineds-col">
        <v-switch
          class="ma-0 pa-0"
          v-model="isFromPinedComputed"
          :label="`Pined items - ${pinedsLength}`"
          :disabled="!pinedsLength"
          hide-details
          inset
        />
        <v-btn
          :class="[
            'ml-2',
            {
              'clear-pineds-hide': !pinedsLength,
            },
          ]"
          :disabled="!pinedsLength"
          icon
          @click="clearPineds"
        >
          <v-icon>mdi-close-circle-outline</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <FolderBrowser
      :show="folderBrowser.show"
      :selected="folderBrowser.selected"
      @close="onCloseFolderBrowser"
      @save="onSaveFolderBrowser"
    />

    <TaggerModal
      :show="taggerModal.show"
      :selected-tag-ids="taggerModal.selectedTagIds"
      @close="onCloseTaggerModal"
      @save="onSaveTaggerModal"
    />
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
  }

  .clear-pineds-hide {
    opacity: 0;
  }

  .v-label {
    margin-right: 20px;
  }
}
</style>
