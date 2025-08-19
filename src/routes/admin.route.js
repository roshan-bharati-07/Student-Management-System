import express from 'express';
import {
    adminRegister,
    forgetPassword,
    logoutAdmin,
    refreshAccessToken,
    verifyForgotPasswordCode,
    adminLogin,
    setNewPassword,
    reset_password,
    getAdminDetails,
} from '../controller/admin.controller.js';

import {
    holidayController,     // remember to add the multer as a single file => middleware 
    addOtherHoliday
} from '../controller/addHoliday.controller.js';

import {
    studentRegister,
    removeStudent,
    changeStudentSections,
    searchStudent
} from '../controller/student.controller.js';

import {
    registerTeacher,
    clearEnrolledTeacher,
    updateTeacherNewSection,
    removeTeacher
} from '../controller/teacher.controller.js';

import {
    registerSection
} from '../controller/section.controller.js';

import {
    receptionistRegister
} from '../controller/receptionist.controller.js';


import authMiddleware from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

// Admin auth routes
router.post('/register', adminRegister);     
router.post('/resent-token', refreshAccessToken);   //  when access token expires, error is send and based on that new req is send without awaring client
router.post('/login', adminLogin);           
router.post('/logout', authMiddleware, logoutAdmin);   
router.post('/forget-password', authMiddleware, forgetPassword);    
router.post('/verify-code/:code', authMiddleware, verifyForgotPasswordCode);   
router.patch('/set-new-password', authMiddleware, setNewPassword);       // don't need to send as params as I can get it from cookies
router.patch('/reset-password', authMiddleware, reset_password);        
router.get('/:username/profile', authMiddleware, getAdminDetails);      


// holiday routes
router.post('/add-holiday', authMiddleware, upload.single('file'), holidayController);  
router.post('/add-other-holiday', authMiddleware, addOtherHoliday); 

// student routes
router.post('/student/register', upload.single('file'), studentRegister);   // this is for the single student registration
// for the multiple student registration 
// router.post('/student/register-batch', authMiddleware, upload.single('file'), studentRegister); 
router.patch('/change-student-section', authMiddleware, changeStudentSections); 
router.patch('/remove-student', authMiddleware, removeStudent);
router.post('/search-student', authMiddleware, searchStudent);


// teacher routes 
router.post('/teacher/register', authMiddleware, upload.single('file'), registerTeacher);
router.post('/update-teacher', authMiddleware, upload.single('file'), updateTeacherNewSection);
router.patch('/clear-enrolled-teacher', clearEnrolledTeacher);  

// receptionist routes
router.post('/receptionist/register', authMiddleware, receptionistRegister);
router.patch('/remove-teacher', authMiddleware, removeTeacher); 

// section 
router.post('/register',authMiddleware, registerSection);  

export default router;
