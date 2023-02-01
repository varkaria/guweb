new Vue({
    el: "#dashboard",
    delimiters: ["<%", "%>"],
    data() {
        return {
            online_users: 0,
        }
    },
    created() {
        var vm = this;
        vm.GetOnlineUsers()
    },
    methods: {
        GetOnlineUsers() {
            var vm = this;
            vm.$axios.get(`${window.location.protocol}//api.${domain}/v1/get_player_count`)
                .then(function (response) {
                    vm.online_users = response.data.counts.online;
                });
        },
        addCommas(nStr) {
            nStr += '';
            var x = nStr.split('.');
            var x1 = x[0];
            var x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        }
    },
    computed: {
    }
});
