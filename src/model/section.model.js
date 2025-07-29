
import mongoose,{ Schema} from "mongoose"

const sectionSchema = new Schema({
    name: {
        type:String,      // save like this M-A2
        required:true,
        unique:true,
        trim:true,
        index:true
    },
    faculty: {
        type:String,
        required:true,
        trim:true
    },
    shift: {
        type:String,
        required:true,
        trim:true
    },
    subjectsTaught:[{
        type:String,
        required:true
    }],
    
    studentsEnrolled: [{
        type:Schema.Types.ObjectId,      // admin will make the change of the student and send a flag that updation is required 
        ref:"Student"
    }],

    teachersEnrolled: [{
        type:Schema.Types.ObjectId,      // admin will make the change of the teacher and send a flag that updation is required 
        ref:"Teacher"
    }],

    // isStudentChanged: {
    //     type:Boolean,
    //     required:true,
    //     default:true    // this part is for the attendence mechanism
    // }
    

}, {
    timestamps:true
})


export const Section = mongoose.model("Section", sectionSchema)

// remember, in DB Section => sections 
