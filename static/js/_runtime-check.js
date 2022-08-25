/* eslint-disable no-unused-vars */

// runtime check
function _testGlobals ({ exists = [] } = {}) {
  const _scope = globalThis || window
  const result = exists.every(item => _scope[item] !== undefined)

  if (!result) throw new Error('runtime check failed: ')
}
