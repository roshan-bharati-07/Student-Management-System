import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { passwordPlugin } from "../plugin/password.plugin.js";


const studentSchema = new Schema({

  full_name: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  studentId: {    // this is not what we save in ObjectId, it is for normal query
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  DOB: {
    type: Date,
    required: true
  },


  gender: {
    type: String,
    trim: true,
    lowercase: true,
    enum: ['male', 'female'],
    required: true
  },


  previous_school: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  obtain_grade: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  contact_number: {
    type: String,
    trim: true,
    required: true
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    unique: true
  },

  faculty: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  shift: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },
  grade: {
    type: String,
    required: true,
    default:"11"
  },

  section: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  subjects: [{
    type: String,
    trim: true,
    lowercase: true,
    required: true
  }],


  address: {          // address = current address
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  guardian_name: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  },

  guardian_contact_number: {
    type: String,
    trim: true,
    required: true
  },

  // we generate this 
  username: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  passwordChangedAt:{
    type:Date,
  },

  role: {
    type: String,
    trim: true,
    lowercase: true,
    default: "student",
    required: true
  },

  teachers: [{
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true
  }],

  verification_code: {
    type: String,
    trim: true,
    default: null
  },

  expiresIn: {
    type: Date,
    default: null
  },

  is_verified: {
    type: Boolean,
    default: false
  },


  // other basic details

  permanent_address: {
    type: String,
    trim: true,
    lowercase: true
  },

  father_name: {
    type: String,
    trim: true,
    lowercase: true
  },

  mother_name: {
    type: String,
    trim: true,
    lowercase: true
  },

  father_contact_number: {
    type: String,
    trim: true
  },

  mother_contact_number: {
    type: String,
    trim: true
  },

// once the student add other details, it become read-only, no changes can be made 
  canEditProfileByStudent: {   
    type: Boolean,
    default: true
  },


  didTeacherChanged: {
    type: Boolean,
    default: false
  },



  attendenceHistory: [{
    status: {
      type: String,
    },

    date: {
      type: Date,
    }
  }]

}, {
  timestamps: true
});

passwordPlugin(studentSchema)

studentSchema.methods.generateJwtToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.STUDENT_JWT_SECRET,
    {
      expiresIn: process.env.STUDENT_JWT_EXPIRY,
    }
  );
};

export const Student = mongoose.model("Student", studentSchema);
