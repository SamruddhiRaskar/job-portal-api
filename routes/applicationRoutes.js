const express = require("express");

const {
getMyApplications,
updateApplicationStatus,
withdrawApplication
} = require("../controllers/applicationController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Candidate views their own applications
router.get(
"/my",
protect,
authorize("candidate"),
getMyApplications
);

// Employer updates an application's status
router.patch(
"/:id/status",
protect,
authorize("employer"),
updateApplicationStatus
);

// Candidate withdraws their own application
router.delete(
"/:id",
protect,
authorize("candidate"),
withdrawApplication
);

module.exports = router;
