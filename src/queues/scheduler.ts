import { Queue } from "bullmq";
import { redisConnection } from "../env";

const schedulerQueue = new Queue("scheduler", {
  connection: redisConnection,
  defaultJobOptions: {
    backoff: {
      type: "exponential",
    },
  },
});

export default schedulerQueue;
