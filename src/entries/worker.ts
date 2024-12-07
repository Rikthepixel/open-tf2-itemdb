import { Job, Worker } from "bullmq";
import { redisConnection } from "../env";

import updateCheck from "../jobs/update-check";
import updateEconItems from "../jobs/update-econ-items";

const updaterQueueHandlers = new Map<string, (job: Job) => any>([
  [updateCheck.name, updateCheck],
  [updateEconItems.name, updateEconItems],
]);

new Worker(
  "updater",
  async (job) => await updaterQueueHandlers.get(job.name)?.(job),
  { connection: redisConnection },
);

new Worker(
  "itemdb",
  async (job) => {
    console.log(job.name, job.data)
  },
  { connection: redisConnection },
);
