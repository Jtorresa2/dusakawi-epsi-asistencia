import { Router } from 'express';
import userController from '../controllers/users.controller.js';

const userRouter = Router();

userRouter.get('/:id', userController.getUser);

export default userRouter;
