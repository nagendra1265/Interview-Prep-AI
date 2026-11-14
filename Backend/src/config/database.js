const mongoose =require("mongoose")
const Resume = require("../models/resume.model")

async function connectToDB(){
    try{
    await mongoose.connect(process.env.MONGO_URI)
    await Resume.syncIndexes()

    console.log("Connected to Database")
    }
    catch(err){
        throw err
    }
}

module.exports=connectToDB
