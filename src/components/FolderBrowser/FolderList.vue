<script setup lang="ts">
// Types
import type { Ref, VNode } from 'vue';
import type { Folder } from '@/stores/folderBrowser';

// Vendors Libs
import { h, useSlots } from 'vue';

// Stores
import { useFolderBrowserStore } from '@/stores/folderBrowser';

// Components
import FolderCtn from '@/components/FolderBrowser/FolderCtn.vue';
import LoadingCmp from '@/components/LoadingCmp.vue';

// TODO
const slots = useSlots();
// const attrs = useAttrs()

const folderBrowserStore = useFolderBrowserStore();

// Props
interface Props {
  selected?: Array<string>;
}
const props = withDefaults(defineProps<Props>(), {
  selected: (): Array<string> => [],
});

// Emits
const emit = defineEmits<{
  (e: 'select', path: string): void;
  (e: 'unselect', path: string): void;
}>();

// Computeds
const rootFolder = folderBrowserStore.getRootFolder();

function onShow() {
  fetchFolder();
}

function fetchFolder(path?: string) {
  folderBrowserStore.fetchFolders(path);
}

// TODO
function render() {
  const buildFolder = (folder: Ref<Folder>, level: number): VNode =>
    h(
      FolderCtn,
      {
        props: {
          folder,
          selected: props.selected.includes(folder.value.path),
        },
        on: {
          expand: (path: string) => {
            fetchFolder(path);
          },
          select: (path: string) => {
            emit('select', path);
          },
          unselect: (path: string) => {
            emit('unselect', path);
          },
        },
        slot: 'sub-folders',
      },
      folder.value.children.map((f) => buildFolder(f, level + 1))
    );

  const isRootHasFolders = (rootFolder.value.children || []).length;
  const isRootFetched = rootFolder.value.fetched;

  let elements = [];

  if (!isRootFetched) {
    elements = [h(LoadingCmp)];
  } else if (!isRootHasFolders) {
    elements = [h('div', { class: 'no-folders' }, 'No Folders')];
  } else {
    elements = rootFolder.value.children.map((folder) => buildFolder(folder, 0));
  }

  // TODO
  return h('div', { class: 'folder-list' }, elements, slots?.default());
}

// TODO
// return render();
</script>

<style lang="scss" scoped>
$folder-padding-left: 5px;

.folder-list {
  height: 100%;

  .expand-btn {
    padding: 0 12px;
    margin-right: 10px;

    &.expanded {
      .plus-icon {
        display: none;
      }
      .minus-icon {
        display: block;
      }
    }

    &.no-sub-folders {
      .plus-icon,
      .minus-icon {
        display: none;
      }
    }

    .plus-icon {
      display: block;
    }
    .minus-icon {
      display: none;
    }
  }

  .folder {
    padding-left: $folder-padding-left;
    display: flex;
    align-items: center;
    height: 40px;

    &:hover {
      background-color: $grey-7;
    }

    .name {
      cursor: pointer;
    }
  }

  .sub-folders-ctn {
    padding-left: 12px;
    margin-left: #{12px + $folder-padding-left};
    border-left: 1px dashed $grey-6;

    &.hide {
      display: none;
    }
  }

  .no-folders {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3em;
  }
}
</style>
