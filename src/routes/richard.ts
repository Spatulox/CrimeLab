import { Router, Request, Response } from 'express';
import { exitWithMessage, exitWithContent, HttpStatus } from './shared'

export const richardRoutes = Router();

richardRoutes.get('/', (req: Request, res: Response) => {
    exitWithMessage(res, 'Hello Riri !', HttpStatus.OK)
});