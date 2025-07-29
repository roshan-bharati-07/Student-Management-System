import mongoose from "mongoose"

const holidaySchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    date: {
        type: String,      // save like this Year-Month-Day
        required: true,
        index:true     // based on the date we get the holiday 
    },

    isTemporary: {
        type: Boolean,
        required: true,
        default:false,
    },

    isExamTime: {        // if this is true, we will mark student record as Examination
        type: Boolean,
        default:false
    },
})

export const Holiday = mongoose.model("Holiday", holidaySchema)