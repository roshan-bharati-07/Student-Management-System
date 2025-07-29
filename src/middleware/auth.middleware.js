import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";
const authMiddleware = (req, res, next) => {

    let token = req.cookies?.token

    const authHeader = req.headers?.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]
    }

    if (!token) {
        throw new apiError(401, "Token is not send");

    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.admin = decoded;
        if (req.admin.role !== 'admin') {
            throw new apiError(403, "Admin is only allowed");

        }
        next();
    } catch (error) {
        throw new apiError(401, "Unauthorized, token is invalid");

    }
};

export default authMiddleware;