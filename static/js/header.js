new Vue({
    el: '#navbar',
    delimiters: ['<%', '%>'],
    data() {
        return {
            res: [],
            search: {
                input: '',
                timeout: null
            },
            show: false,
            loading: Boolean,
        }
    },
    methods: {
        fetchUsers() {
            this.loading = true
            this.apierror = false
            this.$axios.get(`/gw_api/search_users`, {
                params: {
                    q: this.search.input,
                }
            })
                .then(res => {
                    this.loading = false
                    this.res = res.data
                })
                .catch(error => {
                    this.loading = false
                    this.apierror = true
                })
        },
        HideSearch() {
            this.show = false
        },
        ShowSearch() {
            if (this.search.input.length > 0) {
                this.show = true
            }
        }
    },
    computed: {
        search_input: {
            get() {
                return this.search.input
            },
            set(val) {
                if (this.search.timeout) clearTimeout(this.search.timeout)
                this.search.timeout = setTimeout(() => {
                    this.search.input = val
                    if (val != '') {
                        this.show = true
                        this.fetchUsers()
                    } else {
                        this.show = false
                    }
                }, 300)
            }
        }
    },
    directives: {
        'click-outside': {
          bind: function(el, binding, vNode) {
            // Provided expression must evaluate to a function.
            if (typeof binding.value !== 'function') {
                const compName = vNode.context.name
              let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
              if (compName) { warn += `Found in component '${compName}'` }
              
              console.warn(warn)
            }
            // Define Handler and cache it on the element
            const bubble = binding.modifiers.bubble
            const handler = (e) => {
              if (bubble || (!el.contains(e.target) && el !== e.target)) {
                  binding.value(e)
              }
            }
            el.__vueClickOutside__ = handler
    
            // add Event Listeners
            document.addEventListener('click', handler)
                },
          
          unbind: function(el, binding) {
            // Remove Event Listeners
            document.removeEventListener('click', el.__vueClickOutside__)
            el.__vueClickOutside__ = null
    
          }
        }
    }
})