
import express from 'express';
import {
  registerTeacher
} from '../controller/teacher.controller.js';

const router = express.Router();

router.post('/register', registerTeacher);    // ✅

export default router;
