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
                    load: [true, true, true]
                },
                loadmore: {
                    limit: [5, 5, 6],
                    full: [true, true, true]
                },
                status: {},
                load: false
            },
            mode: mode,
            mods: mods,
            modegulag : 0,
            userid: userid
        };
    },
    created() {
        // starting a page
        this.modegulag = this.StrtoGulagInt();
        this.LoadProfileData();
        this.LoadAllofdata();
        this.LoadUserStatus();
    },
    methods: {
        LoadAllofdata() {
            this.LoadMostBeatmaps();
            this.LoadScores('best');
            this.LoadScores('recent');
        },
        LoadProfileData() {
            this.data.load = false;
            this.$axios.get('/api/get_player_info', {
                params: {id: this.userid, scope: 'all'}
            })
                .then(res => {
                    this.$set(this.data, 'stats', res.data.player.stats);
                    this.data.load = true;
                });
        },
        LoadScores(sort) {
            let type = (sort == 'best') ? 0 : 1;
            this.$set(this.data.scores.load, type, true);
            this.$axios.get('/api/get_player_scores', {
                params: {
                    id: this.userid,
                    mode: this.StrtoGulagInt(),
                    scope: sort,
                    limit: this.data.loadmore.limit[type]
                }
            })
                .then(res => {
                    this.data.scores[sort] = res.data.scores;
                    this.data.scores.load[type] = false
                    this.data.loadmore.full[type] = res.data.scores.length != this.data.loadmore.limit[type];
                });
        },
        LoadMostBeatmaps() {
            this.$set(this.data.scores.load, 2, true);
            this.$axios.get('/api/get_player_most_played', {
                params: {
                    id: this.userid,
                    mode: this.StrtoGulagInt(),
                    limit: this.data.loadmore.limit[2]
                }
            })
                .then(res => {
                    this.data.scores.most = res.data.maps;
                    this.data.scores.load[2] = false;
                    this.data.loadmore.full[2] = res.data.maps.length != this.data.loadmore.limit[2];
                });
        },
        LoadUserStatus() {
            this.$axios.get('/api/get_player_status', {
                // sry cmyui but i didn't have some gulag setup rn
                params: {id: this.userid}
            })
                .then(res => {
                    this.$set(this.data, 'status', res.data.player_status)
                })
                .catch(function (error) {
                    clearTimeout(loop);
                    console.log(error);
                });
            loop = setTimeout(this.LoadUserStatus, 5000);
        },
        ChangeModeMods(mode, mods) {
            if (window.event)
                window.event.preventDefault();

            this.mode = mode;
            this.mods = mods;

            this.modegulag = this.StrtoGulagInt();
            this.data.loadmore.limit = [5, 5, 6];
            this.LoadAllofdata();
        },
        AddLimit(which) {
            if (window.event)
                window.event.preventDefault();

            if (which == 'bestscore') {
                this.data.loadmore.limit[0] += 5;
                this.LoadScores('best');
            }
            else if (which == 'recentscore') {
                this.data.loadmore.limit[1] += 5;
                this.LoadScores('recent');
            }
            else if (which == 'mostplay') {
                this.data.loadmore.limit[2] += 4;
                this.LoadMostBeatmaps();
            }
        },
        actionIntToStr(d) {
            switch (d.action) {
                case 0: return 'Idle: 🔍 Selecting a song';
                case 1: return 'Idle: 🌙 AFK';
                case 2: return `Playing: 🎶 ${d.info_text}`;
                case 3: return `Editing: 🔨 ${d.info_text}`;
                case 4: return `Modding: 🔨 ${d.info_text}`;
                case 5: return `In Multiplayer: Selecting 🏯 ${d.info_text} ⛔️`;
                case 6: return `Watching: 👓 ${d.info_text}`;
                // 7 not used
                case 8: return `Testing: 🎾 ${d.info_text}`;
                case 9: return `Submitting: 🧼 ${d.info_text}`;
                case 10: return `Paused: 🚫 ${d.info_text}`;
                case 11: return 'Idle: 🏢 In multiplayer lobby';
                case 12: return `In Multiplayer: Playing 🌍 ${d.info_text} 🎶`;
                case 13: return 'Idle: 🫒 Downloading some beatmaps in osu!direct';
                default: return 'Unknown: 🚔 not yet implemented!';
            }
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
            switch (this.mode, this.mods) {
                case 'std', 'vn': return 0;
                case 'taiko', 'vn': return 1;
                case 'catch', 'vn': return 2;
                case 'mania', 'vn': return 3;
                case 'std', 'rx': return 4;
                case 'taiko', 'rx': return 5;
                case 'catch', 'rx': return 6;
                case 'std', 'ap': return 7;
                default: return -1;
            }
        },
        StrtoModeInt() {
            switch (this.mode) {
                case 'std': return 0;
                case 'taiko': return 1;
                case 'catch': return 2;
                case 'mania': return 3;
            }
        },
    },
    computed: {}
});
