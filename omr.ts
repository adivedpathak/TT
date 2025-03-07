import { Router } from 'express';
import { catchError } from '../middlewares/catchError';
import { storeOMRResults } from '../controllers/OMRcontroller';

const omrRouter = Router();

omrRouter.post('/', catchError(storeOMRResults));

export { omrRouter };