import nodeCron from "node-cron";
import moment from "moment";
import { Holiday } from "../model/holidays.model.js";
import { Student } from "../model/student.model.js";

nodeCron.schedule("0 0 * * *", async () => {
  try {
    const todayDate = moment().format("YYYY-MM-DD");

    const holiday = await Holiday.findOne({ date: todayDate }).select('isTemporary isExamTime');

    if (!holiday) {
      return;
    }

    const status = holiday.isExamTime ? "examination" : "holiday";

    await Student.updateMany({}, { 
      $push: { attendanceHistory: { status, date: todayDate } }
    });

    if (holiday.isTemporary) {
      await holiday.deleteOne();
    }
    
  } catch (error) {
    console.error("Error in attendance status update job:", error);
  }
});
