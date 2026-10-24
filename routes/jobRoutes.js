const express = require("express");

const {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    closeJob,
    deleteJob,
    getJobStats
} = require("../controllers/jobController");

const {
    applyForJob,
    getJobApplications
} = require("../controllers/applicationController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: list jobs
router.get("/", getJobs);

// Employer: statistics (must come before /:id)
router.get(
    "/:id/stats",
    protect,
    authorize("employer"),
    getJobStats
);

// Employer: view applications for a job
router.get(
    "/:id/applications",
    protect,
    authorize("employer"),
    getJobApplications
);

// Candidate: apply for a job
router.post(
    "/:id/apply",
    protect,
    authorize("candidate"),
    applyForJob
);

// Public: get one job
router.get("/:id", getJobById);

// Employer: create a job
router.post(
    "/",
    protect,
    authorize("employer"),
    createJob
);

// Employer: update a job
router.put(
    "/:id",
    protect,
    authorize("employer"),
    updateJob
);

// Employer: close a job
router.patch(
    "/:id/close",
    protect,
    authorize("employer"),
    closeJob
);

// Employer: delete a job
router.delete(
    "/:id",
    protect,
    authorize("employer"),
    deleteJob
);

module.exports = router;