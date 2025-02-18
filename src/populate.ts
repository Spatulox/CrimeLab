import {faker} from '@faker-js/faker';
import {Individual, Case, Testimony, Location, CallRecord, Antenna} from './schema';
import {neo4jDriver} from './connexion';
import {importAntennas} from "./importAntennas";


async function runNeo4jQuery(query: string, params: any) {
	const session = neo4jDriver.session();
	try {
		await session.run(query, params);
	} catch (error) {
		console.error(" Erreur Neo4j:", error);
	} finally {
		await session.close();
	}
}


async function generateFakeData() {
	try {

		const locations = [];
		for (let i = 0; i < 5; i++) {
			const location = new Location({
				name: faker.helpers.arrayElement([
					"Parking sous-terrain",
					"Supermarché",
					"Rue commerçante",
					"Boîte de nuit",
					"Quartier résidentiel"
				]),
				address: faker.location.streetAddress(),
				latitude: faker.location.latitude(),
				longitude: faker.location.longitude()
			});
			const savedLocation = await location.save();
			locations.push(savedLocation);


			await runNeo4jQuery(
				'CREATE (:Location {id: $id, name: $name, address: $address, latitude: $latitude, longitude: $longitude})',
				{
					id: savedLocation._id.toString(),
					name: savedLocation.name,
					address: savedLocation.address,
					latitude: savedLocation.latitude,
					longitude: savedLocation.longitude
				}
			);
		}


		const individuals = [];
		for (let i = 0; i < 10; i++) {
			const individual = new Individual({
				name: faker.person.fullName(),
				role: faker.helpers.arrayElement(['suspect', 'witness', 'victim']),
				phoneNumber: faker.phone.number(),
				address: faker.location.streetAddress()
			});
			const savedIndividual = await individual.save();
			individuals.push(savedIndividual);


			await runNeo4jQuery(
				'CREATE (:Individual {id: $id, name: $name, role: $role, phoneNumber: $phoneNumber})',
				{
					id: savedIndividual._id.toString(),
					name: savedIndividual.name,
					role: savedIndividual.role,
					phoneNumber: savedIndividual.phoneNumber
				}
			);
		}


		const witnesses = individuals.filter(ind => ind.role === "witness");


		const cases = [];
		const usedIndividuals = new Set();

		for (let i = 0; i < 5; i++) {
			let selectedIndividuals = faker.helpers.arrayElements(individuals, 3);


			if (i < individuals.length) {
				const individualToAssign = individuals[i];
				if (!selectedIndividuals.includes(individualToAssign)) {
					selectedIndividuals.push(individualToAssign);
				}
				usedIndividuals.add(individualToAssign._id.toString());
			}

			const caseData = new Case({
				title: faker.helpers.arrayElement([
					"Vol à main armée dans une bijouterie",
					"Cambriolage dans un appartement",
					"Enlèvement d'un témoin clé",
					"Trafic de stupéfiants démantelé",
					"Arnaque bancaire détectée"
				]),
				description: faker.helpers.arrayElement([
					"Un individu masqué a fait irruption dans la bijouterie et a menacé le personnel.",
					"Les cambrioleurs ont fracturé la porte et volé plusieurs objets de valeur.",
					"Un témoin clé a mystérieusement disparu avant de témoigner.",
					"Un réseau de trafic de drogue a été découvert par la police.",
					"Des transactions bancaires frauduleuses ont été détectées sur plusieurs comptes."
				]),
				location: faker.helpers.arrayElement(locations)._id,
				individuals: selectedIndividuals.map(ind => ind._id)
			});

			const savedCase = await caseData.save();
			cases.push(savedCase);


			await runNeo4jQuery(
				'CREATE (:Case {id: $id, title: $title, description: $description})',
				{id: savedCase._id.toString(), title: savedCase.title, description: savedCase.description}
			);

			await runNeo4jQuery(
				'MATCH (c:Case {id: $caseId}), (l:Location {id: $locationId}) CREATE (c)-[:TOOK_PLACE_AT]->(l)',
				{
					caseId: savedCase._id.toString(),
					locationId: savedCase.location ? savedCase.location.toString() : "UNKNOWN"
				}
			);

			for (const individual of selectedIndividuals) {
				await runNeo4jQuery(
					'MATCH (i:Individual {id: $individualId}), (c:Case {id: $caseId}) CREATE (i)-[:INVOLVED_IN]->(c)',
					{individualId: individual._id.toString(), caseId: savedCase._id.toString()}
				);
			}
		}


		for (const witness of witnesses) {
			const associatedCase = faker.helpers.arrayElement(cases);

			const testimony = new Testimony({
				witness: witness._id,
				case: associatedCase._id,
				statement: faker.helpers.arrayElement([
					"J'ai vu un homme courir avec un sac rempli d'argent.",
					"J'étais dans la rue quand j'ai entendu des cris et un bruit de verre cassé.",
					"Le suspect portait une veste noire et une casquette rouge.",
					"Je connais la victime, c'est un ami de longue date.",
					"J'ai vu deux hommes discuter près du lieu du crime juste avant que cela arrive."
				])
			});

			const savedTestimony = await testimony.save();

			await runNeo4jQuery(
				'MATCH (w:Individual {id: $witnessId}), (c:Case {id: $caseId}) CREATE (w)-[:TESTIFIED {statement: $statement}]->(c)',
				{
					witnessId: savedTestimony.witness!.toString(),
					caseId: savedTestimony.case!.toString(),
					statement: savedTestimony.statement
				}
			);
		}

		console.log(" Données factices générées et insérées avec succès !");
	} catch (error) {
		console.error(" Erreur lors de la génération des données :", error);
	}
}


async function generateCallRecords() {
	console.log(" Génération des appels téléphoniques...");

	const cases = await Case.find().populate("individuals");
	const antennas = await Antenna.find();

	if (cases.length === 0 || antennas.length === 0) {
		console.warn(" Pas d'affaires ou d'antennes disponibles pour générer des appels.");
		return;
	}

	const calls = [];

	for (const crimeCase of cases) {
		const individuals = crimeCase.individuals;
		if (individuals.length < 2) continue;

		for (let i = 0; i < faker.number.int({min: 2, max: 5}); i++) {
			const [caller, receiver] = faker.helpers.shuffle(individuals).slice(0, 2);
			const antenna = faker.helpers.arrayElement(antennas);
			if (!antenna) continue;

			const call = new CallRecord({
				caller: caller._id,
				receiver: receiver._id,
				antenna: antenna._id,
				dateTime: faker.date.recent({days: 30}),
				duration: faker.number.int({min: 30, max: 600})
			});

			const savedCall = await call.save();
			calls.push(savedCall);

			if (savedCall.caller && savedCall.receiver && savedCall.antenna) {
				await runNeo4jQuery(
					"MATCH (c1:Individual {id: $callerId}), (c2:Individual {id: $receiverId}), (a:Antenna {id: $antennaId}) " +
					"CREATE (c1)-[:CALLED {dateTime: $dateTime, duration: $duration}]->(c2)-[:VIA]->(a)",
					{
						callerId: savedCall.caller.toString(),
						receiverId: savedCall.receiver.toString(),
						antennaId: savedCall.antenna.toString(),
						dateTime: savedCall.dateTime.toISOString(),
						duration: savedCall.duration
					}
				);
			} else {
				console.warn("Un appel avec des valeurs null a été ignoré !");
			}
		}
	}

	console.log(`${calls.length} appels générés et insérés.`);
}

// G&énère et importe des fausses données
async function main() {
	console.log("Lancement de CrimeLab...");

	try {
		await generateFakeData();
		console.log("Données factices insérées !");

		await importAntennas();
		console.log("Antennes relais importées !");

		await generateCallRecords();
		console.log("Appels téléphoniques générés !");
	} catch (error) {
		console.error("Erreur lors de l'exécution :", error);
	}
}

main()
	.then(() => console.log("Exécution complète"))
	.catch(err => console.error("Erreur lors de l'exécution :", err));

process.exit(0);