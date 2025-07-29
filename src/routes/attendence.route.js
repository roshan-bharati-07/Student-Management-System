import Router from "express"
const router = Router();

import {
    sendAbsentStudent, getCombineAbsentStudentList 
} from "../controller/attendence.controller.js";

router.post('/send-absent-student', sendAbsentStudent);
router.get('/get-combine-absent-student-list', getCombineAbsentStudentList); 

export default router;