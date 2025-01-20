import { Router } from 'express';
import { defaultRoutes } from './default';
import { userRoutes } from './users';
import { richardRoutes } from './richard';

export const routes = Router();

routes.use('/', defaultRoutes);
routes.use('/user', userRoutes);
routes.use('/richard', richardRoutes);