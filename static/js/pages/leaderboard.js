new Vue({
    el: "#app",
    delimiters: ["<%", "%>"],
    data() {
        return {
            boards : {},
            mode : 'std',
            mods : 'vn',
            sort : 'pp',
            load : false,
            no_player : false, // soon
        }
    },
    created() {
        this.LoadData(mode, mods, sort)
        this.LoadLeaderboard(sort, mode, mods)
    },
    methods: {
        URL() {
            return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
        },
        LoadData(mode, mods, sort) {
            this.$set(this, 'mode', mode);this.$set(this, 'mods', mods);this.$set(this, 'sort', sort)
        },
        LoadLeaderboard(sort, mode, mods) {
            if (window.event) {window.event.preventDefault();}
            window.history.replaceState('', document.title, `/leaderboard/${this.mode}/${this.sort}/${this.mods}`);
            this.$set(this, 'mode', mode);this.$set(this, 'mods', mods)
            this.$set(this, 'sort', sort);this.$set(this, 'load', true)
            this.$axios.get(`${this.URL()}/gw_api/get_leaderboard`, { params: {
                mode: this.mode, sort: this.sort, mods: this.mods,
            }}).then(res => {this.$set(this, 'boards', res.data);this.$set(this, 'load', false)});
        },
        scoreFormat(score){
            var addCommas = this.addCommas;
            if (score > 1000 * 1000){
                if(score > 1000 * 1000 * 1000)
                    return `${addCommas((score / 1000000000).toFixed(2))} billion`;
                return `${addCommas((score / 1000000).toFixed(2))} million`;
            }
            return addCommas(score);
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
    },
    computed: {
    }
});
