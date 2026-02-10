import { Router } from 'express';
import { updateUserAvatar } from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.use(authenticate);

router.patch('/users/me/avatar', upload.single('avatar'), updateUserAvatar);

export default router;
