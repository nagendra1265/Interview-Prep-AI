const mongoose = require("mongoose")

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    label: { type: String, default: "" },
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    sections: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    links: { type: String, default: "" },
    summary: { type: String, default: "" },
    experience: { type: String, default: "" },
    education: { type: String, default: "" },
    skills: { type: String, default: "" },
    template: { type: String, enum: ["modern", "classic", "compact"], default: "modern" },
    font: { type: String, enum: ["Helvetica", "Times-Roman", "Courier"], default: "Helvetica" },
    theme: { type: String, enum: ["ocean", "forest", "plum"], default: "ocean" }
}, { timestamps: true })

module.exports = mongoose.model("Resume", resumeSchema)
