import { config } from "dotenv"; config();
import { Store } from "./store.js";
import { PoolStage } from "./pools.js";
import { Server } from "./server.js";
import { ElimStage } from "./elims.js";

const main = async () => {
    const store = new Store();
    await store.load();

    const poolStage = new PoolStage(store);
    const elimStage = new ElimStage(store);
    const server = new Server(poolStage);
}

// db.data.schedule.day1.matches = [
//     ... poolStage.createPoolMatches(poolStage.standings.poolA, 'Pool A', new Date("Oct 2 2021 14:30")),
//     ... poolStage.createPoolMatches(poolStage.standings.poolB, 'Pool B', new Date("Oct 2 2021 15:00")),
//     ... poolStage.createPoolMatches(poolStage.standings.poolC, 'Pool C', new Date("Oct 2 2021 14:30")),
//     ... poolStage.createPoolMatches(poolStage.standings.poolD, 'Pool D', new Date("Oct 2 2021 15:00"))
// ].sort((a, b) => a.time < b.time ? -1 : 1);

main().catch(console.error);
