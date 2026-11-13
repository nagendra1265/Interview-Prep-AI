const pdfParse= require("pdf-parse")
const PDFDocument = require("pdfkit")
const generateInterviewReport =require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const mongoose = require("mongoose")

async function generateInterviewReportController(req, res){
    if (!req.file) {
        return res.status(400).json({ message: "A resume PDF is required in the 'resume' field." })
    }

    const { selfDescription, jobDescription } = req.body
    if (!jobDescription || !selfDescription) {
        return res.status(400).json({ message: "Both selfDescription and jobDescription are required." })
    }

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAi
    })

    res.status(201).json({
        message:"Interview report generated successfully",
        interviewReport
    })

}

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .select("title matchScore createdAt updatedAt")
        .sort({ createdAt: -1 })

    return res.status(200).json({ interviewReports })
}

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    return res.status(200).json({ interviewReport })
}

async function downloadInterviewReportPdfController(req, res, next) {
    const { interviewId } = req.params
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    const report = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id
    })

    if (!report) {
        return res.status(404).json({ message: "Interview report not found." })
    }

    const fileStem = (report.title || "interview-report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "interview-report"

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileStem}.pdf\"`)

    const pdf = new PDFDocument({ size: "A4", margin: 48 })
    pdf.on("error", next)
    pdf.pipe(res)

    pdf.fillColor("#29245f").fontSize(22).text(report.title || "Interview Preparation Report")
    pdf.moveDown(0.4)
    pdf.fillColor("#333333").fontSize(11)
        .text(`Match score: ${report.matchScore ?? "Not available"}%`)
        .text(`Generated: ${report.createdAt.toLocaleDateString()}`)
    pdf.moveDown()

    function addSection(title) {
        pdf.moveDown(0.6)
        pdf.fillColor("#29245f").fontSize(16).text(title)
        pdf.moveDown(0.25)
    }

    function addQuestions(heading, questions) {
        addSection(heading)
        if (!questions?.length) {
            pdf.fillColor("#555555").fontSize(10).text("No entries available.")
            return
        }

        questions.forEach((item, index) => {
            pdf.fillColor("#222222").fontSize(11).text(`${index + 1}. ${item.question || "Question"}`)
            pdf.fillColor("#555555").fontSize(9)
                .text(`Intention: ${item.intention || "Not provided"}`)
                .text(`Answer guidance: ${item.answer || "Not provided"}`)
            pdf.moveDown(0.45)
        })
    }

    addQuestions("Technical questions", report.technicalQuestions)
    addQuestions("Behavioral questions", report.behavioralQuestions)

    addSection("Skill gaps")
    if (report.skillGaps?.length) {
        report.skillGaps.forEach((gap) => {
            pdf.fillColor("#333333").fontSize(10).text(`- ${gap.skill} (${gap.severity})`)
        })
    } else {
        pdf.fillColor("#555555").fontSize(10).text("No entries available.")
    }

    addSection("Preparation plan")
    if (report.preparationPlan?.length) {
        report.preparationPlan.forEach((day) => {
            pdf.fillColor("#222222").fontSize(11).text(`Day ${day.day}: ${day.focus}`)
            pdf.fillColor("#555555").fontSize(10)
            const tasks = day.tasks || []
            tasks.forEach((task) => pdf.text(`- ${task}`))
            pdf.moveDown(0.4)
        })
    } else {
        pdf.fillColor("#555555").fontSize(10).text("No entries available.")
    }

    pdf.end()
}

module.exports = {
    generateInterviewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
    downloadInterviewReportPdfController
}
