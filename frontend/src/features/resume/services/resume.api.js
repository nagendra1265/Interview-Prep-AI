import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});

export async function listMyResumes() {
    const response = await api.get("/api/resume");
    return response.data.resumes;
}

export async function getMyResume(id) {
    const response = await api.get(`/api/resume/${id}`);
    return response.data.resume;
}

export async function saveMyResume(resume) {
    const { _id, ...fields } = resume;
    const response = _id
        ? await api.put(`/api/resume/${_id}`, fields)
        : await api.post("/api/resume", fields);
    return response.data.resume;
}

export async function downloadMyResumePdf(id) {
    const response = await api.get(`/api/resume/${id}/pdf`, { responseType: "blob" });
    return response.data;
}
