import express, { RequestHandler } from 'express';
import { ElimStage } from './elims.js';
import { PoolStage } from './pools.js';

export class Server {
    private app = express();
    private adminPrefix = process.env.ADMIN_PREFIX;

    constructor(private poolStage: PoolStage, private elimStage: ElimStage) {
        if (!this.adminPrefix) throw new Error('No admin prefix provided!');
        // parse json post body
        this.app.use(express.json());
        // api and healthcheck
        this.app.get('/healthcheck', this.withErrorsHandled(this.healthCheck));
        this.app.get('/api/pool-standings', this.withErrorsHandled(this.getPoolStandings));
        this.app.get('/api/day1-schedule', this.withErrorsHandled(this.getDay1Schedule));
        this.app.get('/api/day2-schedule', this.withErrorsHandled(this.getDay2Schedule));

        // admin api and static files
        this.app.get(`/api/${this.adminPrefix}/all-reportable-matches`, this.withErrorsHandled(this.getAllReportableMatches));
        this.app.post(`/api/${this.adminPrefix}/report-match/:matchId`, this.withErrorsHandled(this.reportMatch));
        this.app.use(`/${this.adminPrefix}/` , express.static('admin'));

        // anything else try to find from public folder
        this.app.get('/day2/standings', (req, res) => res.send('Oops, you\'re too early here mate! Come back tommorrow!'));
        this.app.get('/day2/schedule', (req, res) => res.send('Oops, you\'re too early here mate! Come back tommorrow!'));
        this.app.use('/', express.static('public'));
        this.app.listen(process.env.HTTP_PORT ?? 3000, () => console.log(`listening!`));
    }

    private getPoolStandings: RequestHandler = (req, res) => {
        const standings = this.poolStage.exportStandings();
        res.send(standings);
    }

    private getDay1Schedule: RequestHandler = (req, res) => {
        const matches = this.poolStage.matches;
        res.send(matches);
    }

    private getDay2Schedule: RequestHandler = (req, res) => {
        const matches = this.elimStage.matches;
        res.send(matches);
    }

    private getAllReportableMatches: RequestHandler = (req, res) => {
        const matches = [
            ...this.poolStage.matches,
            ...this.elimStage.matches
        ].filter(m => !m.lock && !m.teams[0].hasOwnProperty('ref') && !m.teams[1].hasOwnProperty('ref'));
        res.send(matches);
    }

    private reportMatch: RequestHandler = async (req, res) => {
        const { matchId } = req.params;
        const { results } = req.body;
        if (this.poolStage.matches.find(m => m.id === matchId)) {
            await this.poolStage.reportMatch(matchId, results);
            return res.sendStatus(200);
        }
        if (this.elimStage.matches.find(m => m.id === matchId)) {
            await this.elimStage.reportMatch(matchId, results);
            return res.sendStatus(200);
        }
        // if match not found in poolStage and elimStage!
        res.sendStatus(404)
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
