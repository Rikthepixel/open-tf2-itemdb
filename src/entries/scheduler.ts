import updaterQueue from "../queues/updater";

updaterQueue.upsertJobScheduler("updateCheck", {
  every: 10 * 60 * 1000, // 10 Minutes
});
