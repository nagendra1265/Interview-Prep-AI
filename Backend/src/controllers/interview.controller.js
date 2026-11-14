const pdfParse= require("pdf-parse")
const PDFDocument = require("pdfkit")
const generateInterviewReport =require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const calculateMatchScore = require("../services/match-score")
const mongoose = require("mongoose")

function reportForPractice(report) {
    return {
        ...report,
        technicalQuestions: report.technicalQuestions.map(({ question, intention }, index) => ({
            question, intention, id: index
        }))
    }
}

async function practiceTechnicalQuestion(req, res) {
    const { interviewId, questionId } = req.params
    if (!mongoose.isObjectIdOrHexString(interviewId) || !/^\d+$/.test(questionId)) {
        return res.status(404).json({ message: "Technical question not found." })
    }
    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        .select("technicalQuestions").lean()
    const question = report?.technicalQuestions?.[Number(questionId)]
    if (!question) return res.status(404).json({ message: "Technical question not found." })
    if (req.method === "GET") return res.json({ referenceAnswer: question.answer })

    const answer = req.body?.answer
    if (typeof answer !== "string" || !answer.trim() || answer.length > 4000) {
        return res.status(400).json({ message: "Enter an answer of up to 4,000 characters." })
    }
    try {
        const feedback = await generateInterviewReport.evaluateTechnicalAnswer(question, answer.trim())
        return res.json({ referenceAnswer: question.answer, feedback })
    } catch (error) {
        console.error("Technical answer evaluation failed:", error.name)
        return res.status(502).json({ message: "Could not check your answer. Try again or show the reference answer." })
    }
}

async function readPdfText(file, label) {
    const parser = new pdfParse.PDFParse(Uint8Array.from(file.buffer))
    let text
    try {
        text = (await parser.getText()).text.trim()
    } catch {
        throw new Error(`Could not read the ${label} PDF. Choose a readable PDF.`)
    } finally {
        await parser.destroy()
    }
    if (!text) throw new Error(`The ${label} PDF has no readable text.`)
    return text
}

async function readDescription(req, field, label) {
    const file = req.files?.[`${field}Pdf`]?.[0]
    if (file) {
        try {
            return await readPdfText(file, label)
        } catch (error) {
            throw new Error(`${error.message} You can paste the text instead.`)
        }
    }
    const text = req.body?.[field]
    if (typeof text !== "string" || !text.trim()) {
        throw new Error(`Enter the ${label} or upload a PDF.`)
    }
    return text.trim()
}

async function generateInterviewReportController(req, res){
    const resumeFile = req.files?.resume?.[0]
    if (!resumeFile) {
        return res.status(400).json({ message: "A resume PDF is required in the 'resume' field." })
    }

    let resume, jobDescription, selfDescription
    try {
        jobDescription = await readDescription(req, "jobDescription", "job description")
        selfDescription = await readDescription(req, "selfDescription", "self-description")
        resume = await readPdfText(resumeFile, "resume")
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }

    const { requirements, evidence, ...interviewReportByAi } = await generateInterviewReport({
        resume,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume,
        selfDescription,
        jobDescription,
        ...interviewReportByAi,
        ...calculateMatchScore(requirements, evidence, { resume, selfDescription })
    })

    res.status(201).json({
        message:"Interview report generated successfully",
        interviewReport: reportForPractice(interviewReport.toObject())
    })

}

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .select("title matchScore matchBreakdown createdAt updatedAt")
        .sort({ createdAt: -1 })

    return res.status(200).json({ interviewReports: interviewReports.map(report => ({
        _id: report._id, title: report.title, matchScore: report.matchScore,
        hasSkillScore: Boolean(report.matchBreakdown), createdAt: report.createdAt, updatedAt: report.updatedAt
    })) })
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

    return res.status(200).json({ interviewReport: reportForPractice(interviewReport.toObject()) })
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
        .text(`${report.matchBreakdown ? "Skill match" : "AI match estimate"}: ${report.matchScore == null ? "Unavailable" : `${report.matchScore}%`}`)
        .text(`Generated: ${report.createdAt.toLocaleDateString()}`)
    pdf.moveDown()

    function addSection(title) {
        pdf.moveDown(0.6)
        pdf.fillColor("#29245f").fontSize(16).text(title)
        pdf.moveDown(0.25)
    }

    function addQuestions(heading, questions, includeAnswers = true) {
        addSection(heading)
        if (!questions?.length) {
            pdf.fillColor("#555555").fontSize(10).text("No entries available.")
            return
        }

        questions.forEach((item, index) => {
            pdf.fillColor("#222222").fontSize(11).text(`${index + 1}. ${item.question || "Question"}`)
            pdf.fillColor("#555555").fontSize(9)
                .text(`Intention: ${item.intention || "Not provided"}`)
            if (includeAnswers) pdf.text(`Answer guidance: ${item.answer || "Not provided"}`)
            pdf.moveDown(0.45)
        })
    }

    addQuestions("Technical questions", report.technicalQuestions, false)
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
    practiceTechnicalQuestion,
    generateInterviewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
    downloadInterviewReportPdfController
}
