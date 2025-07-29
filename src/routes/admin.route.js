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
    updateTeacherNewSection,
    changeStudentSections,
    clearEnrolledTeacher,
    receptionistRegister
} from '../controller/admin.controller.js';

import authMiddleware from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

// Admin auth routes
router.post('/register', adminRegister);      // ✅
router.post('/login', adminLogin);            // ✅
router.post('/resent-token', refreshAccessToken);    // ✅ :: when access token expires, error is send and based on that new req is send without awaring client
router.post('/logout', authMiddleware, logoutAdmin);    // ✅
router.post('/forget-password', authMiddleware, forgetPassword);     // ✅
router.post('/verify-code/:code', authMiddleware, verifyForgotPasswordCode);    // ✅
router.patch('/set-new-password', authMiddleware, setNewPassword);       //  ✅ ::don't need to send as params as I can get it from cookies
router.patch('/reset-password', authMiddleware, reset_password);         // ✅
router.get('/:username/profile', authMiddleware, getAdminDetails);       // ✅
router.post('/update-teacher',upload.single('file'),updateTeacherNewSection);  
router.patch('/change-student-section',authMiddleware, changeStudentSections);  // ✅
router.patch('/clear-enrolled-teacher', clearEnrolledTeacher);  // ✅
router.post('/receptionist/register', receptionistRegister);  

export default router;
