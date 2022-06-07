export function toI18nEditor(locales) {
    const rtn = {}
    for (const locale in locales) {
        const namespaces = locales[locale]
        for (const namespace in namespaces) {
            const entries = namespaces[namespace]
            const context = {
                locale,
                namespace,
                extension: 'yml'
            }
        }
    }
    return rtn
}

export function fromI18nEditor(locales) {

}