// Types
import type { Fn } from '@vueuse/core'

// Vendors Libs
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'

// Libs
import { getKey } from '@/utils/utils'

export const useKeyboardShortcutsListener = (
  shortcuts: (key: string, e: KeyboardEvent) => void,
) => {
  let removeListener: Fn | null

  function onKeyDown (e: KeyboardEvent) {
    shortcuts(getKey(e), e)
  }

  function startListener () {
    if (removeListener) {
      return
    }
    removeListener = useEventListener(document, 'keydown', onKeyDown)
  }

  function stopListener () {
    removeListener && removeListener()
    removeListener = null
  }

  onMounted(() => startListener())

  return {
    startListener,
    stopListener,
  }
}
