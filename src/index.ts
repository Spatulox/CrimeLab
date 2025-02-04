import { generateFakeData } from './populate';
import { mongoose, neo4jSession, neo4jDriver } from './connexion';




async function main() {
    //console.log('Lancement du script...');
    await generateFakeData();
}

main().then(() => {
   // console.log('Exécution terminée');
}).catch(err => console.error('Erreur lors de l\'exécution', err));


process.on('exit', async () => {
    await mongoose.disconnect();
    await neo4jSession.close();
    await neo4jDriver.close();
    console.log('Connexions fermées');
});
