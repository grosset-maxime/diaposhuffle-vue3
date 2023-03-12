// Types
import type { TagId } from '@/models/tag';

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

const VIDEO_EXTENSIONS = [ItemVideoExt.webm, ItemVideoExt.mp4, ItemVideoExt.mkv];

const IMG_EXTENSIONS = [
  ItemImgExt.jpeg,
  ItemImgExt.jpg,
  ItemImgExt.png,
  ItemImgExt.gif,
  ItemImgExt.bmp,
  ItemImgExt.tiff,
];

function getComputedPath(src: string) {
  const computedPath = src.split('/');
  computedPath.shift();
  computedPath.pop();

  return computedPath.join('/');
}

export interface ItemConstructor {
  src: string;
  name?: string;
  extension?: ItemExtension;
  path?: string;
  width?: number;
  height?: number;
  randomPublicPath?: string;
  customFolderPath?: string;
  tags?: Array<TagId>;
  warning?: string;
  useCache?: boolean;
  isImage?: boolean;
  isVideo?: boolean;
}

export class Item {
  src: string;
  name: string;
  extension: ItemExtension;
  path: string;
  width: number;
  height: number;
  customFolderPath: string;
  randomPublicPath: string;
  tags: Array<TagId>;
  isImage: boolean;
  isVideo: boolean;

  warning?: string;
  useCache?: boolean;

  constructor({
    src = '',
    name = '',
    path,
    extension,
    width = 0,
    height = 0,
    customFolderPath = '',
    randomPublicPath,
    tags = [],
    warning = '',
    useCache = false,
    isImage = false,
    isVideo = false,
  }: ItemConstructor) {
    if (!src) {
      throw new Error(`Invalid item, item has no src. Item src: ${src}`);
    }

    const splitedSrc = src.split('/').filter((p) => p);

    this.src = splitedSrc.join('/');
    this.name = name || [...splitedSrc].pop() || '';
    this.extension = (extension || this.name.split('.').pop() || '').toLowerCase() as ItemExtension;
    this.path = path ?? getComputedPath(this.src);

    this.width = width;
    this.height = height;

    this.customFolderPath = customFolderPath;
    this.randomPublicPath = randomPublicPath ?? this.path;

    this.tags = tags;

    this.warning = warning;
    this.useCache = useCache;

    this.isImage = isImage ?? IMG_EXTENSIONS.includes(this.extension as ItemImgExt);
    this.isVideo = isVideo ?? VIDEO_EXTENSIONS.includes(this.extension as ItemVideoExt);

    if (!this.isImage && !this.isVideo) {
      // eslint-disable-next-line no-console
      console.error('Item:', this);
      throw new Error(`Invalid item, not an image and not a video. Item extension: ${extension}`);
    }
  }
}

export function createItem(data: ItemConstructor) {
  return new Item(data);
}
