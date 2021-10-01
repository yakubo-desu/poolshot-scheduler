
const resultsArrayToText = (results) => {
    if (!results || !results.length) return 'TBD';
    return results[0] + ' - ' + results[1];
}
const resultsTextToArray = (text) => {
    if (text === 'TBD') return null;
    return text.split(' - ').map(e => +e);
}

const AppState = Vue.createApp({
    data() {
        return {
            searchQuery: '',
            matches: []
        }
    },

    components: {'match-row': {
        props: ["match"],

        computed: {
            results: {
                get() {
                    return resultsArrayToText(this.match.results);
                },
                set(text) {
                    this.match.results = resultsTextToArray(text);
                    axios.post('/api/' + adminPrefix + '/report-match/' + this.match.id, this.match)
                        .then(() => alert('Result Updated for ' + this.match.name + ' Match'))
                        .catch(() => alert('Failed to update result for ' + this.match.name + ' Match'))
                }
            }
        },

        methods: {
            getResultOptions(match) {
                const maxWins = Math.ceil(match.bestOf / 2);
                const opts = [null];
                let bwins = maxWins, owins;
                for (owins = 0; owins < maxWins; owins++) {
                    opts.push([bwins, owins]);
                }
                for (bwins--; bwins >= 0; bwins--) {
                    opts.push([bwins, owins]);
                }
                return opts.map(resultsArrayToText);
            }
        },

        template: `
            <div class="match">
                <div class="name">{{ match.name }}</div>
                <div class="fixture">
                    <div class="team-blue">{{ match.teams[0].name }}</div>
                    <select v-model="results">
                        <option v-for="opt in getResultOptions(match)" :value="opt">{{ opt }}</option>
                    </select>
                    <div class="team-orange">{{ match.teams[1].name }}</div>
                </div>
                <div class="best-of">Best of {{match.bestOf}}</div>
            </div>
        `
    }},

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
        }
    }
}).mount('body');

const adminPrefix = window.location.pathname.split('/').filter(i => i)[0];
const fetchData = () => axios.get('/api/' + adminPrefix + '/all-reportable-matches').then(({data}) => AppState.updateMatches(data));

fetchData();
// setInterval(fetchData, 5000);
