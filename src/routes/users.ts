import { Router, Request, Response } from 'express';

export const userRoutes = Router();

userRoutes.get('/id', (req: Request, res: Response) => {
    res.send('Hello id !');
});

userRoutes.get('/?', (req: Request, res: Response) => {
    res.send('Hello ? !');
});