import { useTheTaggerStore } from '@/stores/TheTaggerStore'
import { logError } from '@/utils/errorUtils'
import { createCustomError, CustomError, type CustomErrorData } from './customError'

export type TagCategoryId = string;

export type TagCategoryData = {
  id: TagCategoryId
  name?: string
  color?: string
};

function onError (error: any, errorData: CustomErrorData): CustomError {
  return logError(
    createCustomError(error, {
      file: 'models/tag.ts',
      isBackend: false,
      ...errorData,
    }),
  )
}

export class TagCategory {
  // Data
  readonly id: TagCategoryId
  readonly name: string
  readonly color: string

  readonly hashColor: string
  tags: Map<TagId, Tag>

  constructor ({ id = '', name, color = '' }: TagCategoryData) {
    // Data
    this.id = id
    this.name = name || this.id
    this.color = color

    this.hashColor = `#${this.color}`

    this.tags = new Map()
  }

  isNone () { return this.id === '0' }

  getData (): TagCategoryData {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
    }
  }

  update () {
    const theTaggerStore = useTheTaggerStore()

    this.tags = new Map(
      theTaggerStore.tagsList.value.filter((t) => t.categoryId === this.id)
        .map((t) => [ t.id, t ]),
    )
  }
}

export function createTagCategory (data: TagCategoryData) {
  return new TagCategory(data)
}

export type TagId = string;

export type TagData = {
  id: TagId;
  name?: string;
  categoryId?: TagCategoryId;
};

export class Tag {
  // Data
  readonly id: TagId
  readonly name: string
  readonly categoryId: TagCategoryId

  category: TagCategory | undefined
  lastUsed: number

  constructor ({ id, name, categoryId = '0' }: TagData) {
    if (!id) {
      throw onError(`Invalid tag, tag has no id: ${id}`, {
        actionName: 'Tag#Constructor',
      })
    }

    // Data
    this.id = id
    this.name = name || id
    this.categoryId = categoryId

    this.category = undefined
    this.lastUsed = 0
  }

  hasCategory () {
    return !!this.category
  }

  getData (): TagData {
    return {
      id: this.id,
      name: this.name,
      categoryId: this.categoryId,
    }
  }

  update () {
    const theTaggerStore = useTheTaggerStore()
    this.category = theTaggerStore.getCategory(this.categoryId)
  }
}

export function createTag (data: TagData) {
  return new Tag(data)
}
