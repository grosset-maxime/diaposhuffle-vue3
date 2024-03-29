import { BASE_URL, fetchJson } from '@/api/api'
import { createCustomError } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

/**
 * Get folders name of a parent folder from the fs.
 * @param options - Options.
 * @param path - Parent folder path (default is the root).
 * @returns List of folders names (NOT PATHES).
 */
export async function getFolders ({ path }: { path?: string } = {}): Promise<string[]> {
  try {
    const url = `${BASE_URL}/api/getFolderList`
    const opts = {
      method: 'POST',
      body: JSON.stringify({
        folder: path,
      }),
    }

    const json: {
      folderList: Array<string>;
    } = await fetchJson(url, opts)

    return json.folderList
  } catch (e) {
    throw logError(createCustomError(e, {
      file: 'api/folders.ts',
      actionName: 'getFolders',
      isBackend: true,
    }))
  }
}
