const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");

// 1. Candidate applies for a job
const applyForJob = async (req, res, next) => {
try {
const { id } = req.params;
const { coverLetter } = req.body || {};


    // Validate job ID
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid job ID"
        });
    }

    // Validate cover letter
    if (
        typeof coverLetter !== "string" ||
        coverLetter.trim().length < 10
    ) {
        return res.status(400).json({
            success: false,
            message: "Cover letter must contain at least 10 characters"
        });
    }

    if (coverLetter.trim().length > 2000) {
        return res.status(400).json({
            success: false,
            message: "Cover letter cannot exceed 2000 characters"
        });
    }

    // Find the job
    const job = await Job.findById(id);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found"
        });
    }

    // Closed jobs cannot receive applications
    if (job.status !== "open") {
        return res.status(409).json({
            success: false,
            message: "This job is closed and no longer accepting applications"
        });
    }

    // Prevent duplicate applications
    const existingApplication = await Application.findOne({
        job: job._id,
        candidate: req.user.id
    });

    if (existingApplication) {
        return res.status(409).json({
            success: false,
            message: "You have already applied for this job"
        });
    }

    // Create application
    const application = await Application.create({
        job: job._id,
        candidate: req.user.id,
        coverLetter: coverLetter.trim()
    });

    return res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: application
    });
} catch (error) {
    // Handle duplicate application index errors
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "You have already applied for this job"
        });
    }

    next(error);
}


};

// 2. Candidate views their own applications
const getMyApplications = async (req, res, next) => {
try {
const applications = await Application.find({
candidate: req.user.id
})
.populate({
path: "job",
select: "title company location type salary status"
})
.sort({ createdAt: -1 });


    return res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
    });
} catch (error) {
    next(error);
}


};

// 3. Employer views applications for their own job
const getJobApplications = async (req, res, next) => {
try {
const { id } = req.params;
const { status } = req.query;


    // Validate job ID
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid job ID"
        });
    }

    // Check that the job exists
    const job = await Job.findById(id);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job not found"
        });
    }

    // Only the employer who created the job can view its applications
    if (job.postedBy.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "You can only view applications for your own jobs"
        });
    }

    // Validate optional status filter
    const allowedStatuses = [
        "applied",
        "shortlisted",
        "rejected",
        "hired"
    ];

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application status filter"
        });
    }

    const filter = { job: job._id };

    if (status) {
        filter.status = status;
    }

    const applications = await Application.find(filter)
        .populate("candidate", "name email")
        .populate("job", "title company")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
    });
} catch (error) {
    next(error);
}


};

// 4. Employer updates an application's status
const updateApplicationStatus = async (req, res, next) => {
try {
const { id } = req.params;
const { status } = req.body || {};


    // Validate application ID
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID"
        });
    }

    // Validate requested status
    const allowedStatuses = [
        "applied",
        "shortlisted",
        "rejected",
        "hired"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application status"
        });
    }

    const application = await Application.findById(id);

    if (!application) {
        return res.status(404).json({
            success: false,
            message: "Application not found"
        });
    }

    // Find the job associated with this application
    const job = await Job.findById(application.job);

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Job associated with this application was not found"
        });
    }

    // Verify that the logged-in employer owns this job
    if (job.postedBy.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "You can only update applications for your own jobs"
        });
    }

    // Define allowed status transitions
    const allowedTransitions = {
        applied: ["shortlisted", "rejected"],
        shortlisted: ["hired", "rejected"],
        rejected: [],
        hired: []
    };

    if (
        !allowedTransitions[application.status].includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: `Cannot change application status from '${application.status}' to '${status}'`
        });
    }

    application.status = status;

    await application.save();

    return res.status(200).json({
        success: true,
        message: "Application status updated successfully",
        data: application
    });
} catch (error) {
    next(error);
}


};

// 5. Candidate withdraws their own application
const withdrawApplication = async (req, res, next) => {
try {
const { id } = req.params;


    // Validate application ID
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid application ID"
        });
    }

    const application = await Application.findById(id);

    if (!application) {
        return res.status(404).json({
            success: false,
            message: "Application not found"
        });
    }

    // Only the candidate who submitted the application can withdraw it
    if (application.candidate.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "You can only withdraw your own applications"
        });
    }

    // Withdrawal is allowed only while status is applied
    if (application.status !== "applied") {
        return res.status(400).json({
            success: false,
            message: "You can only withdraw an application with status 'applied'"
        });
    }

    await application.deleteOne();

    return res.status(200).json({
        success: true,
        message: "Application withdrawn successfully"
    });
} catch (error) {
    next(error);
}


};

// Export all controller functions
module.exports = {
applyForJob,
getMyApplications,
getJobApplications,
updateApplicationStatus,
withdrawApplication
};
