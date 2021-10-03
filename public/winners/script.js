
const AppState = Vue.createApp({
    data() {
        return {
            matchesMap: {}
        }
    },

    computed: {
    },

    methods: {
        matchWinner(m) {
            if (!m) return '';
            if (!m.results) return 'Winner of ' + m.ref;
            else if (m.results[0] > m.results[1]) return m.teams[0].name;
            else if (m.results[0] < m.results[1]) return m.teams[1].name;
            else return m.teams[0].name; // if score equal, first team (having higher seed) wins
        },
        matchLoser(m) {
            if (!m) return '';
            if (!m.results) return 'Loser of ' + m.ref;
            else if (m.results[0] < m.results[1]) return m.teams[0].name;
            else if (m.results[0] > m.results[1]) return m.teams[1].name;
            else return m.teams[1].name; // if score equal, first team (having higher seed) wins
        },
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
            matches.map(match => ({
                ...match,
                teams: match.teams.map(team => ({
                    ...team,
                    name: team.ref === team.name ? this.refToPlaceholderName(team.name) : team.name
                }))
            })).forEach(match => this.matchesMap[match.ref] = match);
        }
    }
}).mount('body');

const fetchData = () => axios.get('/api/day2-schedule').then(({data}) => AppState.updateMatches(data));

fetchData();
setInterval(fetchData, 5000);
