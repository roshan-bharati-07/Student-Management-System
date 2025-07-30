import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './src/db/index.db.js';
import studentRoutes from './src/routes/student.route.js';
import teacherRoutes from './src/routes/teacher.route.js';
import adminRoutes from './src/routes/admin.route.js'
import sectionRoutes from './src/routes/section.route.js';
import attendenceRoutes from './src/routes/attendence.route.js';
import receptionistRoutes from './src/routes/receptionist.route.js';

import './src/jobs/removeStudent.job.js';
import './src/jobs/checkHolidays.job.js';
import './src/worker/attendence.worker.js';
import './src/worker/sms.worker.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


try {
    connectDB();
} catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
}

app.use(cors({
       origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN,

    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
}));

app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true }));   // for form 


app.get('/', (_, res) => {
    res.send('Welcome to the Student Management System API');
});

app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/admin', adminRoutes);
app.use('/section', sectionRoutes);
app.use('/attendence', attendenceRoutes);
app.use('/receptionist', receptionistRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});
