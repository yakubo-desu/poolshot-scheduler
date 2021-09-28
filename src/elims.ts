// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { PoolStage } from './pools.js';
import { Store } from "./store.js";
import { PoolName, TeamRef } from './types.js';
import { matchLoser, matchWinner } from './utils.js';

export class ElimStage {

    constructor(private store: Store, private poolStage: PoolStage) {
    }

    get matches() {
        return this.store.data.schedule.day2.matches.map(match => ({
            ...match,
            teams: match.teams || match.teamsRefs.map(ref => this.resolveTeamRef(ref) ?? { ref, name: ref }),
            teamsRefs: undefined
        }));
    }

    resolveTeamRef(teamRef: TeamRef) {
        if (teamRef.startsWith('pool-')) {
            if (!this.poolStage.isLocked) return;
            const pool = teamRef.slice('pool-'.length)[0].toUpperCase() as Uppercase<PoolName>;
            const pos = +teamRef.slice('pool-a'.length);
            return this.poolStage.standings[`pool${pool}`][pos-1].team;
        }
        if (teamRef.startsWith('wo-')) {
            const matchRef = teamRef.slice('wo-'.length);
            const match = this.store.data.schedule.day2.matches.find(m => m.ref === matchRef);
            if (!match) return;
            return matchWinner(match);
        }
        if (teamRef.startsWith('lo-')) {
            const matchRef = teamRef.slice('lo-'.length);
            const match = this.store.data.schedule.day2.matches.find(m => m.ref === matchRef);
            if (!match) return;
            return matchLoser(match);
        }
    }

    reportMatch(matchId: string, results: [number, number]) {
        return this.store.reportMatch(matchId, results, this.resolveTeamRef.bind(this));
    }

    // // passthrough function for type checks only
    // private guardMatchRefs<T extends MatchRef = MatchRef>(matches: Match<T>[]) {
    //     return matches;
    // }

    // private createElimMatches() {
    //     const UBMatches = this.guardMatchRefs<UpperBracketRef>([
    //         // UQFs
    //         {
    //             id: uuidv4(),                       name: 'Upper Quarter Finals 1', ref: 'uqf1',
    //             time: new Date("Oct 3 2021 14:30"), bestOf: 3, teamsRefs: ['pool-a1', 'pool-b2']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Upper Quarter Finals 2', ref: 'uqf2',
    //             time: new Date("Oct 3 2021 14:30"), bestOf: 3, teamsRefs: ['pool-b1', 'pool-a2']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Upper Quarter Finals 3', ref: 'uqf3',
    //             time: new Date("Oct 3 2021 14:30"), bestOf: 3, teamsRefs: ['pool-c1', 'pool-d2']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Upper Quarter Finals 4', ref: 'uqf4',
    //             time: new Date("Oct 3 2021 14:30"), bestOf: 3, teamsRefs: ['pool-d1', 'pool-c2']
    //         },
    //         // USFs
    //         {
    //             id: uuidv4(),                       name: 'Upper Semi Finals 1', ref: 'usf1',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 5, teamsRefs: ['wo-uqf1', 'wo-uqf2']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Upper Semi Finals 2', ref: 'usf2',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 5, teamsRefs: ['wo-uqf3', 'wo-uqf4']
    //         },
    //         // UF
    //         {
    //             id: uuidv4(),                       name: 'Upper Finals', ref: 'uf',
    //             time: new Date("Oct 3 2021 15:45"), bestOf: 5, teamsRefs: ['wo-usf1', 'wo-usf2']
    //         },
    //     ])

    //     const LBMatches = this.guardMatchRefs<LowerBracketRef>([
    //         // LPQFs
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Quarter Finals 1', ref: 'lpqf1',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 3, teamsRefs: ['lo-uqf1', 'pool-c3']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Quarter Finals 2', ref: 'lpqf2',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 3, teamsRefs: ['lo-uqf2', 'pool-d3']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Quarter Finals 3', ref: 'lpqf3',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 3, teamsRefs: ['lo-uqf3', 'pool-a3']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Quarter Finals 4', ref: 'lpqf4',
    //             time: new Date("Oct 3 2021 15:00"), bestOf: 3, teamsRefs: ['lo-uqf4', 'pool-b3']
    //         },
    //         // LQFs
    //         {
    //             id: uuidv4(),                       name: 'Lower Quarter Finals 1', ref: 'lqf1',
    //             time: new Date("Oct 3 2021 15:30"), bestOf: 3, teamsRefs: ['wo-lpqf1', 'wo-lpqf2']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Lower Quarter Finals 2', ref: 'lqf2',
    //             time: new Date("Oct 3 2021 15:30"), bestOf: 3, teamsRefs: ['wo-lpqf3', 'wo-lpqf4']
    //         },
    //         // LPSFs
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Semi Finals 1', ref: 'lpsf1',
    //             time: new Date("Oct 3 2021 16:00"), bestOf: 3, teamsRefs: ['lo-usf1', 'wo-lqf1']
    //         },
    //         {
    //             id: uuidv4(),                       name: 'Lower Pre-Semi Finals 2', ref: 'lpsf2',
    //             time: new Date("Oct 3 2021 16:00"), bestOf: 3, teamsRefs: ['lo-usf2', 'wo-lqf2']
    //         },
    //         // LSF
    //         {
    //             id: uuidv4(),                       name: 'Lower Semi Finals', ref: 'lsf',
    //             time: new Date("Oct 3 2021 16:30"), bestOf: 5, teamsRefs: ['wo-lpsf1', 'wo-lpsf2']
    //         },
    //         // LF
    //         {
    //             id: uuidv4(),                       name: 'Lower Finals', ref: 'lf',
    //             time: new Date("Oct 3 2021 17:15"), bestOf: 5, teamsRefs: ['lo-uf', 'wo-lsf']
    //         },
    //     ]);
    //     const GFMatch: Match<'gf'> = {
    //         id: uuidv4(),                       name: 'Grand Finals', ref: 'gf',
    //         time: new Date("Oct 3 2021 18:00"), bestOf: 7, teamsRefs: ['wo-uf', 'wo-lf']
    //     }
    //     this.store.data.schedule.day2.matches = [
    //         ...UBMatches,
    //         ...LBMatches,
    //         GFMatch
    //     ]; //.sort((a, b) => a.time < b.time ? -1 : 1);
    //     this.store['db'].write();
    // }
}
