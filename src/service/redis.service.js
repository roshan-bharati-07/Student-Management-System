async function saveAbsentStudent(redis, sectionName, absentList) {
  const keyName = `student:${sectionName}`;         // e.g. student:A2
  const counterKeyName = "students:count";

  // Store the absent list
  const isDataPushed = await redis.rpush(keyName, ...absentList);

  await redis.expire(keyName, 60 * 60); 

  const counter = await redis.incr(counterKeyName);

  await redis.expire(counterKeyName, 60 * 60); 
   
  if (!isDataPushed || !counter) {
    return false;
  }

  return true;
}


async function getCombineAbsentList(redis, shift = "MORNING") {
  const counterKeyName = "students:count";
  const counterString = await redis.get(counterKeyName);

  if (!counterString) {
    return;
  }

//   const counter = parseInt(counterString, 10) || 0;
//   const sectionCount = parseInt(process.env[`NUMBER_SECTIONS_${shift.toUpperCase()}_SHIFT`], 10);

//   if (counter === sectionCount) {
    const keys = await redis.keys("student:*");

    let combinedArray = [];

    for (const key of keys) {
      if (key === counterKeyName) continue;

      const allAbsentList = await redis.lrange(key, 0, -1);

      combinedArray.push(allAbsentList);
    // }

    const finalAbsentList = combinedArray.flat();

    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(counterKeyName);

    return finalAbsentList ;
  }

  return { finalAbsentList: [] };
}

export {
    saveAbsentStudent,
    getCombineAbsentList
}