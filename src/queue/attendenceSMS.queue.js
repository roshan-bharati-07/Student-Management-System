import Bull from "bull";

function createBullQueue(name) {
  return new Bull(name, {
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || null,
    },
  });
}

const absentQueue = createBullQueue("absentQueue");
const smsQueue = createBullQueue("smsQueue");


async function addAbsentStudentToQueue(data) {
  console.log(data)
  await absentQueue.add("mark-absent", data, {
    attempts: 2,
    backoff: 5000,
  });
}

async function addNumbersToSMS(data) {
  await smsQueue.add('send-sms',data, {
    attempts:2,
    backoff:5000
  });
}

export {
  absentQueue,
  addAbsentStudentToQueue,
  smsQueue,
  addNumbersToSMS,
};
