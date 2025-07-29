import mongoose from 'mongoose';



const teacherSchema = new mongoose.Schema({
  full_name: {
    type: String,
    trim: true,
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique:true,
    index:true
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
  subjects: [{
    type: String,
    trim: true,
    lowercase: true,
    required: true
  }],
  address: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  current_teaching_class_sections: [{
    type: String,   // M1,M2 for mgmt, S1,S2 for science, L1,S2 for law 
    trim: true,
    lowercase: true,
  }],
  role: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'teacher'
  },
  designation: {
    type: String,      // HOD 
    trim: true
  },
  qualification_experience: {
    type: String,
    trim: true,
    lowercase: true,
    required: true
  }
}, {
  timestamps: true
});

export const Teacher = mongoose.model('Teacher', teacherSchema);
