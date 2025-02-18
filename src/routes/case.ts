import {Router, Request, Response} from 'express';
import {exitWithMessage, exitWithContent, HttpStatus, ObjectId, isMongoId} from './shared'
import {Individual, Case, Location, Antenna} from '../schema'
import {neo4jDriver} from "../connexion";

export const caseRoutes = Router();

caseRoutes.get('/all', async (req: Request, res: Response) => {
	try {
		const case_res = await Case.find().populate("location individuals")
		exitWithContent(res, case_res)
	} catch (err) {
		exitWithMessage(res, `${err}`)
		return
	}
});

// /case/search?q_title=TitreDuCas
// /case/search?q_time=heure en 2025-02-08 ou 2025-02-08T10:00
// /case/search?q_location=id or name
// /case/search?q_individual=id or name
caseRoutes.get('/search', async (req: Request, res: Response) => {
	const query = req.query.q_title as string | undefined;
	const timeString = req.query.q_time as string | undefined;
	const location = req.query.q_location as string | undefined;
	const individual = req.query.q_individual as string | undefined;

	let searchCriteria: any = {};

	if (query) {
		searchCriteria.title = new RegExp(query, 'i');
	}

	if (timeString) {
		const date = new Date(timeString);
		if (!isNaN(date.getTime())) {
			const twoHoursBefore = new Date(date.getTime() - 2 * 60 * 60 * 1000);
			const twoHoursAfter = new Date(date.getTime() + 2 * 60 * 60 * 1000);
			searchCriteria.date = {
				$gte: twoHoursBefore,
				$lte: twoHoursAfter
			};
		} else {
			return exitWithMessage(res, "Format de date invalide", HttpStatus.BAD_REQUEST);
		}
	}

	// Location
	if (location) {
		if (isMongoId(location)) {
			searchCriteria.location = ObjectId(location);
		} else {
			try {
				const locationDoc = await Location.findOne({address: new RegExp(location, 'i')}).select('_id');
				if (locationDoc) {
					searchCriteria.location = locationDoc._id;
				} else {
					return exitWithContent(res, [], HttpStatus.OK);
				}
			} catch (err) {
				return exitWithMessage(res, `Erreur lors de la recherche de la location: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	if (individual) {
		if (isMongoId(individual)) {
			searchCriteria.individuals = ObjectId(individual);
		} else {
			try {
				const individualDoc = await Individual.findOne({name: new RegExp(individual, 'i')}).select('_id');
				if (individualDoc) {
					searchCriteria.individuals = individualDoc._id;
				} else {
					return exitWithMessage(res, "Individu non trouvé", HttpStatus.OK);
				}
			} catch (err) {
				return exitWithMessage(res, `Erreur lors de la recherche de l'individu: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
			}
		}
	}

	try {
		const case_content = await Case.find(searchCriteria)
			.populate("location individuals")
			.exec();

		if (!case_content || case_content.length === 0) {
			return exitWithContent(res, "Aucun cas trouvé", HttpStatus.OK);
		}

		exitWithContent(res, case_content);
	} catch (err) {
		exitWithMessage(res, `Erreur lors de la recherche: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
	}
});

// /case/idDuCas
caseRoutes.get('/:id', async (req: Request, res: Response) => {
	const id = req.params.id as string;

	if (!isMongoId(id)) {
		exitWithMessage(res, "Invalid ID")
		return
	}

	try {
		const case_res = await Case.find({_id: id}).populate("location individuals")
		if (!case_res || case_res.length == 0) {
			return exitWithMessage(res, "Cas non trouvé", 404);
		}
		exitWithContent(res, case_res[0])
		return
	} catch (err) {
		exitWithMessage(res, `${err}`)
		return
	}
});

caseRoutes.get('/users_involved/:id', async (req: Request, res: Response) => {
	const session = neo4jDriver.session();
	try {
		const result = await session.run(
			'MATCH (c:Case {id: $caseId})-[:INVOLVED_IN]-(i:Individual) ' +
			'RETURN DISTINCT i',
			{caseId: req.params.id.toString()}
		);
		const involvedIndividuals = result.records.map(record => {
			const individual = record.get('i').properties;
			return {
				id: individual.id,
				name: individual.name,
				role: individual.role,
				phoneNumber: individual.phoneNumber
			};
		});

		exitWithContent(res, involvedIndividuals);
	} catch (error) {
		exitWithMessage(res, `Erreur serveur ${error}`, HttpStatus.BAD_REQUEST);
	} finally {
		await session.close();
	}
});

caseRoutes.get('/calls_involved/:id', async (req: Request, res: Response) => {
	const session = neo4jDriver.session();
	try {
		const result = await session.run(
			'MATCH (c:Case {id: $caseId})-[:INVOLVED_IN]-(i1:Individual)' +
			'MATCH (i1)-[call:CALLED]-(i2:Individual)' +
			'WHERE (c)-[:INVOLVED_IN]-(i2)' +
			'RETURN DISTINCT i1, i2, call',
			{caseId: req.params.id.toString()}
		);
		const callPromises = result.records.map(async record => {
			const caller = record.get('i1').properties;
			const receiver = record.get('i2').properties;
			const callDetails = record.get('call').properties;

			return {
				caller: {
					id: caller.id,
					name: caller.name,
					phoneNumber: caller.phoneNumber
				},
				receiver: {
					id: receiver.id,
					name: receiver.name,
					phoneNumber: receiver.phoneNumber
				},
				callDetails: {
					dateTime: callDetails.dateTime,
					duration: callDetails.duration
				}
			};
		});

		exitWithContent(res, calls);
	} catch (error) {
		exitWithMessage(res, `Erreur serveur ${error}`, HttpStatus.BAD_REQUEST);
	} finally {
		await session.close();
	}
});


caseRoutes.get('/?', (req: Request, res: Response) => {
	exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});