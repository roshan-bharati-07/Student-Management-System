import jwt from "jsonwebtoken";
import { Student } from "../model/student.model.js";
import apiError from "../utils/apiError.js";

const authStudentMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    const authHeader = req.headers?.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return next(new apiError(401, "Unauthorized, token is not sent"));
    }

    const decoded = jwt.verify(token, process.env.STUDENT_JWT_SECRET);
    req.student = decoded;

    const student = await Student.findById(req.student._id);

    if (student.passwordChangedAt) {
      const passwordChangedTime = parseInt(
        student.passwordChangedAt.getTime() / 1000,
        10
      );
      if (decoded.iat < passwordChangedTime) {
        return next(new apiError(401, "Unauthorized, token is not sent"));
      }
    }

    next();
  } catch (error) {
    return next(new apiError(401, "Unauthorized, token is not sent"));
  }
};

export default authStudentMiddleware;
