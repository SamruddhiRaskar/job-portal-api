const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },

        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        coverLetter: {
            type: String,
            required: [true, "Cover letter is required"],
            trim: true,
            minlength: [10, "Cover letter must contain at least 10 characters"],
            maxlength: [2000, "Cover letter cannot exceed 2000 characters"]
        },

        status: {
            type: String,
            enum: ["applied", "shortlisted", "rejected", "hired"],
            default: "applied"
        }
    },
    {
        timestamps: true
    }
);

// Prevent a candidate from applying twice to the same job
applicationSchema.index(
    { job: 1, candidate: 1 },
    { unique: true }
);

module.exports = mongoose.model("Application", applicationSchema);