
// eslint-disable-next-line no-undef
_testGlobals({ exists: ['flags', 'mode', 'mods', 'sort', 'domain'] })

// eslint-disable-next-line no-new, no-undef
new Vue({
  el: '#app',
  delimiters: ['<%', '%>'],
  data () {
    return {
      flags: window.flags,
      boards: {},
      mode: window.mode || 'std',
      mods: window.mods || 'vn',
      sort: window.sort || 'pp',
      load: false,
      no_player: false // soon ^TM
    }
  },
  computed: {},
  created () {
    this.LoadData(window.mode, window.mods, window.sort)
    this.LoadLeaderboard(this.sort, this.mode, this.mods)
  },
  methods: {
    secondsToDhm (seconds) {
      seconds = Number(seconds)
      const dDisplay = `${Math.floor(seconds / (3600 * 24))}d `
      const hDisplay = `${Math.floor(seconds % (3600 * 24) / 3600)}h `
      const mDisplay = `${Math.floor(seconds % 3600 / 60)}m `
      return dDisplay + hDisplay + mDisplay
    },
    LoadData (mode, mods, sort) {
      this.mode = mode
      this.mods = mods
      this.sort = sort
    },
    LoadLeaderboard (sort, mode, mods) {
      if (window.event) { window.event.preventDefault() }

      window.history.replaceState('', document.title, `/leaderboard/${this.mode}/${this.sort}/${this.mods}`)
      this.$set(this, 'mode', mode)
      this.$set(this, 'mods', mods)
      this.$set(this, 'sort', sort)
      this.$set(this, 'load', true)
      this.$axios.get(`//api.${window.domain}/v1/get_leaderboard`, {
        params: {
          mode: this.StrtoGulagInt(),
          sort: this.sort
        }
      }).then(res => {
        this.boards = res.data.leaderboard
        this.$set(this, 'load', false)
      })
    },
    scoreFormat (score) {
      const addCommas = this.addCommas
      if (score > 1000 * 1000) {
        if (score > 1000 * 1000 * 1000) { return `${addCommas((score / 1000000000).toFixed(2))} billion` }
        return `${addCommas((score / 1000000).toFixed(2))} million`
      }
      return addCommas(score)
    },
    addCommas (nStr) {
      nStr += ''
      const x = nStr.split('.')
      let x1 = x[0]
      const x2 = x.length > 1 ? '.' + x[1] : ''
      const rgx = /(\d+)(\d{3})/
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2')
      }
      return x1 + x2
    },
    StrtoGulagInt () {
      switch (this.mode + '|' + this.mods) {
        case 'std|vn': return 0
        case 'taiko|vn': return 1
        case 'catch|vn': return 2
        case 'mania|vn': return 3
        case 'std|rx': return 4
        case 'taiko|rx': return 5
        case 'catch|rx': return 6
        case 'std|ap': return 8
        default: return -1
      }
    }
  }
})
