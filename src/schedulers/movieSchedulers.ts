import schedule from "node-schedule";
import Movie from "#models/movie.model.js";

interface JobMap {
    [key: string]: schedule.Job;
}

const jobs: JobMap = {}; // store in-memory job references

// 🔹 Schedule a single document
export const scheduleDocument = (docId: string, expiredAt: Date) => {
    // cancel old job if exists
    if (jobs[docId]) {
        jobs[docId].cancel();
        delete jobs[docId];
    }

    if (expiredAt > new Date()) {
        const job = schedule.scheduleJob(expiredAt, async function () {
            console.log(`⏰ Movie ${docId} expired! Setting status: past`);
            await Movie.findByIdAndUpdate(docId, { status: "past" });
            delete jobs[docId];
        });

        jobs[docId] = job;
        console.log(`📅 Scheduled job for movie ${docId} at ${expiredAt}`);
    }
};

// 🔹 Restore all jobs on server restart
export const restoreSchedules = async () => {
    const docs = await Movie.find({
        status: { $ne: "past" },
        expiredAt: { $gt: new Date() },
    });

    console.log(`🔁 Restoring ${docs.length} scheduled jobs...`);
    for (const doc of docs) {
        if (doc.expiredAt) {
            scheduleDocument(doc._id.toString(), doc.expiredAt);
        }
    }
};

// 🔹 Cancel schedule when document becomes inactive (optional)
export const cancelSchedule = (docId: string) => {
    if (jobs[docId]) {
        jobs[docId].cancel();
        delete jobs[docId];
        console.log(`🗑️ Canceled schedule for movie ${docId}`);
    }
};
