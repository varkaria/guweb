// sticky header
$(window).scroll(() => {
  const header = document.getElementById('navbar')
  if (!header) return
  const sticky = header.offsetTop

  if (window.pageYOffset > sticky) {
    header.classList.add('minimized')
  } else {
    header.classList.remove('minimized')
  }
})

// toggle navbar for mobile
function togglenavbar () {
  const navbar = document.getElementById('navbar')
  navbar && navbar.classList.toggle('is-active')
  const burger = document.getElementById('navbar-burger')
  burger && burger.classList.toggle('is-active')
}

function setStyle (el, obj) {
  Object.entries(obj).forEach(([k, v]) => {
    el.style[k] = v
  })
}

function searchUser () {
  _testGlobals(
    { exists: ['domain'] }
  )
  const search = document.getElementById('u-search')
  if (!search) return
  const value = search.value
  const content = document.getElementById('u-search-content')
  content && (content.innerHTML = '')
  $.get('//osu.' + window.domain + '/search?q=' + value, function (data, status) {
    if (data != '{}') {
      content && content.removeAttribute('style')
      $.each(data, function (e, n) {
        const result = ({
          title: n.name,
          url: '/u/' + n.id,
          image: '//a.' + window.domain + '/' + n.id
        })
        const root = document.createElement('a')
        root.href = result.url
        root.className = 'navbar-item'
        const image = document.createElement('img')
        image.src = result.image
        setStyle(image, {
          width: '3rem',
          maxHeight: '3rem',
          backgroundSize: 'cover',
          borderRadius: '0.5em'
        })
        root.appendChild(image)
        const textSpan = document.createElement('span')
        setStyle(textSpan, {
          marginLeft: '5px',
          fontWeight: 700,
          fontSize: '1.2em',
          color: 'rgba(255,255,255,0.9)'
        })
        textSpan.innerText = result.title
        root.appendChild(textSpan)
        content && content.appendChild(root)
      })
    } else {
      content && setStyle(content, {
        display: 'none'
      })
    }
  })
}

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
