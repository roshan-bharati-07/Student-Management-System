import { absentQueue } from "../queue/attendenceSMS.queue.js";
import { Student } from "../model/student.model.js";

absentQueue.process("mark-absent", async (job) => {
  try {
    const { absentIds } = job.data;

    if (!Array.isArray(absentIds)) {
      throw new Error("Invalid absentIds data");
    }

    const currentDate = new Date();

    await Student.updateMany(
      { _id: { $nin: absentIds } },
      {
        $push: {
          attendenceHistory: {
            status: "present",
            date: currentDate,
          },
        },
      }
    );

    if (absentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: absentIds } },
        {
          $push: {
            attendenceHistory: {
              status: "absent",
              date: currentDate,
            },
          },
        }
      );
    }

    console.log(`Attendance history updated for job ${job.id}`);
  } catch (error) {
    console.error(`Attendance processing failed for job ${job.id}:`, error);
    throw error;
  }
});
