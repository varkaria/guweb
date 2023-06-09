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
            mode: mode,
            mods: mods,
            modegulag: 0,
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
            this.$set(this.data.stats, 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/v1/get_player_info`, {
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
        LoadScores(sort) {
            this.$set(this.data.scores[`${sort}`], 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/v1/get_player_scores`, {
                    params: {
                        id: this.userid,
                        mode: this.StrtoGulagInt(),
                        scope: sort,
                        limit: this.data.scores[`${sort}`].more.limit
                    }
                })
                .then(res => {
                    this.data.scores[`${sort}`].out = res.data.scores;
                    this.data.scores[`${sort}`].load = false
                    this.data.scores[`${sort}`].more.full = this.data.scores[`${sort}`].out.length != this.data.scores[`${sort}`].more.limit;
                });
        },
        LoadMostBeatmaps() {
            this.$set(this.data.maps.most, 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/v1/get_player_most_played`, {
                    params: {
                        id: this.userid,
                        mode: this.StrtoGulagInt(),
                        limit: this.data.maps.most.more.limit
                    }
                })
                .then(res => {
                    this.data.maps.most.out = res.data.maps;
                    this.data.maps.most.load = false;
                    this.data.maps.most.more.full = this.data.maps.most.out.length != this.data.maps.most.more.limit;
                });
        },
        LoadUserStatus() {
            this.$axios.get(`${window.location.protocol}//api.${domain}/v1/get_player_status`, {
                    params: {
                        id: this.userid
                    }
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
        modsStr(mod) {
            const numbermods = [
                {mod_text: "MR", mod_bit: 1 << 30},
                {mod_text: "V2", mod_bit: 1 << 29},
                {mod_text: "2K", mod_bit: 1 << 28},
                {mod_text: "3K", mod_bit: 1 << 27},
                {mod_text: "1K", mod_bit: 1 << 26},
                {mod_text: "KC", mod_bit: 1 << 25},
                {mod_text: "9K", mod_bit: 1 << 24},
                {mod_text: "TG", mod_bit: 1 << 23},
                {mod_text: "CN", mod_bit: 1 << 22},
                {mod_text: "RD", mod_bit: 1 << 21},
                {mod_text: "FI", mod_bit: 1 << 20},
                {mod_text: "8K", mod_bit: 1 << 19},
                {mod_text: "7K", mod_bit: 1 << 18},
                {mod_text: "6K", mod_bit: 1 << 17},
                {mod_text: "5K", mod_bit: 1 << 16},
                {mod_text: "4K", mod_bit: 1 << 15},
                {mod_text: "PF", mod_bit: 1 << 14},
                {mod_text: "AP", mod_bit: 1 << 13},
                {mod_text: "SO", mod_bit: 1 << 12},
                {mod_text: "AU", mod_bit: 1 << 11},
                {mod_text: "FL", mod_bit: 1 << 10},
                {mod_text: "NC", mod_bit: 1 << 9},
                {mod_text: "HT", mod_bit: 1 << 8},
                {mod_text: "RX", mod_bit: 1 << 7},
                {mod_text: "DT", mod_bit: 1 << 6},
                {mod_text: "SD", mod_bit: 1 << 5},
                {mod_text: "HR", mod_bit: 1 << 4},
                {mod_text: "HD", mod_bit: 1 << 3},
                {mod_text: "TD", mod_bit: 1 << 2},
                {mod_text: "EZ", mod_bit: 1 << 1},
                {mod_text: "NF", mod_bit: 1}
            ]
            let mod_text = '';
            let mod_num = 0
            if (!isNaN(mod)) {
                mod_num = mod
                let bit = mod.toString(2)
                let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
                for (let i = 30; i >= 0; i--) {
                    if (fullbit[i] == 1)  {
                        mod_text += numbermods[i].mod_text
                    }
                }
            } else {
                mod = mod.toUpperCase()
                if (mod !== 'NM') {
                    for (let i = 0; i < mod.length / 2; i++) {
                        let find_mod = numbermods.find(m => m.mod_text == mod.substr(i*2, 2))
                        mod_text += find_mod.mod_text
                        mod_num |= find_mod.mod_bit
                    }
                }
            }
            if (mod_text.includes('NC') && mod_text.includes('DT')) mod_text = mod_text.replace('DT', '');
            if (mod_text.includes('PF') && mod_text.includes('SD')) mod_text = mod_text.replace('SD', '');
            if (mod_num == 0) mod_text += 'NM';
            return mod_text;
        },
        actionIntToStr(d) {
            switch (d.action) {
                case 0:
                    return 'Parado: 🔍 Selecionando um mapa';
                case 1:
                    return '🌙 - Ausente';
                case 2:
                    return `Jogando: 🎶 ${d.info_text}`;
                case 3:
                    return `Editando: 🔨 ${d.info_text}`;
                case 4:
                    return `Moddando: 🔨 ${d.info_text}`;
                case 5:
                    return 'No multiplayer: Selecionando um mapa';
                case 6:
                    return `Assistindo: 👓 ${d.info_text}`.replace("play", "a jogar");
                    // 7 not used
                case 8:
                    return `Testando: 🎾 ${d.info_text}`;
                case 9:
                    return `Submetendo: 🧼 ${d.info_text}`;
                    // 10 paused, never used
                case 11:
                    return 'Parado: 🏢 Na sala multiplayer';
                case 12:
                    return `No multiplayer: Jogando 🌍 ${d.info_text} 🎶`;
                case 13:
                    return 'Parado: 🔍 procurando por beatmaps no osu!direct';
                default:
                    return 'Desconhecido: 🚔 não implementado ainda!';
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
