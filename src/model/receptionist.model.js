import mongoose, { Schema } from "mongoose";
import { passwordPlugin } from "../plugin/password.plugin.js";

const receptionistSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    absentStudentList: [{
        type: String,    // here saving the id of the student 
        // no required true as some times we don't have absentee student and we have to clear it twice a day 
    }]
})

passwordPlugin(receptionistSchema)

export const Receptionist = mongoose.model("Receptionist", receptionistSchema);