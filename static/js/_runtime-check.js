/* eslint-disable no-unused-vars */

// runtime check
function _testGlobals ({ exists = [] } = {}, scope = globalThis || window) {
  const result = exists.every(item => scope[item] !== undefined)

  if (!result) throw new Error('runtime check failed: ')
}
