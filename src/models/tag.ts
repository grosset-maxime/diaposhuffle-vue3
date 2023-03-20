export type TagCategoryId = string;

export type TagCategoryData = {
  id?: TagCategoryId;
  name: string;
  color?: string;
};

export class TagCategory {
  id: TagCategoryId
  name: string
  color: string

  constructor ({ id = '', name, color = '' }: TagCategoryData) {
    this.id = id
    this.name = name
    this.color = color
  }

  setId (id: TagCategoryId) {
    this.id = id
  }

  getData () {
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
  id: TagId
  name: string
  categoryId: TagCategoryId

  constructor ({ id, name, categoryId = '0' }: TagData) {
    if (!id) {
      throw new Error(`Invalid tag, tag has no id: ${id}`)
    }

    this.id = id
    this.name = name || id
    this.categoryId = categoryId
  }

  hasCategory () {
    return this.categoryId !== '0'
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
