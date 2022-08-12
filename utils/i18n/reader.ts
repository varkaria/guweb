import glob from 'glob'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { mergeWith } from 'lodash'

import { paths as translationPaths, contextFromFileName, createConfilitKeyHandler, FileContext } from './config'

const parseLocale = (file: string, context: FileContext): LocaleRoot => {
  const locale = yaml.load(fs.readFileSync(file, 'utf8')) as Locale
  const _parse = (locale: Locale): LocaleRoot => {
    if (context.namespaces == null) {
      return {
        [context.locale]: {
          [context.namespace]: locale
        }
      }
    }
    const rtn: Record<string, any> = {}
    let inner = rtn
    context.namespaces.forEach((ns, index) => {
      if (index === (context as FileContext & {namespaces: []}).namespaces.length - 1) {
        inner[ns] = locale
        return
      }
      rtn[ns] = {}
      inner = rtn[ns]
    })
    return {
      [context.locale]: rtn
    }
  }
  if (Array.isArray(locale)) {
    const toMerge = locale.map(_parse)
    let rtn = {}
    for (const item of toMerge) {
      rtn = {
        ...rtn,
        ...item
      }
    }
    return rtn
  } else {
    return _parse(locale)
  }
}

const mixinLocale = (
  { merging, joinedLocales, mixingWith: { parsedLocale, context } }:
  { merging: boolean
    joinedLocales: LocaleRoot
    mixingWith: {
      parsedLocale: LocaleRoot
      context: FileContext
    }
  }
): void => {
  if (joinedLocales[context.locale] == null) joinedLocales[context.locale] = {}
  joinedLocales[context.locale] = mergeWith(
    joinedLocales[context.locale],
    parsedLocale[context.locale],
    (objValue, srcValue, key) => {
      if (objValue == null) {
        return srcValue
      }
      for (const k in srcValue) {
        if ((Boolean(objValue[k])) && objValue[k] !== srcValue[k]) {
          if (!merging) {
            console.warn(`[Warning] Merging into initilazed value:
${key}.${k}:
[${typeof srcValue[k]}${(typeof srcValue[k] === 'string' && `\`${srcValue[k] as string}\``) || ''}] merging into [${typeof objValue[k]}${(typeof objValue[k] === 'string' && `\`${objValue[k] as string}\``) || ''}].`)
          }
          objValue = createConfilitKeyHandler(merging)(objValue, srcValue, k)
          if (!merging) console.log('')
        } else {
          objValue[k] = srcValue[k]
        }
      }
      return objValue
      // return merge(objValue, srcValue)
    }
  )
}

const createReducer = ({ translationPath, merging }: {translationPath: string, merging: boolean}) => async (acc: LocaleRoot, match: string) => {
  console.log('parsing', match, '...\n')
  try {
    acc = await acc
    const relative = path.relative(translationPath, match)
    const context = contextFromFileName(relative)
    const data = await parseLocale(match, context)
    mixinLocale({
      merging,
      joinedLocales: acc,
      mixingWith: {
        parsedLocale: data,
        context
      }
    })
    return acc
  } catch (error) {
    console.error(error)
  }
}

const asyncGlob = async (path: string): Promise<string[]> => await new Promise((resolve, reject) => {
  glob(path, (err, matches) => {
    if (err != null) reject(err)
    else resolve(matches)
  })
})

export const readLocales = async (): Promise<LocaleRoot> => {
  let locales = {}
  for (const [index, conf] of translationPaths.entries()) {
    if (conf == null) continue
    const { path: translationPath, filter } = conf
    const matches = (await asyncGlob(path.join(translationPath, '**/*.yml')))
      .filter(filter)
    const reducer = createReducer({ translationPath, merging: index > 0 })
    locales = await matches.reduce(reducer, locales)
  }

  return locales
}
