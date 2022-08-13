/* eslint-disable no-unused-vars */

function createState (initial) {
  const isProxy = Symbol('isProxy')
  const hooks = []
  const recursiveReactive = (bubbleUp = false) => ({
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
        target[key] = new Proxy(value, recursiveReactive(true))
      } else if (Array.isArray(value)) {
        target[key] = new Proxy(value, recursiveReactive(true))
      } else target[key] = value
      if (bubbleUp) {
        updateState({ bubble: true })
      }
    }
  })
  const state = new Proxy({}, recursiveReactive())
  for (const [k, v] of Object.entries(initial)) {
    state[k] = v
  }
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
  async function updateState ({ bubble = false } = {}) {
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
    nonReactive: state,
    reactive,
    transaction
  }
}

const { nonReactive, reactive: s, useHook, forceUpdate, transaction } = createState({
  userId: -1,
  apiKey: undefined,

  parseSucceed: false,
  parsed: {},
  replayFile: undefined,
  validationErrors: {}
})

useHook((state) => {
  // const result = document.getElementById('osr-result')
  const file = document.getElementById('form-replay-file-label')

  if (!state.replayFile) {
    const form = document.getElementById('osr-reader')
    delete form.replay_file.value
  } else {
    if (state.parseSucceed) {
      // result.classList.remove('is-hidden')
      file.classList.add('is-success')
      file.classList.remove('is-danger')
    } else {
      // result.classList.add('is-hidden')
      file.classList.add('is-danger')
      file.classList.remove('is-success')
    }
  }
})

useHook(state => {
  const display = document.getElementById('replay-result')
  const template = document.getElementById('template-replay-row')
  const elements = Object.entries(state.parsed)
    .filter(([key, value]) =>
      ['username', 'replay_id'].includes(key) &&
      value
    )
    .map(([key, value]) => {
      const copy = template.content.cloneNode(true)
      const _key = copy.querySelector('#key')
      _key.innerText = key
      const _value = copy.querySelector('#value')
      _value.innerText = value
      _value.id = `display-${key}`
      return copy
    })
  display.replaceChildren(...elements)
})

useHook(state => {
  const form = document.getElementById('submit-replay')
  console.log('re-populate submitting values')
  Object.entries(state.parsed).forEach(([key, value]) => {
    if (!form[key]) return
    form[key].value = value
  })
})

useHook(state => {
  const inputs = submittingForm.querySelectorAll('input, select')
  inputs.forEach(el => {
    const id = `error-${el.name}`
    let error = document.getElementById(id)
    if (state.validationErrors[el.name]) {
      if (!error) {
        error = document.createElement('p')
        error.classList.add('has-text-danger', 'm-0')
        error.setAttribute('id', id)
        el.parentNode.appendChild(error)
      }
      error.innerText = state.validationErrors[el.name]
    } else {
      if (error) {
        error.remove()
      }
    }
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

async function submitReplay () {
  s.validationErrors = {}
  if (!nonReactive.userId) {
    window.alert('need userid but unset.')
    return
  }
  if (!s.parseSucceed) {
    window.alert('osr parse failed.')
    return
  }
  const form = document.getElementById('submit-replay')
  const formData = new FormData(form)
  const replayFile = nonReactive.replayFile
  formData.append('replay_file', replayFile)
  formData.append('userid', nonReactive.userId)
  formData.append('perfect', nonReactive.parsed.perfect)

  // console.log([...formData.entries()])
  const endpoint = `//api.${window.domain}/submit_score`
  const { detail, status, score_id: scoreId } = await fetch(endpoint, {
    method: 'post',
    body: formData,
    headers: {
      Authorization: s.apiKey
    }
  }).then(res => res.json())
  if (detail) {
    detail.forEach(setError(form))
    forceUpdate()
  }
  if (status === 200) {
    window.alert('submitted!\n score id: ' + scoreId)
    transaction((state) => {
      state.parseSucceed = false
      state.parsed = {}
      state.replayFile = undefined
      state.validationErrors = {}
    })
  }
}

function setError (el) {
  return (error) => {
    const occured = error.loc[1]
    const message = error.msg
    nonReactive.validationErrors[occured] = message
  }
}
const submittingForm = document.getElementById('submit-replay')

submittingForm.querySelectorAll('input, select').forEach((el) => {
  // console.log(el)
  el.addEventListener('change', (value) => {
    if (el.type === 'checkbox') {
      s.parsed[el.name] = el.checked
    } else if (el.type === 'number') {
      s.parsed[el.name] = el.valueAsNumber
    } else {
      s.parsed[el.name] = el.value
    }
  })
})
