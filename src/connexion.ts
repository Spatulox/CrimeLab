import mongoose from 'mongoose';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = 'mongodb://mongo:27017/crimelab';
mongoose.connect(mongoURI)
    .then(() => console.log(' Connexion à MongoDB réussie'))
    .catch(err => console.error(' Erreur de connexion à MongoDB :', err));

const neo4jURI = 'bolt://localhost:7687'
const neo4jUser = 'neo4j';
const neo4jPassword = 'password';

const neo4jDriver = neo4j.driver(neo4jURI, neo4j.auth.basic(neo4jUser, neo4jPassword));
const neo4jSession = neo4jDriver.session();

neo4jSession.run('RETURN 1')
    .then(() => console.log(' Connexion à Neo4j réussie'))
    .catch(err => console.error(' Erreur de connexion à Neo4j :', err));

export { mongoose, neo4jSession, neo4jDriver };
