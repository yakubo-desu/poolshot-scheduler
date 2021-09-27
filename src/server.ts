import express, { RequestHandler } from 'express';
import { PoolStage } from './pools.js';

export class Server {
    private app = express();

    constructor(private poolStage: PoolStage) {
        this.app.use(express.json());
        // api and healthcheck
        this.app.get('/healthcheck', this.withErrorsHandled(this.healthCheck));
        this.app.get('/api/pool-standings', this.withErrorsHandled(this.getPoolStandings));
        this.app.get('/api/day1-schedule', this.withErrorsHandled(this.getDay1Schedule));
        this.app.post('/api/report-match/:matchId', this.withErrorsHandled(this.reportMatch));

        // anything else try to find from public folder
        this.app.use('/', express.static('public'));
        this.app.listen(process.env.HTTP_PORT ?? 3000, () => console.log(`listening!`));
    }

    private getPoolStandings: RequestHandler = (req, res) => {
        const standings = this.poolStage.exportStandings();
        res.send(standings);
    }

    private getDay1Schedule: RequestHandler = (req, res) => {
        const matches = this.poolStage.matches.map(match => ({
            ...match,
            teams: [
                match.teams?.[0].name ?? match.teamsRefs[0],
                match.teams?.[1].name ?? match.teamsRefs[1]
            ],
            teamsRefs: undefined
        }));
        res.send(matches);
    }

    private reportMatch: RequestHandler = async (req, res) => {
        const { matchId } = req.params;
        const { results } = req.body;
        // TODO: Handle elim stage matches
        if (!this.poolStage.matches.find(m => m.id === matchId)) {
            return res.sendStatus(404);
        }
        await this.poolStage.reportMatch(matchId, results);
        res.sendStatus(200);
    }

    private healthCheck: RequestHandler = (req, res) => {
        res.send('Healthy!');
    }

    private withErrorsHandled: (c: RequestHandler) => RequestHandler = (controller) => async (req, res, next) => {
        try {
            await controller(req, res, next);
        } catch (err) {
            if (err instanceof HTTPError) {
                res.status(err.status);
                res.send({ message: err.message });
            } else {
                res.sendStatus(500);
            }
            console.error(err);
        }
    }
}

export class HTTPError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
    }
    static readonly BAD_REQUEST   = (message: string) => new HTTPError(400, message);
    static readonly UNAUTHORIZED  = (message: string) => new HTTPError(401, message);
    static readonly FORBIDDEN     = (message: string) => new HTTPError(403, message);
    static readonly NOT_FOUND     = (message: string) => new HTTPError(404, message);
}
