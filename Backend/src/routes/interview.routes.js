const express =require("express");
const authMiddleware= require("../middlewares/auth.middleware")
const interviewController= require("../controllers/interview.controller")
const upload= require("../middlewares/file.middleware")
const interviewRouter=express.Router();

/**
 * @route POST /api/interview
 * @description cgenerate interview report on the basis of user self description, resume PDF and job description.
 * @access private
 */
const uploadReportFiles = upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescriptionPdf", maxCount: 1 },
    { name: "selfDescriptionPdf", maxCount: 1 }
])

interviewRouter.post("/", authMiddleware.authUser, (req, res, next) => {
    uploadReportFiles(req, res, error => {
        if (!error) return next()
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Each PDF must be 3 MB or smaller."
            : "Could not upload the report files."
        return res.status(400).json({ message })
    })
}, interviewController.generateInterviewReportController)

interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)
interviewRouter.get("/report/:interviewId/pdf", authMiddleware.authUser, interviewController.downloadInterviewReportPdfController)

interviewRouter.route("/report/:interviewId/technical/:questionId")
    .get(authMiddleware.authUser, interviewController.practiceTechnicalQuestion)
    .post(authMiddleware.authUser, interviewController.practiceTechnicalQuestion)

module.exports= interviewRouter
