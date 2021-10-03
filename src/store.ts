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

    async updateMatchTime(matchRef: string, time: Date) {
        const match = this.allMatches.find(m => m.ref === matchRef);
        if (!match) {
            console.warn('Didn\'t update time of match cuz not found with ref: ' + matchRef);
            return;
        }
        if (match.lock) {
            throw HTTPError.BAD_REQUEST('Cant update time for locked match! ref: ' + matchRef);
        }
        match.time = time;
        await this.db.write();
        return match;
    }

    async reportMatch(matchId: string, results: [number, number], resolveTeamRef: (ref: TeamRef) => [team?: Team, matchRef?: string]) {
        if (results === null) {
            return this.resetMatch(matchId, resolveTeamRef);
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
        const [[team1, matchRef1], [team2, matchRef2]] = match.teamsRefs.map(ref => resolveTeamRef(ref));
        if (!team1 || !team2) {
            throw HTTPError.BAD_REQUEST(`Team-refs could not be resolved for refs ${match.teamsRefs}. Check if the required matches are completed.`);
        }
        // Lock referenced matches now
        if (matchRef1) await this.lockMatch(matchRef1);
        if (matchRef2) await this.lockMatch(matchRef2);
        // now update current match
        match.results = results;
        match.teams = [team1, team2];
        await this.db.write();
    }

    private async resetMatch(matchId: string, resolveTeamRef: (ref: TeamRef) => [team?: Team, matchRef?: string]) {
        const match = this.allMatches.find(m => m.id === matchId);
        if (!match) {
            console.warn('Didn\'t update match cuz not found with id: ' + matchId);
            return;
        }
        if (match.lock) {
            console.warn('Didn\'t update match cuz match is locked! MatchId:' + matchId);
            return;
        }
        // Unlock referenced matches
        const [[, matchRef1], [, matchRef2]] = match.teamsRefs.map(ref => resolveTeamRef(ref));
        if (matchRef1) await this.unlockMatch(matchRef1);
        if (matchRef2) await this.unlockMatch(matchRef2);
        // now reset score
        delete match.results;
        delete match.teams;
        delete match.lock;
        await this.db.write();
    }

    async lockMatch(matchRef: string) {
        const match = this.allMatches.find(m => m.ref === matchRef);
        if (!match) {
            console.warn('Didn\'t lock match cuz not found with ref: ' + matchRef);
            return;
        }
        match.lock = true;
        await this.db.write();
    }

    async unlockMatch(matchRef: string) {
        const match = this.allMatches.find(m => m.ref === matchRef);
        if (!match) {
            console.warn('Didn\'t unlock match cuz not found with ref: ' + matchRef);
            return;
        }
        delete match.lock;
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