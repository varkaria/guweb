const globals = {
  _testGlobals: 'readonly'
}
;`togglenavbar,
searchUser,
searchMaps,
searchUsers,
createState`.split(',').forEach(name => {
    globals[name] = true
  })
module.exports = {
  extends: [
    'plugin:jquery/deprecated',
    'plugin:vue/recommended',
    'standard-with-typescript'
  ],
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    'jquery'
  ],
  globals
}
