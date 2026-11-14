const { isObjectIdOrHexString } = require("mongoose")
const PDFDocument = require("pdfkit")
const resumeModel = require("../models/resume.model")

const { sections, normalizeResume, validateSections } = require("../services/resume-sections")

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

const contentFields = ["fullName", "email", "phone", "location", "linkedin", "links", "summary", "experience", "education", "skills"]

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
    if (typeof body.label === "string") result.label = body.label.trim().slice(0, 100)
    if (body.sections !== undefined) result.sections = validateSections(body.sections)
    return result
}

function ownedResume(req) {
    const { resumeId } = req.params
    if (!isObjectIdOrHexString(resumeId)) return null
    return { _id: resumeId, user: req.user.id }
}

function resumeNotFound(res) {
    return res.status(404).json({ message: "Resume not found." })
}

async function getResume(req, res) {
    if (!req.params.resumeId) {
        const resumes = await resumeModel.find({ user: req.user.id })
            .select("label fullName updatedAt")
            .sort({ updatedAt: -1, _id: -1 }).lean()
        return res.json({ resumes })
    }
    const query = ownedResume(req)
    const resume = query && await resumeModel.findOne(query).lean()
    if (!resume) return resumeNotFound(res)
    return res.json({ resume: normalizeResume(resume) })
}

async function saveResume(req, res) {
    let data
    try {
        data = getResumeInput(req.body || {})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    if (!data.fullName?.trim()) {
        return res.status(400).json({ message: "Full name is required." })
    }
    if (!req.params.resumeId) {
        const resume = await resumeModel.create({ ...data, user: req.user.id })
        return res.status(201).json({ message: "Resume created.", resume: normalizeResume(resume.toObject()) })
    }
    const query = ownedResume(req)
    const resume = query && await resumeModel.findOneAndUpdate(query, { $set: data }, {
        new: true, runValidators: true
    }).lean()
    if (!resume) return resumeNotFound(res)
    return res.json({ message: "Resume saved.", resume: normalizeResume(resume) })
}

async function downloadResumePdf(req, res, next) {
    try {
        const query = ownedResume(req)
        const resume = query && normalizeResume(await resumeModel.findOne(query).lean())
        if (!resume) return resumeNotFound(res)

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
            pdf.fontSize(9).text([resume.email, resume.phone, resume.location, resume.linkedin, resume.links].filter(Boolean).join("  |  "), margin, 78, { width: 595.28 - margin * 2 })
            pdf.y = 154
        } else {
            pdf.fillColor(accent).font(resume.font).fontSize(classic ? 24 : 21)
            pdf.text(resume.fullName, { align: classic ? "center" : "left" })
            pdf.moveDown(0.35)
            pdf.fillColor("#555555").fontSize(9)
                .text([resume.email, resume.phone, resume.location, resume.linkedin, resume.links].filter(Boolean).join("  |  "), { align: classic ? "center" : "left" })
            pdf.moveDown(1)
        }

        for (const { type, entries } of resume.sections) {
            const { title, fields } = sections[type]
            const content = entries.map(entry => Object.keys(fields)
                .map(field => entry[field]?.trim()).filter(Boolean).join("\n"))
                .filter(Boolean).join("\n\n")
            if (!content) continue
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
