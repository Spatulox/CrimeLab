import { Router, Request, Response } from 'express';

export const defaultRoutes = Router();

defaultRoutes.get('/', (req: Request, res: Response) => {
    res.send('Hello default Express!');
});