import { Router, Request, Response } from 'express';
import { exitWithMessage, exitWithContent, HttpStatus, isMongoId, ObjectId } from './shared'
import { Individual, Case, Testimony, CallRecord ,Location,Antenna} from '../schema'
import { Types } from 'mongoose'

export const userRoutes = Router();
// /user/search?user=Richard
userRoutes.get('/search', async (req: Request, res: Response) => {
    const user = req.query.user as string
    try{
        const user_content = await Individual.find({ name: new RegExp(user, 'i') })
        exitWithContent(res, user_content)
        return
    } catch(err){
        exitWithMessage(res, `Something went wrong : ${err}`)
        return
    }
});

// Get all user
userRoutes.get('/all', async (req: Request, res: Response) => {
    try{
        const users = await Individual.find()
        exitWithContent(res, users)
        return
    } catch(err){
        exitWithMessage(res, `Something went wrong : ${err}`)
        return
    }
});

// Get the user, if no time nor location
// Get the case of the user based on their location and time
// Ouais je sais, ca fait deux choses WELP
userRoutes.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const timeString = req.query.time as string | undefined;
        const location = req.query.location as string | "";
        
        if (!isMongoId(id)) {
            exitWithMessage(res, "ID invalide", HttpStatus.BAD_REQUEST);
            return;
        }

        const time = timeString ? new Date(timeString) : undefined;

        // si on cherche que l'utilisateur
        if (!time && !location) {
            const user_content = await Individual.findById(id);
            if (!user_content) {
                exitWithMessage(res, "Utilisateur non trouvé", HttpStatus.NOT_FOUND);
                return;
            }
            exitWithContent(res, user_content);
            return;
        }
        

        const user = await Individual.findById(id);
        if (!user) {
            exitWithMessage(res, "Utilisateur non trouvé", HttpStatus.NOT_FOUND)
            return
        }
        
        let locationId: string = location;

        if (location && !isMongoId(location)) {
            const locationDoc = await Location.findOne({ address: location }).select('_id');
            if (locationDoc) {
                locationId = locationDoc._id.toString();
            } else {
                exitWithMessage(res, "Location don't exist", HttpStatus.NOT_FOUND)
                return
            }
        }

        let startTime: Date;
        let endTime: Date;
        let relevantCases

        if(time){
            if (timeString && !timeString.includes("T")) {
                startTime = new Date(time.setHours(0, 0, 0, 0));
                endTime = new Date(time.setHours(23, 59, 59, 999));
            } else {
                startTime = new Date(time.getTime() - 2 * 60 * 60 * 1000);
                endTime = new Date(time.getTime() + 2 * 60 * 60 * 1000);
            }
        
            relevantCases = await Case.find({
                individuals: ObjectId(id),
                date: { $gte: startTime, $lte: endTime },
                location: ObjectId(locationId)
            }).populate('individuals location');
        
        } else {
            relevantCases = await Case.find({
                individuals: ObjectId(id),
                location: ObjectId(locationId)
            }).populate('individuals location');
        }

        const involvedIndividuals = Array.from(new Set(
            relevantCases.flatMap(c => c.individuals.map(i => i._id.toString()))
        ));

        const testimonies = await Testimony.find({
            witness: { $in: involvedIndividuals.map(id => new Types.ObjectId(id)) },
        }).populate("witness");

        /*if(time){
            const callRecords = await CallRecord.find({
                $or: [{ caller: id }, { receiver: id }],
                date: { 
                    $gte: new Date(time.getTime() - 1000 * 60 * 60),
                    $lte: new Date(time.getTime() + 1000 * 60 * 60)
                }
            }).populate('caller receiver');
            
            exitWithContent(res, {
                user,
                relevantCases,
                testimonies,
                callRecords
            })
            return
        }*/

        exitWithContent(res, {
            user,
            relevantCases,
            testimonies
        })

        
        return

    } catch (error) {
        console.error(error);
        exitWithMessage(res, `Erreur serveur ${error}`)
        return
    }
});


userRoutes.get('/?', (req: Request, res: Response) => {
    exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});