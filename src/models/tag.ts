import { computed, type ComputedRef } from 'vue'
import { useTaggerStore } from '@/stores/tagger'

export type TagCategoryId = string;

export type TagCategoryData = {
  id: TagCategoryId;
  name?: string;
  color?: string;
};

export class TagCategory {
  // Data
  readonly id: TagCategoryId
  readonly name: string
  readonly color: string

  readonly hashColor: string
  readonly tags: ComputedRef<Map<TagId, Tag>>

  constructor ({ id = '', name, color = '' }: TagCategoryData) {
    const taggerStore = useTaggerStore()

    // Data
    this.id = id
    this.name = name || this.id
    this.color = color

    this.hashColor = `#${this.color}`

    this.tags = computed(
      () => new Map(
        taggerStore.tagsList.value.filter((t) => t.categoryId === this.id)
          .map((t) => [ t.id, t ]),
      ),
    )
  }

  isNone () { return this.id === '0' }

  getData (): TagCategoryData {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
    }
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

  readonly category: ComputedRef<TagCategory | undefined>

  constructor ({ id, name, categoryId = '0' }: TagData) {
    const taggerStore = useTaggerStore()

    if (!id) {
      throw new Error(`Invalid tag, tag has no id: ${id}`)
    }

    // Data
    this.id = id
    this.name = name || id
    this.categoryId = categoryId

    this.category = computed(() => taggerStore.getCategory(this.categoryId))
  }

  hasCategory () {
    return !!this.category.value
  }

  getData (): TagData {
    return {
      id: this.id,
      name: this.name,
      categoryId: this.categoryId,
    }
  }
}

export function createTag (data: TagData) {
  return new Tag(data)
}
