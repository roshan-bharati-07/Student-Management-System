import { smsQueue } from "../queue/attendenceSMS.queue.js";


smsQueue.process(async (job) => {
  const { to, message } = job.data;

  const response = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });

  console.log("SMS sent successfully:", response.sid);
});
