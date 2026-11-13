import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

export async function createInterviewReport({ jobDescription, selfDescription, resumeFile }) {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
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

