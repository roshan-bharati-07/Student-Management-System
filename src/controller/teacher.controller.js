import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Teacher } from '../model/teacher.model.js';
import { Admin } from '../model/admin.model.js';
import { generateTeacherId } from '../utils/generateCredentials.js';


const registerTeacher = asyncHandler(async (req, res, next) => {
    const {
        full_name,
        email,
        contact_number,
        subjects,
        address,
        role,
        designation,
        qualification_experience
    } = req.body;

    if (
        !full_name ||
        !email ||
        !contact_number ||
        !subjects ||
        !Array.isArray(subjects) ||
        subjects.length === 0 ||
        !address ||
        !role ||
        !qualification_experience
    ) {
        return next(new apiError(400, 'All fields are required and subjects must be an array'));
    }

    // if (!email.endsWith('@uniglobe.edu.np')) {
    //     return next(new apiError(400, 'Email must be from the institution domain'));
    // }

    const existingTeacher = await Teacher.findOne({
        $or: [{ contact_number }, { email }]
    });

    if (existingTeacher) {
        return next(new apiError(409, 'Teacher already registered'));
    }
    
    const teacherId = await generateTeacherId();
 
    if(!teacherId) {
        return next(new apiError(500, 'Failed to generate teacher ID'));
    }

    const teacher = await Teacher.create({
        full_name,
        teacherId,
        email,
        contact_number,
        subjects,
        address,
        role,
        designation,
        qualification_experience
    });

    if (!teacher) {
        return next(new apiError(500, 'Failed to register teacher'));
    }

    const addToAdmin = await Admin.updateOne({ $addToSet: {teachers: teacher._id } });

    if (addToAdmin.modifiedCount === 0) {
        return next(new apiError(500, 'Failed to add teacher to admin'));
    }

 return res.status(200).json(
    new apiResponse(200, {}, 'Teacher registered successfully')
);

}); 

export {
    registerTeacher
}