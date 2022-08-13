/* eslint-disable no-unused-vars */

function createState (initial) {
  const isProxy = Symbol('isProxy')
  const hooks = []
  const recursiveReactive = {
    get (target, key) {
      if (key === isProxy) { return true }
      return target[key]
    },
    set (target, key, value, proxy) {
      if (
        value instanceof File ||
        value instanceof Blob
      ) {
        target[key] = value
      } else if (typeof value === 'object') {
        target[key] = new Proxy(value, recursiveReactive)
      } else if (Array.isArray(value)) {
        target[key] = new Proxy(value, recursiveReactive)
      } else target[key] = value
    }
  }
  const state = new Proxy(initial, recursiveReactive)
  const reactive = new Proxy(state, {
    get (target, key) {
      const returnValue = target[key]
      // if (returnValue && returnValue[isProxy]) {
      //   setTimeout(updateState, 0)
      // }
      return returnValue
    },
    set (target, key, value) {
      target[key] = value
      updateState()
    }
  })
  function useHook (cb) {
    hooks.push(cb)
  }
  async function updateState () {
    console.log('update state:', state)
    for (const hook of hooks) {
      await hook(reactive)
    }
  }
  function transaction (cb, immediate = true) {
    cb(state)
    if (immediate) updateState()
    else return () => updateState()
  }

  return {
    useHook,
    forceUpdate: updateState,
    state,
    reactive,
    transaction
  }
}

const { state, reactive: s, useHook, forceUpdate, transaction } = createState({
  parseSucceed: false,
  parsed: {},
  replayFile: undefined,
  submitting: {}
})

useHook((state) => {
  const classes = document.getElementById('copy-to-form').classList
  if (state.parseSucceed) {
    classes.remove('is-hidden')
  } else {
    classes.add('is-hidden')
  }
  if (!state.replayFile) {
    const form = document.getElementById('osr-reader')
    form.replay_file.value = undefined
  }
})

useHook((state) => {
  const display = document.getElementById('replay-data')
  const dReplayMd5 = document.getElementById('display-map_md5')
  const dReplayScore = document.getElementById('display-score')
  if (
    dReplayMd5?.value == state.parsed.map_md5 &&
    dReplayScore?.value == state.parsed.score
  ) return
  console.log('re-render osr-reader result')
  const template = document.getElementById('record')
  const elements = Object.entries(state.parsed).map(([key, value]) => {
    const copy = template.content.cloneNode(true)
    const _key = copy.querySelector('#key')
    _key.innerText = key
    const _value = copy.querySelector('#value')
    _value.value = value
    _value.id = `display-${key}`

    if (typeof value === 'string') {
      _value.type = 'text'
    } else if (typeof value === 'number') {
      _value.type = 'number'
    } else if (typeof value === 'boolean') {
      _value.type = 'checkbox'
      _value.classList.remove('input')
      _value.classList.add('checkbox')
    }

    return copy
  })
  display.replaceChildren(...elements)
})

useHook(state => {
  const form = document.getElementById('submit-replay')
  // if (form.replay_id.value == state.submitting.replay_id) return
  console.log('re-populate submitting values')
  Object.entries(state.submitting).forEach(([key, value]) => {
    if (!form[key]) return
    form[key].value = value
  })
})

async function uploadOsr () {
  const update = transaction((s) => {
    s.parseSucceed = false
    s.parsed = {}
    s.replayFile = undefined
  }, false)

  const form = document.getElementById('osr-reader')
  const formData = new FormData(form)
  const replay = formData.get('replay_file')
  if (replay.size > 0 && replay.name.endsWith('.osr')) {
    const { replay: data, status } = await fetch('/admin/replays/parse', {
      method: 'post',
      body: formData
    }).then(res => res.json())
    if (status === 200) {
      transaction((s) => {
        s.parseSucceed = true
        s.parsed = data
        s.replayFile = replay
      })
    }
  } else {
    update()
  }
}
function copyReplayToForm () {
  transaction(s => {
    s.submitting = {
      ...s.parsed
    }
  })
}

async function submitReplay () {
  const form = document.getElementById('submit-replay')
  const formData = new FormData(form)
  const replayFile = state.replayFile
  formData.append('replay_file', replayFile)
  const userId = formData.get('userid')

  if (!userId) return
  // console.log([...formData.entries()])
  const endpoint = `//api.${window.domain}/submit_score`
  await fetch(endpoint, {
    method: 'post',
    body: formData,
    headers: {
      Authorization: api_key
    }
  }).then(res => res.json())
}
