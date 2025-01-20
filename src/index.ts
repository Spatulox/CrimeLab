import express, { Request, Response } from 'express';
import config from '../config.json'
import { routes } from './routes';



const PORT = config.PORT || 3000;

const app = express();
app.use(routes);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});