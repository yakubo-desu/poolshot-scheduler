
export interface StoreData {
    teams: Team[];
    schedule: {
        day1: {
            lock: boolean,
            matches: Match[]
        },
        day2: {
            lock: boolean,
            matches: Match[]
        }
    }
}

export interface Match {
    id: string;
    name: string;
    time: Date;
    bestOf: number;
    teamsRefs: [string, string];
    results?: [number, number];
    teams?: [Team, Team];
    lock?: boolean;
}

export interface Team {
    id: string;
    name: string;
    seed: number;
}
