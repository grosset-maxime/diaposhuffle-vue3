export type TagCategoryId = string;

export type TagCategoryConstructor = {
  id?: TagCategoryId;
  name: string;
  color?: string;
};

export class TagCategory {
  id: TagCategoryId;
  name: string;
  color: string;

  constructor({ id = '', name, color = '' }: TagCategoryConstructor) {
    this.id = id;
    this.name = name;
    this.color = color;
  }

  setId(id: TagCategoryId) {
    this.id = id;
  }
}

export function createTagCategory(data: TagCategoryConstructor) {
  return new TagCategory(data);
}

export type TagId = string;

export type TagConstructor = {
  id: TagId;
  name?: string;
  categoryId?: TagCategoryId;
};

export class Tag {
  id: TagId;
  name: string;
  categoryId: TagCategoryId;

  constructor({ id, name, categoryId = '0' }: TagConstructor) {
    if (!id) {
      throw new Error(`Invalid tag, tag has no id: ${id}`);
    }

    this.id = id;
    this.name = name || id;
    this.categoryId = categoryId;
  }

  hasCategory() {
    return this.categoryId !== '0';
  }
}

export function createTag(data: TagConstructor) {
  return new Tag(data);
}
