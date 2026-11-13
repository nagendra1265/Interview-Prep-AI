import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

export async function getMyResume() {
    const response = await api.get("/api/resume/");
    return response.data;
}

export async function saveMyResume(resume) {
    const response = await api.put("/api/resume/", resume);
    return response.data;
}

export async function downloadMyResumePdf() {
    const response = await api.get("/api/resume/pdf", { responseType: "blob" });
    return response.data;
}
