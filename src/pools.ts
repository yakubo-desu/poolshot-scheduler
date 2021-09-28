// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { Match, StoreData, Team, TeamRef } from "./types.js";
import { Store } from "./store.js";
import { matchWinner } from "./utils.js";

export class PoolStage {
    private readonly teams: PoolStandings

    constructor(private store: Store) {
        this.teams = {
            poolA: [0, 4,  8, 12].map(i => new Day1TeamStanding(store.data, store.data.teams[i].id)),
            poolB: [1, 5,  9, 13].map(i => new Day1TeamStanding(store.data, store.data.teams[i].id)),
            poolC: [2, 6, 10, 14].map(i => new Day1TeamStanding(store.data, store.data.teams[i].id)),
            poolD: [3, 7, 11, 15].map(i => new Day1TeamStanding(store.data, store.data.teams[i].id))
        }
    }

    get isLocked() { return this.store.data.schedule.day1.lock }

    get standings(): PoolStandings {
        return {
            poolA: this.sortTeamStandings(this.teams.poolA),
            poolB: this.sortTeamStandings(this.teams.poolB),
            poolC: this.sortTeamStandings(this.teams.poolC),
            poolD: this.sortTeamStandings(this.teams.poolD)
        }
    }

    exportStandings() {
        const st = this.standings;
        return {
            poolA: st.poolA.map(t => t.export()),
            poolB: st.poolB.map(t => t.export()),
            poolC: st.poolC.map(t => t.export()),
            poolD: st.poolD.map(t => t.export())
        }
    }

    private sortTeamStandings(s: Day1TeamStanding[]) {
        // TODO: correct the sorting order as per tie breaker logic
        return s.slice().sort((a, b) => b.matchesWon.length - a.matchesWon.length);
    }

    get matches() {
        return this.store.data.schedule.day1.matches.map(match => ({
            ...match,
            teams: match.teams || match.teamsRefs.map(ref => this.resolveTeamRef(ref) ?? { ref, name: ref }),
            teamsRefs: undefined
        }));
    }

    resolveTeamRef(ref: TeamRef) {
        if (ref?.startsWith('seed-')) {
            const index = +(ref.slice('seed-'.length)) - 1;
            return this.store.data.teams[index];
        }
    }

    reportMatch(matchId: string, results: [number, number]) {
        return this.store.reportMatch(matchId, results, this.resolveTeamRef.bind(this));
    }

    logSchedule() {
        this.matches.forEach(m => {
            console.log(`${m.name}:\t${m.teams?.[0].name} vs ${m.teams?.[1].name}\tat ${m.time}`);
        });
    }

    logResults() {
        this.matches.forEach(m => {
            if (!m.results) return;
            console.log(`${m.name}:\t${m.teams?.[0].name}   ${m.results[0]} - ${m.results[1]}   ${m.teams?.[1].name}`);
        });
    }

    /* temp functions to create pool matches */

    // createMatch(teams: [Day1TeamStanding, Day1TeamStanding], name: string, time: Date): Match {
    //     return {
    //         id: uuidv4(),
    //         name, time,
    //         teamsRefs: teams.map(t => 'seed-' + t.team?.seed) as [string, string]
    //     };
    // }

    // getAllPairs<T>(arr: T[]) {
    //     const pairs: [T, T][] = [];
    //     arr.forEach((e1, i) => {
    //         arr.forEach((e2, j) => {
    //             if (j <= i) return;
    //             pairs.push([e1, e2]);
    //         })
    //     });
    //     return pairs;
    // }

    // createPoolMatches(teams: Day1TeamStanding[], poolName: string, startTime: Date) {
    //     const pairs = this.getAllPairs(teams);
    //     return [
    //         this.createMatch(pairs[1], poolName + ' - Round 1', new Date(startTime)),
    //         this.createMatch(pairs[4], poolName + ' - Round 1', new Date(startTime)),
    //         this.createMatch(pairs[0], poolName + ' - Round 2', this.increaseHours(1, startTime)),
    //         this.createMatch(pairs[5], poolName + ' - Round 2', this.increaseHours(1, startTime)),
    //         this.createMatch(pairs[2], poolName + ' - Round 3', this.increaseHours(2, startTime)),
    //         this.createMatch(pairs[3], poolName + ' - Round 3', this.increaseHours(2, startTime)),
    //     ]
    // }

    // increaseHours(by: number, date: Date) {
    //     const increasedDate = new Date(date);
    //     increasedDate.setHours(date.getHours() + by);
    //     return increasedDate;
    // }
}

interface PoolStandings {
    poolA: Day1TeamStanding[],
    poolB: Day1TeamStanding[],
    poolC: Day1TeamStanding[],
    poolD: Day1TeamStanding[]
};

class Day1TeamStanding {
    constructor(private store: StoreData, private teamId: string) {}

    get team() {
        return this.store.teams.find(t => t.id === this.teamId);
    }

    get matchesPlayed(): Match[] {
        return this.store.schedule.day1.matches.filter(m => m.teams?.find(t => t.id === this.teamId));
    }

    get matchesWon(): Match[] {
        return this.matchesPlayed.filter(m => {
            const winner = matchWinner(m);
            return (winner && winner.id === this.teamId);
        });
    }

    get matchesLost(): Match[] {
        return this.matchesPlayed.filter(m => {
            const winner = matchWinner(m);
            return (winner && winner.id !== this.teamId);
        });
    }

    get gamesWon(): number {
        return this.matchesPlayed.reduce((sum, m) => {
            const i = m.teams?.findIndex(t => t.id === this.teamId)!;
            return sum + (m.results?.[i] ?? 0);
        }, 0);
    }

    get gamesLost(): number {
        return this.matchesPlayed.reduce((sum, m) => {
            const i = m.teams?.findIndex(t => t.id !== this.teamId)!;
            return sum + (m.results?.[i] ?? 0);
        }, 0);
    }

    export() {
        return {
            team: this.team?.name,
            matchesPlayed: this.matchesPlayed.length,
            matchesWon: this.matchesWon.length,
            matchesLost: this.matchesLost.length,
            gamesWon: this.gamesWon,
            gamesLost: this.gamesLost
        }
    }
}
