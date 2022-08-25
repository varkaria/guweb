_testGlobals(
  { exists: ['domain'] }
)

// eslint-disable-next-line no-undef, no-new
new Vue({
  el: '#dashboard',
  delimiters: ['<%', '%>'],
  data () {
    return {
      online_users: 0
    }
  },
  computed: {
  },
  created () {
    const vm = this
    vm.GetOnlineUsers()
  },
  methods: {
    GetOnlineUsers () {
      const vm = this
      vm.$axios.get(`//api.${window.domain}/get_player_count`)
        .then(function (response) {
          vm.online_users = response.data.counts.online
        })
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
    }
  }
})
