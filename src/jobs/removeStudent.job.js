import cron from 'node-cron';
import mongoose from 'mongoose';
import { Student } from '../model/student.model.js';
import { Admin } from '../model/admin.model.js';
import { Section } from '../model/section.model.js';

cron.schedule('0 0 0 * * *', async () => { 
// cron.schedule('0 */2 * * * *', async () => {   
  // for every 2 minutes */2
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      
      const oldStudents = await Student.find({
        createdAt: { $lte: twoYearsAgo }
      }, '_id').session(session);

    //  const oldStudents = await Student.find({}, '_id').limit(5).session(session);  => for testing

      if (oldStudents.length === 0) {
        console.log('No old students to delete.');
        return;
      }

      const oldStudentIds = oldStudents.map(s => s._id);

      const result = await Student.deleteMany({
        _id: { $in: oldStudentIds }
      }).session(session);

      await Admin.updateOne(
        {},
        { $pull: { students: { $in: oldStudentIds } } },
        { session }
      );

      await Section.updateMany(
        { enrolled_students: { $in: oldStudentIds } },
        {
          $pull: { enrolled_students: { $in: oldStudentIds } },
          $set: { isStudentChanged: true }
        },
        { session }
      );

      console.log(`${result.deletedCount} old students deleted successfully.`);
    });
  } catch (error) {
    console.error("Failed to delete old students", error);
  } finally {
    session.endSession();
  }
});
