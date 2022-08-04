_testGlobals(
    { exists: ['mode', 'mods', 'userid', 'domain'] }
)

new Vue({
    el: "#app",
    delimiters: ["<%", "%>"],
    data() {
        return {
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
            mode: window.mode,
            mods: window.mods,
            modegulag: 0,
            userid: window.userid
        };
    },
    created() {
        // starting a page
        this.modegulag = this.StrtoGulagInt();
        this.LoadProfileData();
        this.LoadAllofdata({ animation: false });
        this.LoadUserStatus({ animation: false });
    },
    methods: {
        LoadAllofdata(opt) {
            this.LoadMostBeatmaps(opt);
            this.LoadScores('best', opt);
            this.LoadScores('recent', opt);
        },
        LoadProfileData() {
            this.$set(this.data.stats, 'load', true);
            this.$axios.get(`//api.${window.domain}/get_player_info`, {
                params: {
                    id: this.userid,
                    scope: 'all'
                }
            })
                .then(res => {
                    this.$set(this.data.stats, 'out', res.data.player.stats);
                    this.data.stats.load = false;
                });
        },
        async LoadScores(sort, { animation = true } = {}) {
            this.$set(this.data.scores[`${sort}`], 'load', true);
            await this.$axios.get(`//api.${window.domain}/get_player_scores`, {
                params: {
                    id: this.userid,
                    mode: this.StrtoGulagInt(),
                    scope: sort,
                    limit: this.data.scores[`${sort}`].more.limit
                }
            })
                .then(res => {
                    this.data.scores[`${sort}`].out = res.data.scores;
                    this.data.scores[`${sort}`].more.full = this.data.scores[`${sort}`].out.length != this.data.scores[`${sort}`].more.limit;
                });
            const toShow = this.$refs.scores && this.$refs.scores.filter(el => !el.classList.contains('show')) || [];
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
        async LoadMostBeatmaps({ animation = true } = {}) {
            this.$set(this.data.maps.most, 'load', true);
            await this.$axios.get(`//api.${window.domain}/get_player_most_played`, {
                params: {
                    id: this.userid,
                    mode: this.StrtoGulagInt(),
                    limit: this.data.maps.most.more.limit
                }
            })
                .then(res => {
                    this.data.maps.most.out = res.data.maps;
                    this.data.maps.most.more.full = this.data.maps.most.out.length != this.data.maps.most.more.limit;
                });
            const toShow = this.$refs.mostPlayed && this.$refs.mostPlayed.filter(el => !el.classList.contains('show')) || [];
            // animation
            if (!animation) {
                toShow.forEach(el => el.classList.add('show'))
                this.data.maps.most.load = false;
            } else {
                this.data.maps.most.load = false;
                toShow.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('show')
                    }, index * 20)
                })
            }
        },
        LoadUserStatus() {
            this.$axios.get(`//api.${window.domain}/get_player_status`, {
                params: {
                    id: this.userid
                }
            })
                .then(res => {
                    this.$set(this.data, 'status', res.data.player_status)
                })
                .catch(function (error) {
                    clearTimeout(window.loop);
                    console.log(error);
                });
            window.loop = setTimeout(this.LoadUserStatus, 5000);
        },
        ChangeModeMods(mode, mods) {
            if (window.event)
                window.event.preventDefault();

            this.mode = mode;
            this.mods = mods;

            this.modegulag = this.StrtoGulagInt();
            this.data.scores.recent.more.limit = 5
            this.data.scores.best.more.limit = 5
            this.data.maps.most.more.limit = 6
            this.LoadAllofdata();
        },
        AddLimit(which) {
            if (window.event)
                window.event.preventDefault();

            if (which == 'bestscore') {
                this.data.scores.best.more.limit += 5;
                this.LoadScores('best');
            } else if (which == 'recentscore') {
                this.data.scores.recent.more.limit += 5;
                this.LoadScores('recent');
            } else if (which == 'mostplay') {
                this.data.maps.most.more.limit += 4;
                this.LoadMostBeatmaps();
            }
        },
        actionIntToStr(d) {
            switch (d.action) {
                case 0:
                    return 'Idle: 🔍 Song Select';
                case 1:
                    return '🌙 AFK';
                case 2:
                    return `Playing: 🎶 ${d.info_text}`;
                case 3:
                    return `Editing: 🔨 ${d.info_text}`;
                case 4:
                    return `Modding: 🔨 ${d.info_text}`;
                case 5:
                    return 'In Multiplayer: Song Select';
                case 6:
                    return `Watching: 👓 ${d.info_text}`;
                // 7 not used
                case 8:
                    return `Testing: 🎾 ${d.info_text}`;
                case 9:
                    return `Submitting: 🧼 ${d.info_text}`;
                // 10 paused, never used
                case 11:
                    return 'Idle: 🏢 In multiplayer lobby';
                case 12:
                    return `In Multiplayer: Playing 🌍 ${d.info_text} 🎶`;
                case 13:
                    return 'Idle: 🔍 Searching for beatmaps in osu!direct';
                default:
                    return 'Unknown: 🚔 not yet implemented!';
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
            switch (this.mode + "|" + this.mods) {
                case 'std|vn':
                    return 0;
                case 'taiko|vn':
                    return 1;
                case 'catch|vn':
                    return 2;
                case 'mania|vn':
                    return 3;
                case 'std|rx':
                    return 4;
                case 'taiko|rx':
                    return 5;
                case 'catch|rx':
                    return 6;
                case 'std|ap':
                    return 8;
                default:
                    return -1;
            }
        },
        StrtoModeInt() {
            switch (this.mode) {
                case 'std':
                    return 0;
                case 'taiko':
                    return 1;
                case 'catch':
                    return 2;
                case 'mania':
                    return 3;
            }
        },
    },
    computed: {}
});

function getScoreMods(m) {
	var r = '';
	var hasNightcore = false;
	if (m & NoFail) {
		r += 'NF';
	}
	if (m & Easy) {
		r += 'EZ';
	}
	if (m & NoVideo) {
		r += 'NV';
	}
	if (m & Hidden) {
		r += 'HD';
	}
	if (m & HardRock) {
		r += 'HR';
	}
	if (m & SuddenDeath) {
		r += 'SD';
	}
	if (m & Nightcore) {
		r += 'NC';
		hasNightcore = true;
	}
	if (!hasNightcore && (m & DoubleTime)) {
		r += 'DT';
	}
	if (m & Relax) {
		r += 'RX';
	}
	if (m & HalfTime) {
		r += 'HT';
	}
	if (m & Flashlight) {
		r += 'FL';
	}
	if (m & Autoplay) {
		r += 'AP';
	}
	if (m & SpunOut) {
		r += 'SO';
	}
	if (m & Relax2) {
		r += 'AP';
	}
	if (m & Perfect) {
		r += 'PF';
	}
	if (m & Key4) {
		r += '4K';
	}
	if (m & Key5) {
		r += '5K';
	}
	if (m & Key6) {
		r += '6K';
	}
	if (m & Key7) {
		r += '7K';
	}
	if (m & Key8) {
		r += '8K';
	}
	if (m & keyMod) {
		r += '';
	}
	if (m & FadeIn) {
		r += 'FD';
	}
	if (m & Random) {
		r += 'RD';
	}
	if (m & LastMod) {
		r += 'CN';
	}
	if (m & Key9) {
		r += '9K';
	}
	if (m & Key10) {
		r += '10K';
	}
	if (m & Key1) {
		r += '1K';
	}
	if (m & Key3) {
		r += '3K';
	}
	if (m & Key2) {
		r += '2K';
	}
	if (r.length > 0) {
		return r.slice();
	} else {
		return 'NM';
	}
}

var None = 0;
var NoFail = 1;
var Easy = 2;
var NoVideo = 4;
var Hidden = 8;
var HardRock = 16;
var SuddenDeath = 32;
var DoubleTime = 64;
var Relax = 128;
var HalfTime = 256;
var Nightcore = 512;
var Flashlight = 1024;
var Autoplay = 2048;
var SpunOut = 4096;
var Relax2 = 8192;
var Perfect = 16384;
var Key4 = 32768;
var Key5 = 65536;
var Key6 = 131072;
var Key7 = 262144;
var Key8 = 524288;
var keyMod = 1015808;
var FadeIn = 1048576;
var Random = 2097152;
var LastMod = 4194304;
var Key9 = 16777216;
var Key10 = 33554432;
var Key1 = 67108864;
var Key3 = 134217728;
var Key2 = 268435456;