import { BASE_URL, fetchJson } from '@/api/api'
import { createErrorAlert } from '@/models/Alerts/errorAlert'

/**
 * Get folders name of a parent folder from the fs.
 * @param options - Options.
 * @param path - Parent folder path (default is the root).
 * @returns List of folders names (NOT PATHES).
 */
export const getFolders = async ({ path }: { path?: string } = {}) => {
  let folders: Array<string> = []

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

    folders = json.folderList
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'folders.ts',
    })
  }

  return folders
}
