import { Match } from "./types.js";

export const matchWinner = (m: Match) => {
    if (!m.results || !m.teams) return;
    else if (m.results[0] > m.results[1]) return m.teams[0];
    else if (m.results[0] < m.results[1]) return m.teams[1];
    else return m.teams[0]; // if score equal, first team (having higher seed) wins
}

export const matchLoser = (m: Match) => {
    if (!m.results || !m.teams) return;
    else if (m.results[0] < m.results[1]) return m.teams[0];
    else if (m.results[0] > m.results[1]) return m.teams[1];
    else return m.teams[1]; // if score equal, first team (having higher seed) wins
}
