import express from 'express';
import {
    getEnrolledStudents,
    registerSection
} from '../controller/section.controller.js';

const router = express.Router();

router.post('/register', registerSection);  
router.get('/enrolled-students/:sectionName', getEnrolledStudents) 

export default router;