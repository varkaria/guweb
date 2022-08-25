/* eslint-env browser */

window.addEventListener('load', () => {
  const s = window._state?.reactive
  if (!s) {
    throw new Error('unable to locate states')
  }

  // eslint-disable-next-line no-undef
  _testGlobals(
    { exists: ['mode', 'mods', 'userid', 'domain'] },
    s
  )
  // eslint-disable-next-line no-new, no-undef
  new Vue({
    el: '#app',
    delimiters: ['<%', '%>'],
    data () {
      return {
        loop: undefined,
        data: {
          stats: {
            out: [{}],
            load: true
          },
          grades: {},
          scores: {
            recent: {
              out: [],
              load: true,
              more: {
                limit: 5,
                full: true
              }
            },
            best: {
              out: [],
              load: true,
              more: {
                limit: 5,
                full: true
              }
            }
          },
          maps: {
            most: {
              out: [],
              load: true,
              more: {
                limit: 5,
                full: true
              }
            }
          },
          status: {}
        },
        mode: s.mode,
        // @ts-ignore
        mods: s.mods,
        modegulag: 0,
        userid: s.userid,
        getScoreMods: (() => {
          const NoFail = 1
          const Easy = 2
          const NoVideo = 4
          const Hidden = 8
          const HardRock = 16
          const SuddenDeath = 32
          const DoubleTime = 64
          const Relax = 128
          const HalfTime = 256
          const Nightcore = 512
          const Flashlight = 1024
          const Autoplay = 2048
          const SpunOut = 4096
          const Relax2 = 8192
          const Perfect = 16384
          const Key4 = 32768
          const Key5 = 65536
          const Key6 = 131072
          const Key7 = 262144
          const Key8 = 524288
          const keyMod = 1015808
          const FadeIn = 1048576
          const Random = 2097152
          const LastMod = 4194304
          const Key9 = 16777216
          const Key10 = 33554432
          const Key1 = 67108864
          const Key3 = 134217728
          const Key2 = 268435456

          return function getScoreMods (m) {
            let r = ''
            let hasNightcore = false
            if (m & NoFail) {
              r += 'NF'
            }
            if (m & Easy) {
              r += 'EZ'
            }
            if (m & NoVideo) {
              r += 'NV'
            }
            if (m & Hidden) {
              r += 'HD'
            }
            if (m & HardRock) {
              r += 'HR'
            }
            if (m & SuddenDeath) {
              r += 'SD'
            }
            if (m & Nightcore) {
              r += 'NC'
              hasNightcore = true
            }
            if (!hasNightcore && (m & DoubleTime)) {
              r += 'DT'
            }
            if (m & Relax) {
              r += 'RX'
            }
            if (m & HalfTime) {
              r += 'HT'
            }
            if (m & Flashlight) {
              r += 'FL'
            }
            if (m & Autoplay) {
              r += 'AP'
            }
            if (m & SpunOut) {
              r += 'SO'
            }
            if (m & Relax2) {
              r += 'AP'
            }
            if (m & Perfect) {
              r += 'PF'
            }
            if (m & Key4) {
              r += '4K'
            }
            if (m & Key5) {
              r += '5K'
            }
            if (m & Key6) {
              r += '6K'
            }
            if (m & Key7) {
              r += '7K'
            }
            if (m & Key8) {
              r += '8K'
            }
            if (m & keyMod) {
              r += ''
            }
            if (m & FadeIn) {
              r += 'FD'
            }
            if (m & Random) {
              r += 'RD'
            }
            if (m & LastMod) {
              r += 'CN'
            }
            if (m & Key9) {
              r += '9K'
            }
            if (m & Key10) {
              r += '10K'
            }
            if (m & Key1) {
              r += '1K'
            }
            if (m & Key3) {
              r += '3K'
            }
            if (m & Key2) {
              r += '2K'
            }
            if (r.length > 0) {
              return r.slice()
            } else {
              return 'NM'
            }
          }
        })()
      }
    },
    computed: {},
    created () {
    // starting a page
      this.modegulag = this.StrtoGulagInt()
      this.LoadProfileData()
      this.LoadAllofdata({ animation: false })
      this.LoadUserStatus({ animation: false })
    },
    methods: {
      LoadAllofdata (opt) {
        this.LoadMostBeatmaps(opt)
        this.LoadScores('best', opt)
        this.LoadScores('recent', opt)
      },
      LoadProfileData () {
        this.$set(this.data.stats, 'load', true)
        this.$axios.get(`//api.${s.domain}/get_player_info`, {
          params: {
            id: this.userid,
            scope: 'all'
          }
        })
          .then(res => {
            this.$set(this.data.stats, 'out', res.data.player.stats)
            this.data.stats.load = false
          })
      },
      async LoadScores (sort, { animation = true } = {}) {
        this.$set(this.data.scores[`${sort}`], 'load', true)
        await this.$axios.get(`//api.${s.domain}/get_player_scores`, {
          params: {
            id: this.userid,
            mode: this.StrtoGulagInt(),
            scope: sort,
            limit: this.data.scores[`${sort}`].more.limit
          }
        })
          .then(res => {
            this.data.scores[`${sort}`].out = res.data.scores
            // eslint-disable-next-line eqeqeq
            this.data.scores[`${sort}`].more.full = this.data.scores[`${sort}`].out.length != this.data.scores[`${sort}`].more.limit
          })
        const toShow = (this.$refs.scores && this.$refs.scores.filter(el => !el.classList.contains('show'))) || []
        // animation
        if (!animation) {
          toShow.forEach(el => el.classList.add('show'))
          this.data.scores[`${sort}`].load = false
        } else {
          this.data.scores[`${sort}`].load = false
          toShow.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('show')
            }, index * 30)
          })
        }
      },
      async LoadMostBeatmaps ({ animation = true } = {}) {
        this.$set(this.data.maps.most, 'load', true)
        await this.$axios.get(`//api.${s.domain}/get_player_most_played`, {
          params: {
            id: this.userid,
            mode: this.StrtoGulagInt(),
            limit: this.data.maps.most.more.limit
          }
        })
          .then(res => {
            this.data.maps.most.out = res.data.maps
            this.data.maps.most.more.full = this.data.maps.most.out.length !== this.data.maps.most.more.limit
          })
        const toShow = (this.$refs.mostPlayed && this.$refs.mostPlayed.filter(el => !el.classList.contains('show'))) || []
        // animation
        if (!animation) {
          toShow.forEach(el => el.classList.add('show'))
          this.data.maps.most.load = false
        } else {
          this.data.maps.most.load = false
          toShow.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('show')
            }, index * 20)
          })
        }
      },
      LoadUserStatus () {
        this.$axios.get(`//api.${s.domain}/get_player_status`, {
          params: {
            id: this.userid
          }
        })
          .then(res => {
            this.$set(this.data, 'status', res.data.player_status)
          })
          .catch(function (error) {
            clearTimeout(this.loop)
            console.log(error)
          })
        this.loop = setTimeout(this.LoadUserStatus, 5000)
      },
      ChangeModeMods (mode, mods) {
        if (s.event) { s.event.preventDefault() }

        this.mode = mode
        this.mods = mods

        this.modegulag = this.StrtoGulagInt()
        this.data.scores.recent.more.limit = 5
        this.data.scores.best.more.limit = 5
        this.data.maps.most.more.limit = 6
        this.LoadAllofdata()
      },
      AddLimit (which) {
        if (s.event) { s.event.preventDefault() }

        if (which === 'bestscore') {
          this.data.scores.best.more.limit += 5
          this.LoadScores('best')
        } else if (which === 'recentscore') {
          this.data.scores.recent.more.limit += 5
          this.LoadScores('recent')
        } else if (which === 'mostplay') {
          this.data.maps.most.more.limit += 4
          this.LoadMostBeatmaps()
        }
      },
      actionIntToStr (d) {
        switch (d.action) {
          case 0:
            return 'Idle: 🔍 Song Select'
          case 1:
            return '🌙 AFK'
          case 2:
            return `Playing: 🎶 ${d.info_text}`
          case 3:
            return `Editing: 🔨 ${d.info_text}`
          case 4:
            return `Modding: 🔨 ${d.info_text}`
          case 5:
            return 'In Multiplayer: Song Select'
          case 6:
            return `Watching: 👓 ${d.info_text}`
          // 7 not used
          case 8:
            return `Testing: 🎾 ${d.info_text}`
          case 9:
            return `Submitting: 🧼 ${d.info_text}`
          // 10 paused, never used
          case 11:
            return 'Idle: 🏢 In multiplayer lobby'
          case 12:
            return `In Multiplayer: Playing 🌍 ${d.info_text} 🎶`
          case 13:
            return 'Idle: 🔍 Searching for beatmaps in osu!direct'
          default:
            return 'Unknown: 🚔 not yet implemented!'
        }
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
      secondsToDhm (seconds) {
        seconds = Number(seconds)
        const dDisplay = `${Math.floor(seconds / (3600 * 24))}d `
        const hDisplay = `${Math.floor(seconds % (3600 * 24) / 3600)}h `
        const mDisplay = `${Math.floor(seconds % 3600 / 60)}m `
        return dDisplay + hDisplay + mDisplay
      },
      StrtoGulagInt () {
        switch (this.mode + '|' + this.mods) {
          case 'std|vn':
            return 0
          case 'taiko|vn':
            return 1
          case 'catch|vn':
            return 2
          case 'mania|vn':
            return 3
          case 'std|rx':
            return 4
          case 'taiko|rx':
            return 5
          case 'catch|rx':
            return 6
          case 'std|ap':
            return 8
          default:
            return -1
        }
      },
      StrtoModeInt () {
        switch (this.mode) {
          case 'std':
            return 0
          case 'taiko':
            return 1
          case 'catch':
            return 2
          case 'mania':
            return 3
        }
      }
    }
  })
})
