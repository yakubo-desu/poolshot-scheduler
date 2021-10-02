
const AppState = Vue.createApp({
    data() {
        return {
            hideSearch: false,
            searchQuery: '',
            matches: []
        }
    },

    computed: {
        searchedMatches() {
            if (!this.searchQuery) return this.matches;
            const indexOfIgnoreCase = (s, q) => s.toLowerCase().indexOf(q.toLowerCase());
            if (indexOfIgnoreCase(this.searchQuery, 'stream') !== -1) {
                return this.matches.filter(m => m.willStream);
            }
            const hasQuery = (m) => {
                return indexOfIgnoreCase(m.name, this.searchQuery) !== -1
                    || indexOfIgnoreCase(m.teams[0].name, this.searchQuery) !== -1
                    || indexOfIgnoreCase(m.teams[1].name, this.searchQuery) !== -1;
            }
            const queryScore = (m) => {
                let pos = indexOfIgnoreCase(m.teams[0].name, this.searchQuery);
                if (pos !== -1) return pos;
                pos = indexOfIgnoreCase(m.teams[1].name, this.searchQuery);
                if (pos !== -1) return pos;
                pos = indexOfIgnoreCase(m.name, this.searchQuery);
                if (pos !== -1) return pos;
                return Number.MAX_SAFE_INTEGER;
            }
            return this.matches.filter(hasQuery).sort((m1, m2) => queryScore(m1) - queryScore(m2));
        }
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
            this.matches = matches.map(match => ({
                ...match,
                teams: match.teams.map(team => ({
                    ...team,
                    name: team.ref === team.name ? this.refToPlaceholderName(team.name) : team.name
                }))
            }))
        },
        getTime(match) {
            const dt = luxon.DateTime.fromISO(match.time);
            return dt.toLocaleString(luxon.DateTime.TIME_SIMPLE);
        }
    }
}).mount('body');

if (location.search.indexOf('onstream') !== -1) {
    AppState.searchQuery = 'on stream';
    AppState.hideSearch = true;
}

const fetchData = () => axios.get('/api/day2-schedule').then(({data}) => AppState.updateMatches(data));

fetchData();
if (location.search.indexOf('autorefresh') !== -1) {
    setInterval(fetchData, 10000);
}
