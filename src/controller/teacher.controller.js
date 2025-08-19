import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Teacher } from '../model/teacher.model.js';
import { Admin } from '../model/admin.model.js';
import { generateTeacherId } from '../utils/generateCredentials.js';
import fs from 'fs/promises';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { Section } from '../model/section.model.js';

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



// this is done at the start of the session 
const updateTeacherNewSection = asyncHandler(async (req, res, next) => {

    if (!req.file) {
        return next(new apiError(400, 'File is not uploaded'));
    }

    const filePath = req.file?.path;

    let workbook;

    try {
        workbook = XLSX.readFile(filePath);
    } catch (err) {
        await fs.unlink(filePath);
        return next(new apiError(400, 'Unable to read Excel file'));
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    rows = rows
        .map(row => {
            const sections = String(row.sections || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            return {
                teacherId: String(row.id || '').trim(),
                sections,
            };
        })
        .filter(r => r.teacherId && r.sections.length);


    if (!rows.length) {
        await fs.unlink(filePath);
        return next(new apiError(400, 'No valid data found in the Excel file'));
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            for (const { teacherId, sections } of rows) {
                const teacher = await Teacher.findOneAndUpdate(
                    { teacherId },
                    {
                        $set: {
                            current_teaching_class_sections: sections,   // yo ta array ho add hunxa 
                        },
                    },
                    { new: true, session }
                );

                if (!teacher) {
                    return next(new apiError(404, 'Teacher not found'));
                }


                for (const sectionName of sections) {

                    await Section.updateOne(
                        { name: sectionName },
                        { $addToSet: { teachersEnrolled: teacher._id } },
                        { session }
                    );
                }

                // this is not imp, because teacher section is allocated before registrating student 
                // remember this is done once student started to join class not during the paper registration phase 

                // await Student.updateMany(
                //     { class_section: { $in: sections } },
                //     { $set: { didTeacherChanged: true } },
                //     { session }
                // );
            }
        });
        return res.status(200).json(
            new apiResponse(
                200,
                { updatedCount: rows.length },
                'Teachers and Section updated successfully'
            )
        );

    } catch (err) {
        return next(new apiError(500, 'Failed to update teachers and section enrolled teacher'));
    } finally {
        session.endSession();
        await fs.unlink(filePath);
    }
});

const clearEnrolledTeacher = asyncHandler(async (req, res, next) => {

    const section = await Section.updateMany({}, {
        $set: {
            teachersEnrolled: []
        }
    })

    if (section.modifiedCount === 0) {
        return next(new apiError(400, 'Failed to clear enrolled teacher'))
    }

    return res.status(200).json(
        new apiResponse(200, {}, 'enrolled teacher cleared successfully')
    );

})


// remove the teacher
const removeTeacher = asyncHandler(async (req, res, next) => {

    const { teacherId } = req.params;

    if (!teacherId) {
        return next(new apiError(400, 'Teacher ID is required'));
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const teacher = await Teacher.findByIdAndDelete(teacherId).session(session);
            if (!teacher) {
                throw new apiError(404, 'Teacher not found or already deleted');
            }

            await Admin.updateOne(
                {},
                { $pull: { teachers: teacherId } },
                { session }
            );
        });

        session.endSession();
        return res.status(200).json(
            new apiResponse(200, {}, 'Teacher deleted successfully')
        );


    } catch (error) {
        session.endSession();

        if (error instanceof apiError) {
            return next(error);
        }

        return next(new apiError(500, 'Failed to delete teacher properly'));
    }
});



export {
    registerTeacher,
    updateTeacherNewSection,
    clearEnrolledTeacher,
    removeTeacher
}