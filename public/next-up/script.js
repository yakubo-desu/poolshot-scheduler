
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
        refToPlaceholderName(ref) {
            if (ref.toLowerCase().startsWith('wo-')) {
                const suffix = ref.slice('wo-'.length);
                return 'Winner of ' + suffix;
            }
            if (ref.toLowerCase().startsWith('lo-')) {
                const suffix = ref.slice('lo-'.length);
                return 'Loser of ' + suffix;
            }
            return ref;
        },
        updateMatches(matches) {
            this.matches = matches.filter(m => m.willStream).map(match => ({
                ...match,
                teams: match.teams.map(team => ({
                    ...team,
                    name: team.ref === team.name ? this.refToPlaceholderName(team.name) : team.name
                }))
            }));
        },
        getTime(match) {
            const dt = luxon.DateTime.fromISO(match.time);
            return dt.toLocaleString(luxon.DateTime.TIME_SIMPLE);
        },
        setUpNextMatch() {
            const diffs = this.matches
                .map(m => ({
                    ...m, diff: luxon.DateTime.fromISO(m.time).diffNow().as('seconds')
                }))
                .sort((a, b) => a.diff - b.diff);
            const m = diffs.find(d => d.diff > -600);
            this.upNextMatch = m || diffs.pop();
        },
        setTimeLeft() {
            this.setUpNextMatch();
            this.timeLeft = this.getTimeLeft(this.upNextMatch);
        },
        getTimeLeft(match) {
            if (!match || match.diff < 0) return '00:00';
            let tl = match.diff; //luxon.DateTime.fromISO("2021-10-02T08:00:00.000Z").diffNow('seconds').toObject().seconds ^ 0;
            function twoDig(n) {
                n = Math.round(n % 100);
                if (0 <= n && n < 10) return '0' + n;
                else return '' + n;
            }
            if (tl < 0 || tl > 3600) tl = 0;
            const s = tl % 60, m = (tl - s) / 60;
            return twoDig(m) + ':' + twoDig(s);
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

const fetchData = () => axios.get('/api/day2-schedule').then(({data}) => AppState.updateMatches(data));

fetchData();
setInterval(fetchData, 5000);
