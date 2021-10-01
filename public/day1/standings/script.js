
const AppState = Vue.createApp({
    data() {
        return {
            poolA: [{
                "team": "Pineapple Cake",
                "matchesPlayed": 1,
                "matchesWon": 1,
                "matchesLost": 0,
                "gamesWon": 2,
                "gamesLost": 0
            }],
            poolB: [],
            poolC: [],
            poolD: []
        }
    },

    methods: {
        updateState(state) {
            Object.keys(state).forEach(prop => this[prop] = state[prop]);
        },

        gameDifferential(team) {
            const diff = team.gamesWon - team.gamesLost;
            return (diff > 0) ? '+' + diff : diff;
        }
    }
}).mount('body');

const fetchData = () => axios.get('/api/pool-standings').then(({data}) => AppState.updateState(data));

fetchData();
if (location.search.indexOf('autorefresh') !== -1) {
    setInterval(fetchData, 10000);
}
