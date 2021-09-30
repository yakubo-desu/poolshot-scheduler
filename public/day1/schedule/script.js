
const AppState = Vue.createApp({
    data() {
        return {
            searchQuery: '',
            matches: []
        }
    },

    computed: {
        searchedMatches() {
            if (!this.searchQuery) return this.matches;
            const indexOfIgnoreCase = (s, q) => s.toLowerCase().indexOf(q.toLowerCase());
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
        updateMatches(matches) {
            this.matches = matches
        },
        getTime(match) {
            const dt = luxon.DateTime.fromISO(match.time);
            return dt.toLocaleString(luxon.DateTime.TIME_SIMPLE);
        }
    }
}).mount('body');

const fetchData = () => axios.get('/api/day1-schedule').then(({data}) => AppState.updateMatches(data));

fetchData();
// setInterval(fetchData, 5000);
