import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Student } from '../model/student.model.js';
import { generateUsernameAndId } from '../utils/generateCredentials.js';
import { sendCredentialsEmail } from '../utils/credentialsMailStudent.js';
import { sendVerificationEmail } from '../utils/sendVerificationCode.js';
import { generateVerificationCode } from '../utils/verificationCode.js';
import { Teacher } from '../model/teacher.model.js';
import { Section } from '../model/section.model.js';
import { Admin } from '../model/admin.model.js';


const generateJwtToken = async (studentId) => {
    try {
        const student = await Student.findById(studentId);
        const token = student.generateJwtToken()
        return token
    } catch (error) {
        return new apiError(400, 'Failed to generate token');
    }

}


// student register
const studentRegister = asyncHandler(async (req, res, next) => {
    const {
        full_name,
        DOB,
        gender,
        previous_school,
        obtain_grade,
        contact_number,
        email,
        faculty,
        class_section,
        address,
        guardian_name,
        role,
        shift,
        guardian_contact_number
    } = req.body;


    if (
        !full_name ||
        !DOB ||
        !gender ||
        !previous_school ||
        !obtain_grade ||
        !contact_number ||
        !email ||
        !faculty ||
        !class_section ||
        !guardian_name ||
        !shift ||
        !address ||
        !guardian_contact_number
    ) {
        return next(new apiError(400, 'All fields are required and subject must be an array of 6'));
    }

    const existingStudent = await Student.findOne({
        $or: [{ contact_number }, { email }]
    });

    if (existingStudent) {
        return next(new apiError(400, 'Student already registered'));
    }

    const section = await Section.findOne({ name: class_section });

    if (!section) {
        return next(new apiError(404, 'Section not found'));
    }

    const subjects = section.subjectsTaught;

    if (!Array.isArray(subjects) || subjects.length !== 6) {
        return next(new apiError(400, 'Subject must be an array of 6'));
    }

    const teachers = section.teachersEnrolled


    if (!teachers || teachers.length === 0) {
        return next(new apiError(400, 'No teacher assigned to this section'));
    }

    const { username, password, generateEmail, studentId } = await generateUsernameAndId(full_name);    //username for user login && studentId for admin work and attendence

    const student = await Student.create({
        full_name,
        DOB,
        gender,
        previous_school,
        obtain_grade,
        contact_number,
        // email: generateEmail,
        email,
        faculty,
        subjects,
        class_section,
        guardian_name,
        address,
        role,
        shift,
        teachers,
        guardian_contact_number,
        username,
        password,
        studentId,
    });


    if (!student) {
        return next(new apiError(500, 'Failed to register student'));
    }

    // here using mongoose.session() is worthy 

    const addStudentToSection = await section.updateOne({ $addToSet: { studentsEnrolled: student._id } });

    if (addStudentToSection.modifiedCount === 0) {
        return next(new apiError(500, 'Failed to add student to section, Try Again'));
    }

    const addToAdmin = await Admin.updateOne({ $addToSet: { students: student._id } });

    if (addToAdmin.modifiedCount === 0) {
        return next(new apiError(500, 'Failed to add student to admin, Try Again'));
    }

    const sendCredentialsViaEmail = await sendCredentialsEmail(email, full_name, username, password, generateEmail);

    if (!sendCredentialsViaEmail) {
        await Student.findByIdAndDelete(student._id);
        return next(new apiError(500, 'Account created but Email failed. Try again'));
    }

return res.status(201).json(
    new apiResponse(201, {}, "Student register and Credentials sent successfully")
);


});


// student login 
const studentLogin = asyncHandler(async (req, res, next) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return next(new apiError(400, 'Username and password are required'));
    }

    const student = await Student.findOne({ username });

    if (!student) {
        return next(new apiError(401, 'Invalid username'));
    }

    const isPasswordMatch = await student.comparePassword(password);

    if (!isPasswordMatch) {
        return next(new apiError(401, 'Invalid password'));
    }

    try {
        await student.save();
    } catch (error) {
        console.log(error);
    }

    const token = await generateJwtToken(student._id);


    const options = {
        httpOnly: true,
        secure: true
    }

    // send as cookie and response 
 return res
    .status(200)
    .cookie("token", token, options)
    .json(
        new apiResponse(
            200,
            { student: token },
            "Student logged In Successfully"
        )
    );

});

// forget password and sent the verificatio code in email 
const forgotPassword = asyncHandler(async (req, res, next) => {
    const email = req.student.email
    const id = req.student._id

    // if (!email || !email.endsWith('@collegename.edu.np')) {
    if (!email || !id) {
        return next(new apiError(400, 'School email and id is required'));
    }

    const student = await Student.findOne({
        $or: [
            { email: email },
            { _id: id }
        ]
    });

    if (!student) {
        return next(new apiError(404, 'No student found with this email and id'));
    }

    const verificationCode = generateVerificationCode();

    const sendCode = await sendVerificationEmail(email, student.full_name, verificationCode);

    if (!sendCode) {
        return next(new apiError(500, 'Failed to send verification code via email'));
    }

    const expiresIn = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    student.verification_code = verificationCode;
    student.expiresIn = expiresIn;

    try {
        await student.save();

    } catch (error) {
        console.log(error)
    }

return res.status(200).json(
    new apiResponse(200, {}, 'Verification code to forget password sent successfully')
);

});

// verify the code sent in email
const verifyForgotPasswordCode = asyncHandler(async (req, res, next) => {
    const id = req.student._id
    const code = req.params.code

    // if (!email || !code || !email.endsWith('@collegename.edu.np') || code.length !== 4) {
    if (!id || !code || code.length !== 4) {
        return next(new apiError(400, 'id and verification code are required'));
    }

    const student = await Student.findById(id);

    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }

    if (
        !student.verification_code ||
        student.verification_code !== code ||
        !student.expiresIn ||
        student.expiresIn < new Date()
    ) {

        student.verification_code = undefined;
        student.expiresIn = undefined;
        return next(new apiError(400, 'Invalid or expired verification code'));

    }

    student.verification_code = undefined;
    student.expiresIn = undefined;
    student.is_verified = true;

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to verify code'));
    }
    return res.status(200).json(
        new apiResponse(200, {}, 'Verification code is valid')
    );

});

// set new password when code is verified 
const setNewPassword = asyncHandler(async (req, res, next) => {

    const id = req.student._id;
    const { newPassword } = req.body;

    if (!id || !newPassword) {
        return next(new apiError(400, 'ID and new password is required'));
    }


    const student = await Student.findById(id);

    if (!student) {
        return next(new apiError(404, 'No student found with this ID'));
    }

    console.log(student.is_verified);

    if (!student.is_verified) {
        return next(new apiError(400, 'Invalid attempt to change password'));
    }

    student.password = newPassword;
    student.passwordChangedAt = Date.now();

    student.is_verified = false;

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update password'));
    }

    const token = await student.generateJwtToken();

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("token", token, options)
        .json(
            new apiResponse(
                200,
                { student: token },
                "Password set successfully"
            )
        );

});

// reset password 
const resetPassword = asyncHandler(async (req, res, next) => {
    const id = req.student._id;
    const { newPassword, oldPassword } = req.body;

    if (!id || !newPassword || !oldPassword) {
        return next(new apiError(400, 'ID and password are required'));
    }

    const student = await Student.findById(id);

    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }

    const isMatch = await student.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new apiError(400, 'Invalid Password'));
    }

    student.password = newPassword;
    student.passwordChangedAt = Date.now();

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update password'));
    }

    const token = await student.generateJwtToken();

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("token", token, options)
        .json(
            new apiResponse(
                200,
                { student: token },
                "Password reset successfully"
            )
        );

});

// get and update the teacher details in teacher array 
const updateTeacherDetails = asyncHandler(async (req, res, next) => {

    const id = req.student._id

    if (!id) {
        return next(new apiError(400, 'Student ID is required'));
    }

    const student = await Student.findById(id);
    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }

    if (!student.didTeacherChanged) {
        return next(new apiError(400, 'Teacher has not changed'));
    }

    const section = await Section.findOne({ name: student.class_section });
    if (!section) {
        return next(new apiError(404, 'No section found with this name'));
    }

    student.teachers = section.teachersEnrolled

    if ((student.teachers).length === 0) {
        return next(new apiError(400, 'No teacher found in this section'));
    }

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update teacher details'));

    }


    return res.status(200).json(
        new apiResponse(200, {}, 'Teacher details retrieved and student updated successfully')
    );

});

// adding other student details like parents name, like this 
const addRemainingStudentDetails = asyncHandler(async (req, res, next) => {

    const id = req.student._id;

    if (!id) {
        return next(new apiError(400, 'Student ID is required'));
    }

    const student = await Student.findById(id)

    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }


    // student can update their profile only once 
    if (!student.canEditProfileByStudent) {
        return next(new apiError(400, 'You cannot edit your profile anymore'));
    }

    const {
        permanent_address,
        father_name,
        mother_name,
        father_contact_number,
        mother_contact_number
    } = req.body;

    if (!permanent_address || !father_name || !mother_name || !father_contact_number || !mother_contact_number) {
        return next(new apiError(400, 'All fields are required'));
    }

    student.permanent_address = permanent_address;
    student.father_name = father_name;
    student.mother_name = mother_name;
    student.father_contact_number = father_contact_number;
    student.mother_contact_number = mother_contact_number;

    student.canEditProfileByStudent = false;

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update student profile'));
    }


    return res.status(200).json(
        new apiResponse(200, {}, 'Student profile updated successfully')
    );


});

//get the student details
const getStudentDetails = asyncHandler(async (req, res, next) => {

    const id = req.student._id;

    if (!id) {
        return next(new apiError(400, 'Id is required'));
    }

    const student = await Student.findById(id)
        .populate('teacher', 'full_name email contact_number subjects address designation qualification_experience')
        .select('-password -verification_code -expiresIn -is_verified -username -role -current_teaching_class_sections -createdAt -updatedAt -__v');

    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }

    // here for teacher we can runt the aggregation pipeline to extract the data rather than populating 
    // const result = Student.aggregate([
    //     {
    //         $lookup: {
    //             from:'teachers',       // schema name Teacher = teachers in mongoose 
    //             localField:'teacher',
    //             foreignField:'_id',
    //             as:'teacherDetails'
    //         }
    //     }, 
    //     {
    //     $project: {
    //         full_name:1,
    //         email:1,
    //         contact_number:1,
    //         address:1,
    //         subjects:1,
    //         designation:1,
    //         qualification_experience:1
    //     }
    // }
    // ]) 

    try {
        await student.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to retrieve student profile'));
    }
    return res.status(200).json(
        new apiResponse(200, student, 'Student profile retrieved successfully')
    );

});

// resent verification code 
const resentVerificationCode = asyncHandler(async (req, res, next) => {

    const email = req.student.email
    const id = req.student._id

    if (!email || !id) {
        return next(new apiError(400, 'Email is required'));
    }

    const student = await Student.findById(id);
    if (!student) {
        return next(new apiError(404, 'No student found with this id'));
    }

    student.expiresIn = undefined;
    student.verification_code = undefined;

    const verificationCode = generateVerificationCode();


    const sendCode = await sendVerificationEmail(email, student.full_name, verificationCode);

    if (!sendCode) {
        return next(new apiError(500, 'Failed to send verification code via email'));
    }

    const expiresIn = new Date(Date.now() + 5 * 60 * 1000);
    student.verification_code = verificationCode;
    student.expiresIn = expiresIn;

    try {
        await student.save();

    } catch (error) {

        return next(new apiError(500, 'Failed to update student'));
    }

    return res.status(200).json(
        new apiResponse(200, {}, 'Verification code sent successfully')
    );



});


export {
    studentRegister,
    studentLogin,
    forgotPassword,
    verifyForgotPasswordCode,
    setNewPassword,
    resetPassword,
    addRemainingStudentDetails,
    getStudentDetails,
    resentVerificationCode,
    updateTeacherDetails
};
