import Router from "express"
const route = Router()

import {
    sendSMS,
    clearAbsenteeList,
    receptionistLogin,
    fetchAbsentStudentDetails,
} from "../controller/receptionist.controller.js";



route.post('/send-sms', sendSMS)
route.patch('/clear-absentee-list', clearAbsenteeList)
route.post('/receptionist/login', receptionistLogin)
route.get('/fetch-absent-student-details', fetchAbsentStudentDetails)

export default route