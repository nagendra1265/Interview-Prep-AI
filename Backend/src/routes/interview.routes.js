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
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)

interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)
interviewRouter.get("/report/:interviewId/pdf", authMiddleware.authUser, interviewController.downloadInterviewReportPdfController)

module.exports= interviewRouter
