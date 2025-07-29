import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Section } from '../model/section.model.js';
import { Admin } from '../model/admin.model.js';

const registerSection = asyncHandler(async (req, res,next) => {
    const {
        name, faculty, shift, subjectsTaught,
    } = req.body;

    if (!name || !faculty || !shift || !Array.isArray(subjectsTaught) || !subjectsTaught.length === 6) {
        return next(new apiError(400, 'Section name,faculty,shift and subjects are required'));
    }


    const isSectionExist = await Section.findOne({ name })

    if (isSectionExist) {
        return next(new apiError(400, 'Section already exist'));
    }

    const section = await Section.create({
        name,
        faculty,
        shift,
        subjectsTaught
    })

    if (!section) {
        return next(new apiError(400, 'Failed to create section'));
    }

    const addToAdmin = await Admin.updateOne({ $addToSet: { exisitedSection: section._id } });

    if (addToAdmin.modifiedCount === 0) {
        return next(new apiError(500, 'Failed to add teacher to admin'));
    }


return res.status(200).json(
    new apiResponse(200, {}, 'Section created successfully')
);

})

// get the enrolled student
const getEnrolledStudents = asyncHandler(async (req, res, next) => {
    const { sectionName } = req?.params;

    if (!sectionName) {
        return next(new apiError(400, 'Section Name is required'));
    }


    const section = await Section.findOne({ name: sectionName }).populate({
        path: 'studentsEnrolled',
        select: 'full_name studentId', // Only select necessary fields
    });

    if (!section) {
        return next(new apiError(400, 'Failed to get section'));
    }

    if (!section.studentsEnrolled || section.studentsEnrolled.length === 0) {
        return next(new apiError(400, 'No enrolled student found'));
    }

  return res.status(200).json(
    new apiResponse(200, section.studentsEnrolled, 'Enrolled students fetched successfully')
);

});


export {
    getEnrolledStudents,
    registerSection,
}

