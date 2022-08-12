/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { join } from 'path'
// import { fileURLToPath } from 'url'
import { merge } from 'lodash'

import { using } from '../../config'

export const compiledFileNameSchema = ['namespace', 'locale', 'extension'] as Array<'namespace' | 'locale' | 'extension'>
export const compiledFileSchema = ['locale', 'entries']
export const compiled = join(__dirname, '../../.locales')
export const rootPath = join(__dirname, '../../')

export type LocalePathConfig =
    | string
    | [string, Partial<{
      filter: (path: string) => boolean
      only: string | string[]
      except: string | string[]
    }>]

// eslint-disable-next-line array-callback-return
export const paths = (using as LocalePathConfig[]).map((p) => {
  if (typeof p === 'string') {
    return {
      path: join(__dirname, '../../', p),
      filter: () => true
    }
  } else if (Array.isArray(p)) {
    if (p.length < 1) return undefined
    const path = p[0]
    const returnValue = {
      path: join(__dirname, '../../', path),
      filter: (_: string) => true
    }
    if (p.length < 2) return returnValue

    const conf = p[1]
    if (conf.filter) {
      returnValue.filter = conf.filter
      return returnValue
    } else {
      if (typeof conf.only === 'string') {
        conf.only = [conf.only]
        conf.only = conf.only.map((path) => join(returnValue.path, path))
        returnValue.filter = (path: string) => (conf.only as string[]).some(only => path.startsWith(only))
        return returnValue
      }
      if (typeof conf.except === 'string') {
        conf.except = [conf.except]
        conf.except = conf.except.map((path) => join(returnValue.path, path))
        returnValue.filter = (path) => (conf.except as string[]).every(except => !path.startsWith(except))
        return returnValue
      }
      throw new Error(`config invalid: ${p.toString()}`)
    }
  }
}).filter(Boolean)
export const divider = '.'

export function contextToFileName (context: FileContext): string {
  return `${context.namespace}/${context.locale}.${context.extension || 'yml'}`
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function contextFromFileName (fileName: string) {
  const split = fileName.split('/').join(divider).split(divider)
  const namespaces = split.slice(0, split.length - 2)
  const [locale, extension] = split.slice(-2)
  return {
    namespace: namespaces.join('.'),
    namespaces,
    locale: locale.replace('_', '-'),
    extension
  }
}
export interface FileContext {
  namespace: string
  namespaces?: string[]
  locale: string
  extension: string
}

export const createConfilitKeyHandler = (mergeMode: boolean) => function onConflictingKey (oldVal: any, newVal: any, key: string) {
  if (typeof newVal[key] !== 'object' && typeof oldVal[key] !== 'object') {
    console.log(typeof newVal[key], oldVal[key], newVal[key])
    return {
      ...oldVal,
      ...newVal
    }
  }
  if (typeof newVal[key] === 'object' && typeof oldVal[key] === 'object') {
    if (!mergeMode) console.info('merged object', oldVal, newVal)
    return merge(oldVal, newVal)
  }
  if (typeof newVal[key] === 'string') {
    console.info(`[info] ${key} renamed into ${key}._string.`)
    return {
      ...oldVal,
      ...newVal,
      [key]: {
        ...oldVal[key],
        _string: newVal[key]
      }
    }
  } else if (typeof oldVal[key] === 'string') {
    console.info(`[info] ${key} renamed into ${key}._string.`)
    return {
      ...oldVal,
      ...newVal,
      [key]: {
        ...newVal[key],
        _string: oldVal[key]
      }
    }
  }
}
