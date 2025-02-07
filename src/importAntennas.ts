import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { Antenna } from "./schema";


interface AntennaData {
    latitude: number;
    longitude: number;
    nom_com: string;
    nom_dep: string;
}

async function importAntennas() {
    console.log("📡 Début de l'importation des antennes...");

    const filePath = path.join(__dirname, "../data/2024_T2_sites_Metropole.csv");

    const antennas: AntennaData[] = [];

    return new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
            .on('error', (error) => {
                console.error("Erreur lors de la lecture du fichier:", error);
                reject(error);
            })
            .pipe(csvParser({ separator: ";" }))
            .on("data", (row) => {
                //console.log("Première ligne lue:", row);

                if (row.latitude && row.longitude && row.nom_com && row.nom_dep) {
                    const latitude = Number(row.latitude.replace(",", "."));
                    const longitude = Number(row.longitude.replace(",", "."));


                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        antennas.push({
                            latitude,
                            longitude,
                            nom_com: row.nom_com.trim(),
                            nom_dep: row.nom_dep.trim()
                        });
                    } else {
                        console.warn(`Données incorrectes ignorées : ${row.latitude}, ${row.longitude}`);
                    }
                }
            })
            .on("end", async () => {
                console.log(`📊 ${antennas.length} antennes extraites. Insertion en cours...`);

                try {
                    await Antenna.insertMany(antennas);
                    console.log("Insertion des antennes terminée !");
                    resolve();
                } catch (error) {
                    console.error("Erreur lors de l'insertion :", error);
                    reject(error);
                }
            });
    });
}

export { importAntennas };
