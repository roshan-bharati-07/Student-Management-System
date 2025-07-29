import mongoose, { Schema } from "mongoose";
import { passwordPlugin } from "../plugin/password.plugin.js";
import jwt from "jsonwebtoken";

const adminSchema = new Schema({
  full_name: {
    type: String,
    trim: true,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  contact_number: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },

  username: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    required: true,
    default: "admin"
  },

  isAdmin: {
    type: Boolean,
    required: true,
    default:false
  },

  // for JWT
  refreshToken: {
    type: String
  },

  // isLoginMade: {
  //   type: Boolean,
  //   default: false
  // },

  teachers: [{
    type: Schema.Types.ObjectId,
    ref: "Teacher"
  }],


  students: [{
    type: Schema.Types.ObjectId,
    ref: "Student"
  }],


  attendenceFailedSection: [{
    type: String,
  }],


  exisitedSection: [{
    type: Schema.Types.ObjectId,
    ref: "Section"
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


  
}, {
  timestamps: true
});

// hash password 
passwordPlugin(adminSchema);

// generating accesstoken
adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

// generating refreshtoken
adminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

// admin must be only one => so validation based on if isAdmin is true
adminSchema.index({ isAdmin: 1 }, { unique: true, partialFilterExpression: { isAdmin: true } });



export const Admin = mongoose.model("Admin", adminSchema);