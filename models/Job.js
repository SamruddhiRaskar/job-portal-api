const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Job title is required"],
            trim: true,
            minlength: [2, "Job title must contain at least 2 characters"],
            maxlength: [150, "Job title cannot exceed 150 characters"]
        },

        description: {
            type: String,
            required: [true, "Job description is required"],
            trim: true,
            minlength: [10, "Description must contain at least 10 characters"]
        },

        company: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },

        location: {
            type: String,
            required: [true, "Job location is required"],
            trim: true
        },

        type: {
            type: String,
            required: [true, "Job type is required"],
            enum: ["full-time", "part-time", "internship", "remote"]
        },

        salary: {
            type: Number,
            required: [true, "Salary is required"],
            min: [1, "Salary must be greater than zero"]
        },

        skills: {
            type: [String],
            required: true,
            validate: {
                validator: function (skills) {
                    return (
                        Array.isArray(skills) &&
                        skills.length > 0 &&
                        skills.every(
                            (skill) =>
                                typeof skill === "string" &&
                                skill.trim().length > 0
                        )
                    );
                },
                message: "Provide at least one valid skill"
            }
        },

        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open"
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);