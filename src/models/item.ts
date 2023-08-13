// Types
import type { TagId } from '@/models/tag'
import { logError } from '@/utils/errorUtils'
import { createCustomError, CustomError, type CustomErrorData } from './customError'

export enum ItemVideoExt {
  webm = 'webm',
  mp4 = 'mp4',
  mkv = 'mkv',
}

export enum ItemImgExt {
  jpeg = 'jpeg',
  jpg = 'jpg',
  png = 'png',
  gif = 'gif',
  bmp = 'bmp',
  tiff = 'tiff',
}

export type ItemExtension = ItemImgExt | ItemVideoExt;

const VIDEO_EXTENSIONS = [ ItemVideoExt.webm, ItemVideoExt.mp4, ItemVideoExt.mkv ]

const IMG_EXTENSIONS = [
  ItemImgExt.jpeg,
  ItemImgExt.jpg,
  ItemImgExt.png,
  ItemImgExt.gif,
  ItemImgExt.bmp,
  ItemImgExt.tiff,
]

function getComputedPath (src: string) {
  const computedPath = src.split('/')
  computedPath.shift()
  computedPath.pop()

  return computedPath.join('/')
}

function onError (error: any, errorData: CustomErrorData): CustomError {
  return logError(
    createCustomError(error, {
      file: 'models/item.ts',
      isBackend: false,
      ...errorData,
    }),
  )
}

export interface ItemData {
  src: string;
  name?: string;
  extension?: ItemExtension;
  path?: string;
  width?: number;
  height?: number;
  randomPublicPath?: string;
  customFolderPath?: string;
  tags?: Set<TagId> | Array<TagId>;
  warning?: string;
  useCache?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
}

export class Item {
  src: string
  name: string
  extension: ItemExtension
  path: string
  width: number
  height: number
  customFolderPath: string
  randomPublicPath: string
  tags: Set<TagId>
  isImage: boolean
  isVideo: boolean

  warning?: string
  useCache?: boolean

  constructor ({
    src = '',
    name = '',
    path,
    extension,
    width = 0,
    height = 0,
    customFolderPath = '',
    randomPublicPath,
    tags = new Set(),
    warning = '',
    useCache = false,
    isImage,
    isVideo,
  }: ItemData) {
    if (!src) {
      throw onError('Invalid item, item has no src.', {
        actionName: 'Item#Constructor',
      })
    }

    const splitedSrc = src.split('/').filter((p) => p)

    this.src = splitedSrc.join('/')
    this.name = name || [ ...splitedSrc ].pop() || ''
    this.extension = (extension || this.name.split('.').pop() || '').toLowerCase() as ItemExtension
    this.path = path ?? getComputedPath(this.src)

    this.width = width
    this.height = height

    this.customFolderPath = customFolderPath
    this.randomPublicPath = randomPublicPath ?? this.path

    this.tags = new Set(tags)

    this.warning = warning
    this.useCache = useCache

    this.isImage = isImage ?? IMG_EXTENSIONS.includes(this.extension as ItemImgExt)
    this.isVideo = isVideo ?? VIDEO_EXTENSIONS.includes(this.extension as ItemVideoExt)

    if (!this.isImage && !this.isVideo) {
      const errorMsg = `Invalid item, not an image and not a video. Item extension: ${extension}`
      console.error('###', errorMsg, this)
      throw onError(errorMsg, {
        actionName: 'Item#Constructor',
      })
    }
  }
}

export function createItem (itemData: ItemData) {
  return new Item(itemData)
}
