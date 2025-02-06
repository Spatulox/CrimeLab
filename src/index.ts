import { generateFakeData } from "./populate";
import { importAntennas } from "./importAntennas";
import { mongoose, neo4jSession, neo4jDriver } from "./connexion";

async function main() {

    try {
        await generateFakeData();
        console.log("Données factices insérées !");

        await importAntennas();
        console.log("Antennes relais importées !");
    } catch (error) {
        console.error("Erreur lors de l'exécution :", error);
    }
}
main()
    .then(() => console.log("Exécution complète"))
    .catch(err => console.error("Erreur lors de l'exécution :", err));


process.on("exit", async () => {
    await mongoose.disconnect();
    await neo4jSession.close();
    await neo4jDriver.close();
    console.log("Connexions fermées");
});
