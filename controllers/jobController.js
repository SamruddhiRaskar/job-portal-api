const mongoose = require("mongoose");
const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
// Create a job — employer only
const createJob = async (req, res, next) => {
    try {
        const {
            title,
            description,
            company,
            location,
            type,
            salary,
            skills
        } = req.body;

        if (
            !title ||
            !description ||
            !company ||
            !location ||
            !type ||
            salary === undefined ||
            !Array.isArray(skills) ||
            skills.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required job fields"
            });
        }

        const job = await Job.create({
            title,
            description,
            company,
            location,
            type,
            salary,
            skills,
            postedBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Job created successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
};

// Get all jobs with search, filtering, sorting, and pagination
const getJobs = async (req, res, next) => {
    try {
        const {
            search,
            location,
            type,
            skill,
            minSalary,
            sort,
            page = "1",
            limit = "10"
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !/^[1-9]\d*$/.test(page) ||
            !/^[1-9]\d*$/.test(limit) ||
            !Number.isSafeInteger(pageNumber) ||
            !Number.isSafeInteger(limitNumber) ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be positive and limit must be between 1 and 100"
            });
        }

        if (
            minSalary !== undefined &&
            (!/^\d+(\.\d+)?$/.test(minSalary) ||
                !Number.isFinite(Number(minSalary)))
        ) {
            return res.status(400).json({
                success: false,
                message: "minSalary must be a non-negative number"
            });
        }

        const filter = {
            status: "open"
        };

        // Search job title and company
        if (search) {
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: escapedSearch, $options: "i" } },
                { company: { $regex: escapedSearch, $options: "i" } }
            ];
        }

        if (location) {
            filter.location = {
                $regex: location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i"
            };
        }

        if (type) {
            if (!["full-time", "part-time", "internship", "remote"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid job type"
                });
            }

            filter.type = type;
        }

        if (skill) {
            filter.skills = {
                $regex: skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i"
            };
        }

        if (minSalary !== undefined) {
            filter.salary = {
                $gte: Number(minSalary)
            };
        }

        let sortOption = { createdAt: -1 };

        if (sort === "salary") {
            sortOption = { salary: 1 };
        } else if (sort === "-salary") {
            sortOption = { salary: -1 };
        } else if (sort === "createdAt") {
            sortOption = { createdAt: 1 };
        } else if (sort === "-createdAt") {
            sortOption = { createdAt: -1 };
        } else if (sort !== undefined) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort option"
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .populate("postedBy", "name companyName")
                .sort(sortOption)
                .skip(skip)
                .limit(limitNumber),
            Job.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNumber,
            pages: Math.ceil(total / limitNumber),
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        next(error);
    }
};

// Get one job by ID
const getJobById = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id)
            .populate("postedBy", "name companyName");

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        next(error);
    }
};

// Update a job — owner employer only
const updateJob = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own jobs"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "company",
            "location",
            "type",
            "salary",
            "skills"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                job.set(field, req.body[field]);
            }
        }

        await job.save();

        return res.status(200).json({
            success: true,
            message: "Job updated successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
};

// Close a job — owner employer only
const closeJob = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only close your own jobs"
            });
        }

        job.status = "closed";
        await job.save();

        return res.status(200).json({
            success: true,
            message: "Job closed successfully",
            data: job
        });
    } catch (error) {
        next(error);
    }
};

// Delete a job — owner employer only
const deleteJob = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own jobs"
            });
        }

        // Applications will be deleted here after the Application model is added.
        await Application.deleteMany({ job: job._id });
        await job.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Job deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Get job statistics — owner employer only
const getJobStats = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID"
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only view statistics for your own jobs"
            });
        }

        const Application = require("../models/Application");

        const applicationCounts = await Application.aggregate([
            {
                $match: {
                    job: job._id
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalApplications = applicationCounts.reduce(
            (total, item) => total + item.count,
            0
        );

        return res.status(200).json({
            success: true,
            data: {
                jobId: job._id,
                title: job.title,
                status: job.status,
                totalApplications,
                applicationCounts
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    closeJob,
    deleteJob,
    getJobStats
};