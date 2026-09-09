import { Router } from 'express';
import userController from '../controllers/users.controller.js';

const userRouter = Router();

userRouter.get('/:id', userController.getUser);
userRouter.get('/', userController.getUsers);
userRouter.put('/:id/basic-data', userController.updateUserBasicData);
userRouter.delete('/:id', userController.deleteUser);

export default userRouter;
