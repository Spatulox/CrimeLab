import { faker } from '@faker-js/faker';
import { Individual, Case, Testimony } from './schema';
import { neo4jSession } from './connexion';

async function generateFakeData() {
    try {
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

            // Insertion dans Neo4j
            await neo4jSession.run(
                'CREATE (:Individual {id: $id, name: $name, role: $role, phoneNumber: $phoneNumber})',
                { id: savedIndividual._id.toString(), name: savedIndividual.name, role: savedIndividual.role, phoneNumber: savedIndividual.phoneNumber }
            );
        }

        const cases = [];
        for (let i = 0; i < 5; i++) {
            const caseData = new Case({
                title: faker.lorem.sentence(),
                description: faker.lorem.paragraph(),
                location: faker.location.city(),
                individuals: faker.helpers.arrayElements(individuals, 3)
            });
            const savedCase = await caseData.save();
            cases.push(savedCase);


            await neo4jSession.run(
                'CREATE (:Case {id: $id, title: $title, description: $description, location: $location})',
                { id: savedCase._id.toString(), title: savedCase.title, description: savedCase.description, location: savedCase.location }
            );

            for (const individual of savedCase.individuals) {
                await neo4jSession.run(
                    'MATCH (i:Individual {id: $individualId}), (c:Case {id: $caseId}) CREATE (i)-[:INVOLVED_IN]->(c)',
                    { individualId: individual.toString(), caseId: savedCase._id.toString() }
                );
            }
        }

        for (let i = 0; i < 10; i++) {
            const testimony = new Testimony({
                witness: faker.helpers.arrayElement(individuals)._id,
                case: faker.helpers.arrayElement(cases)._id,
                statement: faker.lorem.sentences(2)
            });
            const savedTestimony = await testimony.save();


            await neo4jSession.run(
                'MATCH (w:Individual {id: $witnessId}), (c:Case {id: $caseId}) CREATE (w)-[:TESTIFIED {statement: $statement}]->(c)',
                {
                    witnessId: savedTestimony.witness?.toString() || "UNKNOWN",
                    caseId: savedTestimony.case?.toString() || "UNKNOWN",
                    statement: savedTestimony.statement
                }
            );
        }

        console.log(' Données factices générées et insérées dans Neo4j avec succès');
    } catch (error) {
        console.error(' Erreur lors de la génération des données :', error);
    }
}

export { generateFakeData };
