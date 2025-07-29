import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { Holiday } from '../model/holidays.model.js';

import xlsx from "xlsx";    // for reading excel file

const holidayController = asyncHandler(async (req, res, next) => {

    const { file } = req.file.path;

    if (!file) {
        return next(new apiError(400, 'File is required'));
    }

    const workbook = xlsx.readFile(file);
    console.log(workbook)

    const sheetName = workbook.SheetNames[0];
    console.log(sheetName)

    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(data)

    const bulkOps = data.map(row => ({
        updateOne: {
            filter: { date: new Date(row.date) },
            update: {
                $set: {
                    name: row.name,
                    isTemporary: row.isTemporary === "true" || row.isTemporary === true,
                    isExamTime: row.isExamTime === "true" || row.isExamTime === true
                }
            },
            upsert: true
        }
    }));

    await Holiday.bulkWrite(bulkOps);

    if (bulkOps.length === 0) {
        return next(new apiError(400, 'No data found in the file'));
    }


    return res.status(200).json(
        new apiResponse(200, {}, 'Holiday Added Successfully')
    );


})

const addOtherHoliday = asyncHandler(async (req, res, next) => {
    const {
        date,
        name,
        isTemporary,
        isExamTime
    } = req.body;


    const holiday = await Holiday.create({
        date,
        name,
        isTemporary,
        isExamTime
    })

    if (!holiday) {
        return next(new apiError(400, 'Failed to add holiday'));
    }

    return res.status(200).json(
        new apiResponse(200, {}, "Holiday Added Successfully")
    );


})


export {
    holidayController,     // remember to add the multer as a single file => middleware 
    addOtherHoliday
}
