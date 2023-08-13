import type { ComputedRef, Ref } from 'vue'
import type { TagId, Tag } from '@/models/tag'

import { SHAKE_ANIMATION_TIME } from '@/utils/utils'
import type { ReactiveMap } from '../useReactiveMap'

export enum TagsSection {
  selected = 'selectedTags',
  unselected = 'unSelectedTags',
  lastUsedTags = 'lastUsedTags'
}
export interface TagFocused {
  id: TagId | undefined
  pos: number
  section: TagsSection
}

export const useTagFocus = (
  tagFocused: TagFocused,
  shakeSections: ComputedRef<ReactiveMap<TagsSection, boolean>>,
  selectedTagsMap: Ref<Map<TagId, Tag>>,
  lastUsedTagsMap: Ref<Map<TagId, Tag>>,
  unselectedTagsMap: Ref<Map<TagId, Tag>>,
) => {

  const sectionsNames: Array<TagsSection> = [
    TagsSection.selected,
    TagsSection.lastUsedTags,
    TagsSection.unselected,
  ]

  function shakeSectionName (name: TagsSection): void {
    shakeSections.value.set(name, true)

    setTimeout(() => {
      shakeSections.value.set(name, false)
    }, SHAKE_ANIMATION_TIME)
  }

  function getTagIdsFromSectionName (name: TagsSection): Array<TagId> {
    let tagsIds: Array<TagId> = []

    if (name === TagsSection.unselected) {
      tagsIds = Array.from(unselectedTagsMap.value.keys())
    } else if (name === TagsSection.selected) {
      tagsIds = Array.from(selectedTagsMap.value.keys())
    } else if (name === TagsSection.lastUsedTags) {
      tagsIds = Array.from(lastUsedTagsMap.value.keys())
    }
    return tagsIds
  }

  function getUpperSectionFrom (name: TagsSection): TagsSection | undefined {
    let upperSectionName: TagsSection | undefined
    let sectionTagIds
    let index = 0
    const indexSectionFrom = sectionsNames.indexOf(name)

    for (let i = 1; i <= sectionsNames.length; i += 1) {
      index = indexSectionFrom - i

      if (index < 0) {
        index = sectionsNames.length + indexSectionFrom - i
      }

      upperSectionName = sectionsNames[ index ]
      sectionTagIds = getTagIdsFromSectionName(upperSectionName)

      if (sectionTagIds.length) {
        break
      }
    }

    return upperSectionName
  }

  function getDownerSectionFrom (name: TagsSection): TagsSection | undefined {
    let downerSectionName: TagsSection | undefined
    let sectionTagIds
    let index = 0
    const indexSectionFrom = sectionsNames.indexOf(name)

    for (let i = 1; i <= sectionsNames.length; i += 1) {
      index = indexSectionFrom + i

      if (index >= sectionsNames.length) {
        index = indexSectionFrom + i - sectionsNames.length
      }

      downerSectionName = sectionsNames[ index ]
      sectionTagIds = getTagIdsFromSectionName(downerSectionName)

      if (sectionTagIds.length) {
        break
      }
    }

    return downerSectionName
  }

  function setFocusRight (): void {
    const sectionName = tagFocused.section
    const sectionTagIds = getTagIdsFromSectionName(sectionName)

    tagFocused.pos += 1
    if (tagFocused.pos >= sectionTagIds.length) {
      tagFocused.pos = 0
    }
    tagFocused.id = sectionTagIds[ tagFocused.pos ]
  }

  function setFocusLeft (): void {
    const sectionName = tagFocused.section
    const sectionTagIds = getTagIdsFromSectionName(sectionName)

    tagFocused.pos -= 1
    if (tagFocused.pos < 0) {
      tagFocused.pos = sectionTagIds.length - 1
    }
    tagFocused.id = sectionTagIds[ tagFocused.pos ]
  }

  function setFocusUp (): void {
    const sectionName = tagFocused.section
    let upperSectionName = getUpperSectionFrom(sectionName)

    if (!upperSectionName) {
      upperSectionName = TagsSection.unselected
    }

    if (sectionName !== upperSectionName) {
      tagFocused.section = upperSectionName
      resetFocus()
    } else {
      shakeSectionName(sectionName)
    }
  }

  function setFocusDown (): void {
    const sectionName = tagFocused.section
    let downerSectionName = getDownerSectionFrom(sectionName)

    if (!downerSectionName) {
      downerSectionName = TagsSection.unselected
    }

    if (sectionName !== downerSectionName) {
      tagFocused.section = downerSectionName
      resetFocus()
    } else {
      shakeSectionName(sectionName)
    }
  }

  function resetFocus (tagsSection: TagsSection = tagFocused.section): void {
    const sectionName = tagsSection
    const sectionTagIds = getTagIdsFromSectionName(sectionName);
    [ tagFocused.id ] = sectionTagIds

    tagFocused.pos = 0
    if (tagFocused.section !== sectionName) tagFocused.section = sectionName
  }

  return {
    setFocusRight,
    setFocusLeft,
    setFocusDown,
    setFocusUp,
    resetFocus,
  }
}
