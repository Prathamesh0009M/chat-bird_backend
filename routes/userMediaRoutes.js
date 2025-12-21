import express from 'express';
const router = express.Router();
// Placeholder controller functions
import { uploadMedia, getUserMedia } from '../controllers/userMediaController.js';  
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js'; // Import the multer config from Step 1
import { updateUserProfile } from '../controllers/user.js';

// Route to upload user media
router.post('/upload', auth,upload.single('file'), uploadMedia);
// Route to get user media
router.get('/:userId/media', auth, getUserMedia);
// router.get('/files', auth, getUserMedia);
router.post("/updateProfilePicture", auth, upload.single('profilePicture'), updateUserProfile);
export default router;
