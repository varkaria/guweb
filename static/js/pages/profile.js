new Vue({
    el: "#app",
    delimiters: ["<%", "%>"],
    data() {
        return {
            data: {
                stats: {},
                grades: {},
                scores: {
                    recent: {},
                    best: {},
                    most: {},
                    load: [false, false, false]
                },
            },
            mode: mode,
            mods: mods,
            userid: userid
        }
    },
    created() {
        // starting a page
        this.LoadProfileData()
        this.LoadAllofdata()
    },
    methods: {
        LoadAllofdata() {
            this.LoadMostBeatmaps()
            this.LoadScores('best')
            this.LoadScores('recent')
            this.LoadGrades()
        },
        URL() {
            return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
        },
        LoadProfileData() {
            this.$axios.get(`${this.URL()}/gw_api/get_user_info`, {
                params: {id: this.userid, scope: 'all'}
            })
                .then(res => {
                    this.$set(this.data, 'stats', res.data.userdata)
                });
        },
        LoadGrades() {
            this.$axios.get(`${this.URL()}/gw_api/get_user_grade`, {
                params: {id: this.userid, mode: this.mode, mods: this.mods}
            })
                .then(res => {
                    this.$set(this.data, 'grades', res.data)
                });
        },
        LoadScores(sort) {
            let type;
            if (sort == 'best') { type = 0 } else { type = 1 }
            this.data.scores.load[type] = true
            this.$axios.get(`${this.URL()}/gw_api/get_player_scores`, {
                params: {id: this.userid, mode: this.mode, mods: this.mods, sort: sort, limit: 5}
            })
                .then(res => {
                    this.data.scores[sort] = res.data.scores;
                    this.data.scores.load[type] = false
                });
        },
        LoadMostBeatmaps() {
            this.data.scores.load[2] = true
            this.$axios.get(`${this.URL()}/gw_api/get_player_most`, {
                params: {id: this.userid, mode: this.mode, mods: this.mods, limit: 5}
            })
                .then(res => {
                    this.data.scores.most = res.data.maps;
                    this.data.scores.load[2] = false
                });
        },
        ChangeModeMods(mode, mods) {
            if (window.event) { window.event.preventDefault() }
            this.mode = mode
            this.mods = mods
            this.LoadAllofdata()
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
        },
        secondsToDhm(seconds) {
            seconds = Number(seconds);
            var dDisplay = `${Math.floor(seconds / (3600 * 24))}d `;
            var hDisplay = `${Math.floor(seconds % (3600 * 24) / 3600)}h `;
            var mDisplay = `${Math.floor(seconds % 3600 / 60)}m `;
            return dDisplay + hDisplay + mDisplay;
        },
    },
    computed: {
    }
});
