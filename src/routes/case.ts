import { Router, Request, Response } from 'express';
import { exitWithMessage, exitWithContent, HttpStatus, ObjectId, isMongoId } from './shared'
import { Individual, Case, Testimony, CallRecord ,Location,Antenna} from '../schema'

export const caseRoutes = Router();

caseRoutes.get('/all', async (req: Request, res: Response) => {
    try{
        const case_res = await Case.find().populate("location individuals")
        exitWithContent(res, case_res)
    } catch(err){
        exitWithMessage(res, `${err}`)
        return
    }
});

// /case/search?q_title=TitreDuCas
// /case/search?q_time=heure en 2025-02-08 ou 2025-02-08T10:00
// /case/search?q_location=id or name
caseRoutes.get('/search', async (req: Request, res: Response) => {
    const query = req.query.q_title as string | undefined;
    const timeString = req.query.q_time as string | undefined;
    const location = req.query.q_location as string | undefined;

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
                const locationDoc = await Location.findOne({ address: new RegExp(location, 'i') }).select('_id');
                if (locationDoc) {
                    searchCriteria.location = locationDoc._id;
                } else {
                    return exitWithMessage(res, "Location non trouvée", HttpStatus.NOT_FOUND);
                }
            } catch (err) {
                return exitWithMessage(res, `Erreur lors de la recherche de la location: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    console.log(searchCriteria)
    try {
        const case_content = await Case.find(searchCriteria)
            .populate("location individuals")
            .exec();

        if (!case_content || case_content.length === 0) {
            return exitWithMessage(res, "Aucun cas trouvé", HttpStatus.NOT_FOUND);
        }

        exitWithContent(res, case_content);
    } catch (err) {
        exitWithMessage(res, `Erreur lors de la recherche: ${err}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
});

// /case/idDuCas
caseRoutes.get('/:id', async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if(!isMongoId(id)){
        exitWithMessage(res, "Invalid ID")
        return
    }

    try{
        const case_res = await Case.find({_id: id}).populate("location individuals")
        if (!case_res || case_res.length == 0){
            return exitWithMessage(res, "Cas non trouvé", 404);
        }
        exitWithContent(res, case_res)
        return
    } catch(err){
        exitWithMessage(res, `${err}`)
        return
    }
});


caseRoutes.get('/?', (req: Request, res: Response) => {
    exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});