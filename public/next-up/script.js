
const AppState = Vue.createApp({
    data() {
        return {
            matches: [],
            upNextMatch: null,
            timeLeft: ''
        }
    },

    computed: {
    },

    methods: {
        updateMatches(matches) {
            this.matches = matches
        },
        getTime(match) {
            const dt = luxon.DateTime.fromISO(match.time);
            return dt.toLocaleString(luxon.DateTime.TIME_SIMPLE);
        },
        setUpNextMatch() {
            const diffs = this.matches
                .filter(m => m.willStream)
                .map(m => ({
                    ...m, diff: luxon.DateTime.fromISO(m.time).diffNow().as('seconds')
                }));
            const m = diffs.find(d => d.diff > -10);
            this.upNextMatch = m || this.matches.filter(m => m.willStream).pop();
        },
        setTimeLeft() {
            this.setUpNextMatch()
            const match = this.upNextMatch;
            if (!match || match.diff < 0) return '00:00';
            let tl = match.diff; //luxon.DateTime.fromISO("2021-10-02T08:00:00.000Z").diffNow('seconds').toObject().seconds ^ 0;
            function twoDig(n) {
                n = Math.round(n % 100);
                if (0 <= n && n < 10) return '0' + n;
                else return '' + n;
            }
            if (tl < 0 || tl > 3600) tl = 0;
            const s = tl % 60, m = (tl - s) / 60;
            this.timeLeft = twoDig(m) + ':' + twoDig(s);
        }
    }
}).mount('body');

setInterval(() => {
    AppState.setTimeLeft()
}, 1000);

if (location.search.indexOf('onstream') !== -1) {
    AppState.searchQuery = 'on stream';
    AppState.hideSearch = true;
}

const fetchData = () => axios.get('/api/day1-schedule').then(({data}) => AppState.updateMatches(data));

fetchData();
if (location.search.indexOf('autorefresh') !== -1) {
    setInterval(fetchData, 10000);
}
