import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { generateVerificationCode } from '../utils/verificationCode.js';
import { Admin } from '../model/admin.model.js';
import { sendVerificationEmail } from '../utils/sendVerificationCode.js';
import jwt from 'jsonwebtoken';



// generate Access Token from refresh token 
const generateAccessAndRefereshTokens = async (adminId) => {

    try {
        const admin = await Admin.findById(adminId)

        const accessToken = admin.generateAccessToken()

        const refreshToken = admin.generateRefreshToken()

        admin.refreshToken = refreshToken

        await admin.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new apiError(500, "Something went wrong while generating referesh and access token")
    }
}

// account creation of admin
const adminRegister = asyncHandler(async (req, res, next) => {
    // check => is another admin alc requested to register 
    const exisitingAdmin = await Admin.findOne({ isAdmin: true });

    if (exisitingAdmin) {
        return next(new apiError(400, 'Admin already registered, please login'));
    }

    const {
        full_name,
        email,
        contact_number,
        username,
        password
    } = req.body

    if (!full_name || !email || !contact_number || !username || !password) {
        return next(new apiError(400, 'All fields are required'));
    }

    // if (!email.endsWith('@uniglobe.edu.np')) {
    if (!email) {
        return next(new apiError(400, ' email is required'));
    }

    const admin = await Admin.create({
        full_name,
        email,
        contact_number,
        username,
        password,
        isAdmin: true
    });

    if (!admin) {
        return next(new apiError(500, 'Failed to register admin'));
    }
    return res.status(200).json(
        new apiResponse(200, {}, 'Admin registered successfully')
    );

});


// admin login 
const adminLogin = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(new apiError(400, 'Username and password are required'));
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
        return next(new apiError(401, 'Invalid username'));
    }

    console.log(password)

    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
        return next(new apiError(401, 'Invalid password'));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(admin._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    admin: accessToken,
                    refreshToken
                },
                "Admin logged In Successfully"
            )
        );

});


//logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {

    await Admin.findByIdAndUpdate(
        req.admin?._id,   // this we get from the cookies parsed from middleware 
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "Admin logged Out"));

})


//regenerating new AccessToken and RefreshToken
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken


    if (!incomingRefreshToken) {
        throw new apiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const admin = await Admin.findById(decodedToken?._id)

        if (!admin) {
            throw new apiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== admin?.refreshToken) {
            throw new apiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(admin._id)

        return res.status(200).json(
            new apiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed"
            )
        );


    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }

})

// forget password
const forgetPassword = asyncHandler(async (req, res, next) => {
    const email = req.admin?.email;
    const id = req.admin?._id;

    if (!email || !id) {
        return next(new apiError(400, 'Email and ID are required'));
    }

    // Find admin by email or _id (id must be _id in MongoDB)
    const admin = await Admin.findOne({
        $or: [
            { email: email },
            { _id: id }
        ]
    });

    if (!admin) {
        return next(new apiError(404, 'No admin found with this email or ID'));
    }

    // Generate verification code and expiry time
    const verificationCode = generateVerificationCode();
    const expiresIn = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Send verification code to email
    const sendCode = await sendVerificationEmail(email, admin.full_name, verificationCode);
    if (!sendCode) {
        return next(new apiError(500, 'Failed to send verification code via email'));
    }

    // Update admin document with verification code
    admin.verification_code = verificationCode;
    admin.expiresIn = expiresIn;

    try {
        await admin.save();
    } catch (error) {
        console.log("Error saving admin:", error);
        return next(new apiError(500, 'Failed to save verification code to database'));
    }

    return res.status(200).json(
        new apiResponse(200, {}, 'Verification code sent successfully')
    );

});


// verfiy the verification code 
const verifyForgotPasswordCode = asyncHandler(async (req, res, next) => {

    const email = req.admin.email
    const code = req.params.code

    // if (!email || !code || !email.endsWith('@collegename.edu.np') || code.length !== 4) {
    if (!email || !code || code.length !== 4) {
        return next(new apiError(400, 'Email and verification code are required'));
    }

    const admin = await Admin.findOne({ email })

    if (!admin) {
        return next(new apiError(404, 'No admin found with this email'));
    }

    if (
        !admin.verification_code ||
        admin.verification_code !== code ||
        !admin.expiresIn ||
        admin.expiresIn < new Date()
    ) {

        admin.verification_code = undefined;
        admin.expiresIn = undefined;
        return next(new apiError(400, 'Invalid or expired verification code'));

    }

    admin.verification_code = undefined;
    admin.expiresIn = undefined;
    admin.is_verified = true;

    await admin.save();

    return res.status(200).json(
        new apiResponse(200, {}, 'Verification code verified successfully')
    );

});

// setting new password 
const setNewPassword = asyncHandler(async (req, res, next) => {
    const id = req.admin._id;
    const { newPassword } = req.body;

    if (!id || !newPassword) {
        return next(new apiError(400, 'ID and new password is required'));
    }

    const admin = await Admin.findById(id);

    if (!admin) {
        return next(new apiError(404, 'No admin found with this ID'));
    }

    if (!admin.is_verified) {
        return next(new apiError(400, 'Invalid attempt to change password'));
    }

    admin.password = newPassword;
    admin.is_verified = false;

    try {
        await admin.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update password'));
    }

    return res.status(200).json(
        new apiResponse(200, {}, 'Password updated successfully')
    );


});

// resetting password 
const reset_password = asyncHandler(async (req, res, next) => {
    const id = req.admin._id;
    const { newPassword, oldPassword } = req.body;

    if (!id || !newPassword || !oldPassword) {
        return next(new apiError(400, 'Id and password are required'));
    }

    const admin = await Admin.findById(id);

    if (!admin) {
        return next(new apiError(404, 'No admin found with this id'));
    }

    const isMatch = await admin.comparePassword(oldPassword);

    if (!isMatch) {
        return next(new apiError(400, 'Incorrect Password'));
    }

    admin.password = newPassword;

    try {
        await admin.save();
    } catch (error) {
        return next(new apiError(500, 'Failed to update password'));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(admin._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: accessToken,
                    refreshToken,
                },
                "Password Changed Successfully"
            )
        );


});

//get admin basic Details 
const getAdminDetails = asyncHandler(async (req, res, next) => {
    const id = req.admin._id
    console.log(id)
    if (!id) {
        return next(new apiError(400, 'id is required'));
    }
    const admin = await Admin.findById(id)
        .select(" -password -__v -_id -createdAt -updatedAt -exisitedSection -students -teachers -attendenceFailedSection -refreshToken");

    if (!admin) {
        return next(new apiError(404, 'No admin found with this id'));
    }

    return res.status(200).json(new apiResponse({
        success: true,
        message: 'Admin details retrieved successfully',
        data: admin
    }));
})


// we have teacherId to the admin as they are very less 
// so by just inputing teacherID we can get their details and make changes 

// resent verification code

const resentVerificationCode = asyncHandler(async (req, res, next) => {

    const email = req.admin.email
    const id = req.admin._id

    if (!email || !id) {
        return next(new apiError(400, 'Email and id is required'));
    }

    const admin = await Admin.findById(id);     // technically this is not required as I have only one admin 
    if (!admin) {
        return next(new apiError(404, 'No admin found with this id'));
    }

    admin.expiresIn = undefined;
    admin.verification_code = undefined;

    const verificationCode = generateVerificationCode();


    const sendCode = await sendVerificationEmail(email, admin.full_name, verificationCode);

    if (!sendCode) {
        return next(new apiError(500, 'Failed to send verification code via email'));
    }

    const expiresIn = new Date(Date.now() + 5 * 60 * 1000);
    admin.verification_code = verificationCode;
    admin.expiresIn = expiresIn;

    try {
        await admin.save();

    } catch (error) {

        return next(new apiError(500, 'Failed to update admin'));
    }

    return res.status(200).json(
        new apiResponse(200, {}, 'Verification code sent successfully')
    );



});

// update student section and class from 11 to 12 


export {
    adminRegister,
    adminLogin,
    refreshAccessToken,
    logoutAdmin,
    reset_password,
    setNewPassword,
    forgetPassword,
    verifyForgotPasswordCode,
    getAdminDetails,
    resentVerificationCode,
}

