import { Router, Request, Response } from 'express';
import { exitWithMessage, exitWithContent, HttpStatus } from './shared'

export const caseRoutes = Router();

caseRoutes.get('/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    exitWithMessage(res, `Case ID: ${id}`, HttpStatus.OK)
});

caseRoutes.get('/search', (req: Request, res: Response) => {
    const query = req.query.q;
    exitWithMessage(res, `Search query: ${query}`, HttpStatus.OK)
});

// /user/123?time=14:00&location=Paris
caseRoutes.get('/:id/details', (req: Request, res: Response) => {
    const id = req.params.id;
    const format = req.query.format;
    exitWithMessage(res, `Case ID: ${id}, Format: ${format}`, HttpStatus.OK)
});


caseRoutes.get('/?', (req: Request, res: Response) => {
    exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});