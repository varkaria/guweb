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
                    load: [true,true,true]
                },
                loadmore: {
                    limit: [5,5,6],
                    full: [true,true,true]
                },
                status: {},
                load: false
            },
            mode: mode,
            mods: mods,
            modegulag : 0,
            userid: userid
        }
    },
    created() {
        // starting a page
        this.modegulag = this.StrtoGulagInt()
        this.LoadProfileData()
        this.LoadAllofdata()
        this.LoadUserStatus()
    },
    methods: {
        LoadAllofdata() {
            this.LoadMostBeatmaps()
            this.LoadScores('best')
            this.LoadScores('recent')
        },
        LoadProfileData() {
            this.data.load = false
            this.$axios.get(`/api/get_player_info`, {
                params: {id: this.userid, scope: 'all'}
            })
                .then(res => {
                    this.$set(this.data, 'stats', res.data.player.stats)
                    this.data.load = true
                });
        },
        LoadScores(sort) {
            let type;
            if (sort == 'best') { type = 0 } else { type = 1 }
            this.$set(this.data.scores.load, type, true)
            this.$axios.get(`/api/get_player_scores`, {
                params: {id: this.userid, mode: this.StrtoGulagInt(), scope: sort, limit: this.data.loadmore.limit[type]}
            })
                .then(res => {
                    this.data.scores[sort] = res.data.scores;
                    this.data.scores.load[type] = false
                    if (res.data.scores.length != this.data.loadmore.limit[type]) {this.data.loadmore.full[type] = true}
                    else {this.data.loadmore.full[type] = false}
                });
        },
        LoadMostBeatmaps() {
            this.$set(this.data.scores.load, 2, true)
            this.$axios.get(`/api/get_player_most_played`, {
                params: {id: this.userid, mode: this.StrtoGulagInt(), limit: this.data.loadmore.limit[2]}
            })
                .then(res => {
                    this.data.scores.most = res.data.maps;
                    this.data.scores.load[2] = false;
                    if (res.data.maps.length != this.data.loadmore.limit[2]) {this.data.loadmore.full[2] = true}
                    else {this.data.loadmore.full[2] = false}
                });
        },
        LoadUserStatus() {
            this.$axios.get(`/api/get_player_status`, { 
                // sry cmyui but i didn't have some gulag setup rn 
                params: {id: this.userid}
            })
                .then(res => {
                    this.$set(this.data, 'status', res.data.player_status)
                })
                .catch(function (error) {
                    clearTimeout(loop);
                    console.log(error);
                })
            loop = setTimeout(this.LoadUserStatus, 5000);
        },
        ChangeModeMods(mode, mods) {
            if (window.event) { window.event.preventDefault() }
            this.mode = mode; this.mods = mods;
            this.modegulag = this.StrtoGulagInt()
            this.data.loadmore.limit = [5,5,6]
            this.LoadAllofdata()
        },
        AddLimit(which) {
            if (window.event) {
                window.event.preventDefault();
            }
            if (which == 'bestscore') {
                this.data.loadmore.limit[0] = this.data.loadmore.limit[0] + 5
                this.LoadScores('best')
            }
            else if (which == 'recentscore') {
                this.data.loadmore.limit[1] = this.data.loadmore.limit[1] + 5
                this.LoadScores('recent')
            }
            else if (which == 'mostplay') {
                this.data.loadmore.limit[2] = this.data.loadmore.limit[2] + 4
                this.LoadMostBeatmaps()
            }
        },
        ActionIntToStr(d) {
            if (d.action == 0) {return 'Idle: 🔍 Selecting a song'}
            else if (d.action == 1) {return 'Idle: 🌙 AFK'}
            else if (d.action == 2) {return 'Playing: 🎶 '+ d.info_text}
            else if (d.action == 3) {return 'Editing: 🔨 '+ d.info_text}
            else if (d.action == 4) {return 'Modding: 🔨 '+ d.info_text}
            else if (d.action == 5) {return 'In Multiplayer: Selecting 🏯 ' + d.info_text + ' ⛔️'}
            else if (d.action == 12) {return 'In Multiplayer: Playing 🌍 '+ d.info_text + ' 🎶'}
            else if (d.action == 6) {return 'Watching: 👓 '+ d.info_text}
            else if (d.action == 8) {return 'Testing: 🎾 '+ d.info_text}
            else if (d.action == 9) {return 'Submitting: 🧼 '+ d.info_text}
            else if (d.action == 10) {return 'Paused: 🚫 '+ d.info_text}
            else if (d.action == 11) {return 'Idle: 🏢 In multiplayer lobby'}
            else if (d.action == 13) {return 'Idle: 🫒 Downloading some beatmaps in osu!direct'}
            else {return 'Unknown: 🚔 not yet implemented!'}
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
        StrtoGulagInt() {
            m = this.mode; e = this.mods
            if (m == 'std' && e == 'vn') { return 0 }
            else if (m == 'taiko' && e == 'vn') { return 1 }
            else if (m == 'catch' && e == 'vn') { return 2 }
            else if (m == 'mania' && e == 'vn') { return 3 }
            else if (m == 'std' && e == 'rx') { return 4 }
            else if (m == 'taiko' && e == 'rx') { return 5 }
            else if (m == 'catch' && e == 'rx') { return 6 }
            else if (m == 'std' && e == 'ap') { return 7 }
            else { return -1 }
        },
        StrtoModeInt() {
            m = this.mode; e = this.mods
            if (m == 'std') { return 0 }
            else if (m == 'taiko') { return 1 }
            else if (m == 'catch') { return 2 }
            else if (m == 'mania') { return 3 }
        },
    },
    computed: {
    }
});
