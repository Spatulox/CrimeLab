import { Router } from 'express';
import { defaultRoutes } from './default';
import { userRoutes } from './users';
import { caseRoutes } from './case';
import { richardRoutes } from './richard';

export const routes = Router();

routes.use('/', defaultRoutes);
routes.use('/user', userRoutes);
routes.use('/case', caseRoutes);
routes.use('/richard', richardRoutes);