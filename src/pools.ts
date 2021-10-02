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

    private sortTeamStandings(teams: Day1TeamStanding[]) {
        const sortedOrder: Day1TeamStanding[] = [];

        const intoBuckets = (teams: Day1TeamStanding[], measure: (t: Day1TeamStanding) => number) => {
            const buckets = new Map<number, Day1TeamStanding[]>();
            teams.forEach(team => {
                const measurement = measure(team);
                if (!buckets.has(measurement)) {
                    buckets.set(measurement, []);
                }
                buckets.get(measurement)?.push(team);
            });
            return buckets;
        }

        // sorts by headToHead for 2 teams, if >2 teams, breaks them binarily into 2 groups sorted by seed, then resolves those teams recursively
        const headToHeadSort = (teams: Day1TeamStanding[]): Day1TeamStanding[] => {
            if (!teams.length || teams.length < 2) return teams;
            if (teams.length > 2) {
                teams.sort((a, b) => a.team.seed - b.team.seed)
                const m = Math.floor(teams.length / 2);
                return [
                    ...headToHeadSort(teams.slice(0, m)),
                    ...headToHeadSort(teams.slice(m))
                ]
            }
            // exactly 2 teams now
            const match = this.store.data.schedule.day1.matches.find(m => m.teams && m.teams[0].name === teams[0].team.name && m.teams[1].name === teams[1].team.name);
            if (!match)  return teams.sort((a, b) => a.team.seed - b.team.seed);
            return (matchWinner(match)?.id === teams[0].team.id) ? teams : [teams[1], teams[0]];
        }

        // sort by series wins first
        const matchWinBuckets = intoBuckets(teams, t => t.matchesWon.length);
        [...matchWinBuckets.keys()].sort((a, b) => b - a).forEach(mwin => {
            const teams = matchWinBuckets.get(mwin);
            if (!teams || !teams.length) return;
            // if only 1 team in bucket, no tie-breaker needed
            if (teams.length === 1) {
                sortedOrder.push(teams[0]);
                return;
            }
            // if >1 teams in bucket, sort by game diffs
            const gameDiffBuckets = intoBuckets(teams, t => t.gamesWon - t.gamesLost);
            [...gameDiffBuckets.keys()].sort((a, b) => b - a).forEach(gdiff => {
                const teams = gameDiffBuckets.get(gdiff);
                if (!teams || !teams.length) return;
                // if only 1 team in bucket, no more tie-breaker needed
                if (teams.length === 1) {
                    sortedOrder.push(teams[0]);
                    return;
                }
                // if >1 teams in bucket, sort by headToHead
                sortedOrder.push(...headToHeadSort(teams));
            });
        })
        return sortedOrder;
    }

    get matches() {
        return this.store.data.schedule.day1.matches.map(match => ({
            ...match,
            lock: this.isLocked,
            teams: match.teams || match.teamsRefs.map(ref => this.resolveTeamRef(ref)[0] ?? { ref, name: ref }),
            teamsRefs: undefined
        }));
    }

    resolveTeamRef(ref: TeamRef): [team?: Team, matchRef?: string] {
        if (ref?.startsWith('seed-')) {
            const index = +(ref.slice('seed-'.length)) - 1;
            return [this.store.data.teams[index]];
        }
        return [];
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
        return this.store.teams.find(t => t.id === this.teamId)!;
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
