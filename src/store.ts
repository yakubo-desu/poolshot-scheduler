import { JSONFile, Low } from "lowdb";
import { StoreData, Team } from "./types";

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

    async updateMatch(matchId: string, results: [number, number], refToIndex: (ref: string) => number) {
        const match = this.allMatches.find(m => m.id === matchId);
        if (!match) {
            console.warn('Didn\'t update match cuz not found with id: ' + matchId);
            return;
        }
        if (match.lock) {
            console.warn('Didn\'t update match cuz match is locked! MatchId:' + matchId);
            return;
        }
        match.results = results;
        match.teams = match.teamsRefs.map(ref => this.data.teams[refToIndex(ref)]) as [Team, Team];
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
}