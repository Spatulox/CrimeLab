import { Router, Request, Response } from 'express';
import { exitWithContent } from './shared'

export const defaultRoutes = Router();

defaultRoutes.get('/', (req: Request, res: Response) => {
    const tmp = {
        name:"CrimeLab",
        api_version:"v1",
        status:"running"
    }
    exitWithContent(res, tmp);
});