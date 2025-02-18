import { Router, Request, Response } from 'express';
import { exitWithMessage, exitWithContent, HttpStatus, isMongoId, ObjectId } from './shared'
import { Individual, Case, Testimony, CallRecord ,Location} from '../schema'

export const userRoutes = Router();
// /user/search?user=Richard
userRoutes.get('/search', async (req: Request, res: Response) => {
    const user = req.query.user as string
    const id = req.query.id as string

    if(user) {
        try{
            const user_content = await Individual.find({ name: new RegExp(user, 'i') })
            if(user_content.length == 0){
                exitWithMessage(res, `No users`, HttpStatus.NOT_FOUND)
                return
            }
            exitWithContent(res, user_content)
            return
        } catch(err){
            exitWithMessage(res, `Something went wrong : ${err}`)
            return
        }
    }

    if(id && isMongoId(id)){
        try{
            const user_content = await Individual.findById(id)
            if(!user_content){
                exitWithMessage(res, `No users`, HttpStatus.NOT_FOUND)
                return
            }
            exitWithContent(res, user_content)
            return
        } catch(err){
            exitWithMessage(res, `Something went wrong : ${err}`)
            return
        }
    }

    exitWithMessage(res, `No user found`, HttpStatus.NOT_FOUND)
});

// Get all user
userRoutes.get('/all', async (req: Request, res: Response) => {
    try{
        const users = await Individual.find()
        if(users.length == 0){
            exitWithMessage(res, `No users`, HttpStatus.NOT_FOUND)
            return
        }
        exitWithContent(res, users)
        return
    } catch(err){
        exitWithMessage(res, `Something went wrong : ${err}`)
        return
    }
});

// Get all the case where the user is impliqué
// Get the case of the user based on their location and time
userRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const timeString = req.query.time as string | undefined;
        const location = req.query.location as string | undefined;

        if (!isMongoId(id)) {
            exitWithMessage(res, "ID invalide", HttpStatus.BAD_REQUEST);
            return;
        }

        const user = await Individual.findById(id);
        if (!user) {
            exitWithMessage(res, "Utilisateur non trouvé", HttpStatus.NOT_FOUND)
            return
        }

        let query: any = { individuals: ObjectId(id) };

        if (location) {
            let locationId: string;
            if (!isMongoId(location)) {
                const locationDoc = await Location.findOne({ address: location }).select('_id');
                if (locationDoc) {
                    locationId = locationDoc._id.toString();
                } else {
                    exitWithMessage(res, "Location n'existe pas", HttpStatus.NOT_FOUND)
                    return
                }
            } else {
                locationId = location;
            }
            query.location = ObjectId(locationId);
        }

        if (timeString) {
            const time = new Date(timeString);
            let startTime: Date, endTime: Date;

            if (!timeString.includes("T")) {
                startTime = new Date(time.setHours(0, 0, 0, 0));
                endTime = new Date(time.setHours(23, 59, 59, 999));
            } else {
                startTime = new Date(time.getTime() - 2 * 60 * 60 * 1000);
                endTime = new Date(time.getTime() + 2 * 60 * 60 * 1000);
            }

            query.date = { $gte: startTime, $lte: endTime };
        }

        const relevantCases = await Case.find(query).populate('individuals location');

        const involvedIndividuals = Array.from(new Set(
            relevantCases.flatMap(c => c.individuals.map(i => i._id.toString()))
        ));

        const testimonies = await Testimony.find({
            witness: { $in: involvedIndividuals.map(id => ObjectId(id)) },
        }).populate("witness");

        let response: any = {
            user,
            relevantCases,
            testimonies
        };

        if (timeString) {
            const callRecords = await CallRecord.find({
                $or: [
                    { caller: { $in: involvedIndividuals.map(id => ObjectId(id)) } },
                    { receiver: { $in: involvedIndividuals.map(id => ObjectId(id)) } }
                ],
                dateTime: query.date
            }).populate('caller receiver antenna');

            response.callRecords = callRecords;
        }

        exitWithContent(res, response);
        return;

    } catch (error) {
        console.error(error);
        exitWithMessage(res, `Erreur serveur ${error}`)
        return
    }
});

userRoutes.get('/?', (req: Request, res: Response) => {
    exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});