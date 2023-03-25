new Vue({
    el: "#status",
    delimiters: ["<%", "%>"],
    data() {
        return {
            online_users: 0,
            total_users: 0,
        }
    },
    created() {
        var vm = this;
        vm.GetOnlineUsers()
    },
    methods: {
        GetOnlineUsers() {
            var vm = this;
            vm.$axios.get(`https://api.${domain}/v1/get_player_count`)
                .then(function (response) {
                    vm.online_users = response.data.counts.online;
                    vm.total_users = response.data.counts.total;
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

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    $('.navbar-item.has-dropdown').click(function () {
        $(this)
            .children('.navbar-dropdown')
            .toggle(500);
    });
}

