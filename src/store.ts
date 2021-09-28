import { JSONFile, Low } from "lowdb";
import { HTTPError } from "./server.js";
import { StoreData, Team, TeamRef } from "./types.js";

export class Store {
    private db = new Low(new JSONFile<StoreData>('db.json'));

    async load() {
        await this.db.read();
        if (!this.db.data) throw new Error('Store could not be loaded!');
    }

    get data() {
        if (!this.db.data) throw new Error('Store could not be loaded!');
        return this.db.data;
    }

    get allMatches() {
        return [
            ...this.data.schedule.day1.matches,
            ...this.data.schedule.day2.matches,
        ];
    }

    async reportMatch(matchId: string, results: [number, number], resolveTeamRef: (ref: TeamRef) => Team | undefined) {
        if (results === null) {
            return this.resetMatch(matchId);
        }
        if (!results || results.length !== 2) {
            throw HTTPError.BAD_REQUEST('Results format incorrect! results provided: ' + results);
        }
        const match = this.allMatches.find(m => m.id === matchId);
        if (!match) {
            throw HTTPError.NOT_FOUND('Match not found with id: ' + matchId);
        }
        if (match.lock) {
            throw HTTPError.FORBIDDEN(`Locked match can't be updated! MatchId: ${matchId}`);
        }
        if (results[0] + results[1] > match.bestOf || Math.max(...results) * 2 !== match.bestOf + 1) {
            throw HTTPError.BAD_REQUEST(`Unacceptable result ${results[0]} - ${results[1]} for given Bo${match.bestOf} match with id ${matchId}`);
        }
        const [team1, team2] = match.teamsRefs.map(ref => resolveTeamRef(ref));
        if (!team1 || !team2) {
            throw HTTPError.BAD_REQUEST(`Team-refs could not be resolved for refs ${match.teamsRefs}. Check if the required matches are completed.`);
        }
        match.results = results;
        match.teams = [team1, team2];
        await this.db.write();
    }

    private async resetMatch(matchId: string) {
        const match = this.allMatches.find(m => m.id === matchId);
        if (!match) {
            console.warn('Didn\'t update match cuz not found with id: ' + matchId);
            return;
        }
        if (match.lock) {
            console.warn('Didn\'t update match cuz match is locked! MatchId:' + matchId);
            return;
        }
        delete match.results;
        delete match.teams;
        delete match.lock;
        await this.db.write();
    }

    async lockMatch(matchId: string) {
        const match = this.allMatches.find(m => m.id === matchId);
        if (!match) {
            console.warn('Didn\'t lock match cuz not found with id: ' + matchId);
            return;
        }
        match.lock = true;
        await this.db.write();
    }

    async resetAllMatches() {
        this.allMatches.forEach(match => {
            delete match.results;
            delete match.teams;
            delete match.lock;
        });
        await this.db.write();
    }
}