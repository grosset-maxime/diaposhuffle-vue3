import type { InjectionKey } from 'vue'
import type { TheFolderBrowser } from '@/interfaces/components/TheFolderBrowser'

export const theFolderBrowserKey: InjectionKey<TheFolderBrowser> = Symbol('TheFolderBrowser')