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

caseRoutes.get('/search', async (req: Request, res: Response) => {
    const query = req.query.q as string;

    try{
        const case_content = await Case.find({ title: new RegExp(query, 'i') }).populate("location")
        if (!case_content || case_content.length == 0){
            return exitWithMessage(res, "Cas non trouvé", 404);
        }
        exitWithContent(res, case_content)
        return
    } catch(err){
        exitWithMessage(res, `${err}`)
        return
    }
});

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

// /user/123?time=14:00&location=Paris
caseRoutes.get('/:id/details', (req: Request, res: Response) => {
    const id = req.params.id;
    const format = req.query.format;
    exitWithMessage(res, `Case ID: ${id}, Format: ${format}`, HttpStatus.OK)
});


caseRoutes.get('/?', (req: Request, res: Response) => {
    exitWithMessage(res, `Tu es perdu...`, HttpStatus.OK)
});