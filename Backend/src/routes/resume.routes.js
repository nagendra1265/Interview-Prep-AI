const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const resumeController = require("../controllers/resume.controller")

const resumeRouter = express.Router()
resumeRouter.use(authMiddleware.authUser)
resumeRouter.get("/", resumeController.getResume)
resumeRouter.put("/", resumeController.saveResume)
resumeRouter.get("/pdf", resumeController.downloadResumePdf)

module.exports = resumeRouter
