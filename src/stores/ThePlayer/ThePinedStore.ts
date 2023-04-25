// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useThePinedStore = createGlobalState(() => {
  const items = ref<Array<Item>>([])

  return {
    items,
  }
})
