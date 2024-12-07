import { FlowProducer, Queue } from "bullmq";
import { redisConnection } from "../env";

/**
 * Jobs that are supposed to fetch updated information
 */
const updaterQueue = new Queue("updater", {
  connection: redisConnection,
  defaultJobOptions: {
    backoff: {
      type: "exponential",
    },
  },
});

export const flowProducer = new FlowProducer({
  connection: redisConnection,
});

export default updaterQueue;
