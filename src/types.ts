
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

export interface Match<Ref extends MatchRef = MatchRef> {
    id: string;
    ref: Ref;
    name: string;
    time: Date;
    bestOf: number;
    teamsRefs: [TeamRef, TeamRef];
    results?: [number, number];
    teams?: [Team, Team];
    lock?: boolean;
}

export interface Team {
    id: string;
    name: string;
    seed: number;
}

export type SeedRef = `seed-${number}`;

export type PoolName = 'a' | 'b' | 'c' | 'd';
export type PoolStandingRef = `pool-${PoolName}${number}`;
export type PoolMatchRef = {[pool in PoolName]: `p${pool}${number}${pool}${number}`}[PoolName];

export type UpperBracketRef = `u${`${'q' | 's'}f${number}` | 'f'}`;
export type LowerBracketRef = `l${`${'pq' | 'q' | 'ps'}f${number}` | 'sf' | 'f'}`;
export type ElimMatchRef = UpperBracketRef | LowerBracketRef | 'gf';

export type TeamRef = SeedRef | PoolStandingRef | `wo-${ElimMatchRef}` | `lo-${ElimMatchRef}`;
export type MatchRef = PoolMatchRef | ElimMatchRef;
