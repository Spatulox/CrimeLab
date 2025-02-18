import express, { Request, Response } from 'express';
import config from '../config.json'
import cors from 'cors';
import { routes } from './routes';
import { importAntennas } from "./importAntennas";
import { mongoose, neo4jSession, neo4jDriver } from "./connexion";


// Initialisation du serveur Express
const PORT = config.PORT || 3000;

const app = express();
app.use(cors())
app.use(routes);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});


process.on("exit", async () => {
    await mongoose.disconnect();
    await neo4jSession.close();
    await neo4jDriver.close();
    console.log("Connexions fermées");
});