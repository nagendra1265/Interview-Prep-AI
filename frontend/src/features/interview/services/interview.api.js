import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

export async function createInterviewReport({ jobDescription, selfDescription, resumeFile, jobDescriptionPdf, selfDescriptionPdf }) {
    const formData = new FormData();
    formData.append(jobDescriptionPdf ? "jobDescriptionPdf" : "jobDescription", jobDescriptionPdf || jobDescription);
    formData.append(selfDescriptionPdf ? "selfDescriptionPdf" : "selfDescription", selfDescriptionPdf || selfDescription);
    formData.append("resume", resumeFile);

    const response = await api.post("/api/interview/", formData);
    return response.data;
}

export async function getMyInterviewReports() {
    const response = await api.get("/api/interview/");
    return response.data;
}

export async function getInterviewReportById(interviewId) {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
}

export async function downloadInterviewReportPdf(interviewId) {
    const response = await api.get(`/api/interview/report/${interviewId}/pdf`, {
        responseType: "blob"
    });
    return response.data;
}


export async function practiceTechnicalAnswer(reportId, questionId, answer) {
    const url = `/api/interview/report/${reportId}/technical/${questionId}`;
    const response = answer === undefined ? await api.get(url) : await api.post(url, { answer });
    return response.data;
}
