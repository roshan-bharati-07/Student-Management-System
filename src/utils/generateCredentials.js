import { Student } from "../model/student.model.js";
import {Teacher} from "../model/teacher.model.js";

function getRandomTwoDigitNumber() {
  return Math.floor(Math.random() * 50 + 1).toString().padStart(2, '0');
}
function getRandomSixDigitID() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // always 6 digits
}

export async function generateTeacherId() {
    let unique = false;
    let teacherId;

    while (!unique) {
        teacherId = Math.floor(1000 + Math.random() * 9000).toString();

        const exists = await Teacher.exists({ teacherId }); 

        if (!exists) {
            unique = true;
        }
    }

    return teacherId;
}

export async function generateUsernameAndId(name) {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '');

  let username, studentId;
  let exists = true;

  while (exists) {
    const randomNum = getRandomTwoDigitNumber();
    username = cleanName + randomNum;
    studentId = getRandomSixDigitID();

    exists = await Student.exists({
      $or: [
        { username },
        { studentId }
      ]
    });
  }

  const password = process.env.DEFAULT_PASSWORD_FOR_STUDENT;
  const generateEmail = `${username}@collegename.edu.np`;

  return { username, password, generateEmail, studentId };
}
