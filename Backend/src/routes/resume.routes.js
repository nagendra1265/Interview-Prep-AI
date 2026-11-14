const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const resumeController = require("../controllers/resume.controller")

const resumeRouter = express.Router()
resumeRouter.use(authMiddleware.authUser)
resumeRouter.get("/", resumeController.getResume)
resumeRouter.post("/", resumeController.saveResume)
resumeRouter.get("/:resumeId", resumeController.getResume)
resumeRouter.put("/:resumeId", resumeController.saveResume)
resumeRouter.get("/:resumeId/pdf", resumeController.downloadResumePdf)

module.exports = resumeRouter
