/* eslint-disable max-len */
import type { InjectionKey } from 'vue'
import type { TheFolderBrowserProvide } from '@/interfaces/components/TheFolderBrowser'
import type { ThePlayerProvide } from './components/ThePlayer'

export const theFolderBrowserKey: InjectionKey<TheFolderBrowserProvide> = Symbol('TheFolderBrowserProvide')

export const thePlayerKey: InjectionKey<ThePlayerProvide> = Symbol('ThePlayerProvide')