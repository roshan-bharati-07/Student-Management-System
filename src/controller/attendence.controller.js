import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { saveAbsentStudent, getCombineAbsentList } from '../service/redis.service.js';
import { Receptionist } from '../model/receptionist.model.js';
import { redisClient } from '../config/redis.config.js';
import { addAbsentStudentToQueue } from '../queue/attendenceSMS.queue.js';
import { Section } from '../model/section.model.js';
import { Holiday } from '../model/holidays.model.js';

const sendAbsentStudent = asyncHandler(async (req, res, next) => {

  const holiday = await Holiday.findOne({
    date: new Date().toISOString().split('T')[0],
  })

  if(holiday){
    return next(new apiError(400, 'Holiday'));
  }

  const { sectionName, absentStudentArray } = req.body;

  if (!sectionName || !Array.isArray(absentStudentArray) || absentStudentArray.length === 0) {
    return next(new apiError(400, 'Section Name and Absent Student Array is required'));
  }
    const section = await Section.findOne({ name: sectionName });

  if (!section) {
    return next(new apiError(400, 'Failed to get section'));
  }

  const isAbsentStudentRecord = await saveAbsentStudent(redisClient, sectionName, absentStudentArray);

  if (!isAbsentStudentRecord) {
    return next(new apiError(400, 'Failed to save absent student record'));
  }

return res.status(200).json(
  new apiResponse(200, {}, 'Absent student record saved successfully')
);

});

const getCombineAbsentStudentList = asyncHandler(async (_, res, next) => {

  const finalAbsentList = await getCombineAbsentList(redisClient);


  if (!Array.isArray(finalAbsentList) || finalAbsentList.length === 0) {
    return next(new apiError(400, 'Failed to get combined absent student list'));
  }

  const receptionist = await Receptionist.findOne({});

  if (!receptionist) {
    return next(new apiError(400, 'Failed to get receptionist'));
  }

  await Receptionist.updateOne(
    {},
    {
      $set: {
        absentStudentList: finalAbsentList,
      },
    }
  );

  const absentIds = finalAbsentList


  await addAbsentStudentToQueue({absentIds});

 return res.status(200).json(
  new apiResponse(200, {}, 'Absent student marked successfully')
);

});

export { sendAbsentStudent, getCombineAbsentStudentList };
