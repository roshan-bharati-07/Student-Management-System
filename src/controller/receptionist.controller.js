// get the array of the absent student 
// query on the db and get the 
// name,class,faculty and parents name + contact number
// send contact number to SMS bull if parent didn't receive the call


import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Student } from '../model/student.model.js';
import { Receptionist } from '../model/receptionist.model.js';
import { addNumbersToSMS } from '../queue/attendenceSMS.queue.js';


const fetchAbsentStudentDetails = asyncHandler(async (_, res, next) => {   // get use 

    const receptionist = await Receptionist.find({});
    console.log(receptionist)

    if (!receptionist) {
        return next(new apiError(400, 'Failed to get receptionist'));
    }


    const absentStudentDetails = await Student.find({
        _id: {
            $in: receptionist[0].absentStudentList
        }
    }).select({
        full_name: 1,
        class_section: 1,
        faculty: 1,
        guardian_name: 1,
        guardian_contact_number: 1,
        _id:0
    })


    if (!absentStudentDetails || absentStudentDetails.length === 0) {
        return next(new apiError(400, 'Failed to get absent student details'));
    }

    return res.status(200).json(
    new apiResponse(200, absentStudentDetails, 'Absent student details fetched successfully')
);

})


const sendSMS = asyncHandler(async (req, res, next) => {
    const {
        guardian_contact_number,
        guardian_name,
        name,
        class_section,
        faculty
    } = req.body

    const message = ` Hello ${guardian_name},
     ${name} is absent today.
    Class: ${class_section}
    Faculty: ${faculty}
    
    please contact the school on ${process.env.COLLEGE_CONTACT_NUMBER} 
    as soon as possible.

    Best regards,
    ${process.env.COLLEGE_NAME}`


    if (!guardian_contact_number || !guardian_name || !name || !class_section || !faculty) {
        return next(new apiError(400, 'Guardian contact number is required'));
    }

    // send SMS via BULL SMS QUEUE 
    await addNumbersToSMS.add({ guardian_contact_number, message });


 return res.status(200).json(
    new apiResponse(200, {}, 'SMS sent successfully')
);

})


const clearAbsenteeList = asyncHandler(async (_, res, next) => {

    const receptionist = await Receptionist.updateOne({}, {
        $set: {
            absentStudentList: []
        }
    })

    if (receptionist.modifiedCount === 0) {
        return next(new apiError(400, 'Failed to clear absentee list'));
    }

  return res.status(200).json(
    new apiResponse(200, {}, 'Absent student list cleared successfully')
);

})


const receptionistLogin = asyncHandler(async (req, res, next) => {
    const {
        username,
        password
    } = req.body;

    if (!username || !password) {
        return next(new apiError(400, 'username and password is required'))
    }

    const receptionist = await Receptionist.findOne({
        username
    })

    if (!receptionist) {
        return next(new apiError(400, 'receptionist not found'))
    }

    if (!receptionist.comparePassword(password)) {
        return next(new apiError(400, 'password is incorrect'))
    }

return res.status(200).json(
    new apiResponse(200, {}, 'receptionist logged in successfully')
);

})




export {
    fetchAbsentStudentDetails,
    sendSMS,
    clearAbsenteeList,
    receptionistLogin
}