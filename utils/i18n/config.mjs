import { join } from 'path'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'lodash-es'

const __dirname = dirname(fileURLToPath(import.meta.url));

export const compiledFileNameSchema = ['namespace', 'locale', 'extension']
export const compiledFileSchema = ['locale', 'entries']
export const compiled = join(__dirname, '../../.locales')
export const path = join(__dirname, '../../locales')
export const divider = '.'

export const contextToFileName = function generateFileName(context) {
    return `${context.namespace}/${context.locale}.${context.extension || 'yml'}`
}
export const contextFromFileName = function generateContext(fileName) {
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
export function onConflictingKey(oldVal, newVal, key) {
    if (!typeof newVal[key] === 'object' || !typeof oldVal[key] === 'object') {
        console.error('onConflictingKey: unable to merge text with text.')
    }
    if (typeof newVal[key] === 'object' && typeof oldVal[key] === 'object') {
        console.info('merged object', oldVal, newVal)
        return merge(oldVal, newVal)
    }
    if (typeof newVal[key] === 'string') {
        console.info(`[info] ${key} renamed into ${key}._string.`)
        return {
            ...oldVal,
            [key]: {
                ...oldVal[key],
                _string: newVal[key]
            }
        }
    }
    else if (typeof oldVal[key] === 'string') {
        console.info(`[info] ${key} renamed into ${key}._string.`)
        return {
            ...newVal,
            [key]: {
                ...newVal[key],
                _string: oldVal[key]
            }
        }
    }
}