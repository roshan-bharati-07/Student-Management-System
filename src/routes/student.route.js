import express from 'express';

import {
  studentLogin,
  getStudentDetails,
  forgotPassword,
  verifyForgotPasswordCode,
  setNewPassword,
  resetPassword,
  resentVerificationCode,
  addRemainingStudentDetails,

} from '../controller/student.controller.js';

import authStudentMiddleware from '../middleware/authStudent.middleware.js';


const router = express.Router();

// Auth routes
router.post('/login', studentLogin);   // ✅
router.post('/forget-password',authStudentMiddleware, forgotPassword); // ✅
router.post('/verify-code/:code', authStudentMiddleware,verifyForgotPasswordCode); // ✅  
router.post('/set-new-password/',authStudentMiddleware, setNewPassword); // ✅
router.post('/reset-password',authStudentMiddleware, resetPassword); // ✅
router.patch('/resend-code',authStudentMiddleware, resentVerificationCode); // ✅
router.get('/profile', authStudentMiddleware, getStudentDetails); // ✅
router.patch('/add-remaining-details', authStudentMiddleware, addRemainingStudentDetails); // ✅

export default router;
