import { Router, Request, Response } from 'express';

export const richardRoutes = Router();

richardRoutes.get('/', (req: Request, res: Response) => {
    res.send('Hello Riri !');
});