const PDFDocument = require("pdfkit")
const resumeModel = require("../models/resume.model")

const allowed = {
    template: ["modern", "classic", "compact"],
    font: ["Helvetica", "Times-Roman", "Courier"],
    theme: ["ocean", "forest", "plum"]
}

const themeColors = {
    ocean: "#256a78",
    forest: "#356b4a",
    plum: "#704477"
}

const contentFields = ["fullName", "email", "phone", "location", "links", "summary", "experience", "education", "skills"]

function getResumeInput(body) {
    const result = {}
    for (const field of contentFields) {
        if (body[field] !== undefined) result[field] = String(body[field]).slice(0, 12000)
    }
    for (const field of Object.keys(allowed)) {
        if (body[field] !== undefined) {
            if (!allowed[field].includes(body[field])) {
                const error = new Error(`Invalid ${field} option.`)
                error.status = 400
                throw error
            }
            result[field] = body[field]
        }
    }
    return result
}

async function getResume(req, res) {
    const resume = await resumeModel.findOne({ user: req.user.id }).lean()
    return res.status(200).json({ resume })
}

async function saveResume(req, res) {
    const data = getResumeInput(req.body)
    if (!data.fullName?.trim()) {
        return res.status(400).json({ message: "Full name is required." })
    }
    const resume = await resumeModel.findOneAndUpdate(
        { user: req.user.id },
        { $set: data, $setOnInsert: { user: req.user.id } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json({ message: "Resume saved.", resume })
}

async function downloadResumePdf(req, res, next) {
    try {
        const resume = await resumeModel.findOne({ user: req.user.id })
        if (!resume) return res.status(404).json({ message: "Save your resume before downloading it." })

        const accent = themeColors[resume.theme] || themeColors.ocean
        const compact = resume.template === "compact"
        const classic = resume.template === "classic"
        const margin = compact ? 34 : 48
        const pdf = new PDFDocument({ size: "A4", margin })
        const fileName = (resume.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resume"
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`)
        pdf.on("error", next)
        pdf.pipe(res)

        if (resume.template === "modern") {
            pdf.rect(0, 0, 595.28, 132).fill(accent)
            pdf.fillColor("#ffffff").font(resume.font).fontSize(25).text(resume.fullName, margin, 38, { width: 595.28 - margin * 2 })
            pdf.fontSize(9).text([resume.email, resume.phone, resume.location, resume.links].filter(Boolean).join("  |  "), margin, 78, { width: 595.28 - margin * 2 })
            pdf.y = 154
        } else {
            pdf.fillColor(accent).font(resume.font).fontSize(classic ? 24 : 21)
            pdf.text(resume.fullName, { align: classic ? "center" : "left" })
            pdf.moveDown(0.35)
            pdf.fillColor("#555555").fontSize(9)
                .text([resume.email, resume.phone, resume.location, resume.links].filter(Boolean).join("  |  "), { align: classic ? "center" : "left" })
            pdf.moveDown(1)
        }

        const sections = [
            ["Profile", resume.summary],
            ["Experience", resume.experience],
            ["Education", resume.education],
            ["Skills", resume.skills]
        ]
        for (const [title, content] of sections) {
            if (!content?.trim()) continue
            pdf.moveDown(compact ? 0.45 : 0.75)
            pdf.fillColor(accent).font(resume.font).fontSize(compact ? 12 : 14).text(title.toUpperCase())
            pdf.moveDown(0.25)
            pdf.fillColor("#252a31").fontSize(compact ? 9 : 10.5).text(content.trim(), { lineGap: compact ? 1 : 3 })
        }
        pdf.end()
    } catch (error) {
        next(error)
    }
}

module.exports = { getResume, saveResume, downloadResumePdf }
