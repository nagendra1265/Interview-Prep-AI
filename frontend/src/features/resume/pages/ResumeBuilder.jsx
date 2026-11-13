import { useEffect, useState } from "react";
import { Link } from "react-router";
import { downloadMyResumePdf, getMyResume, saveMyResume } from "../services/resume.api";
import "../services/resume-builder.scss";

const emptyResume = {
    fullName: "", email: "", phone: "", location: "", links: "", summary: "",
    experience: "", education: "", skills: "", template: "modern", font: "Helvetica", theme: "ocean"
};

const themes = {
    ocean: "#256a78",
    forest: "#356b4a",
    plum: "#704477"
};

export default function ResumeBuilder() {
    const [resume, setResume] = useState(emptyResume);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getMyResume()
            .then(({ resume: saved }) => {
                if (active && saved) setResume({ ...emptyResume, ...saved });
            })
            .catch((requestError) => {
                if (active) setError(requestError.response?.data?.message || "Could not load your resume.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    function update(field, value) {
        setResume((current) => ({ ...current, [field]: value }));
        setIsDirty(true);
        setMessage("");
    }

    async function handleSave(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const data = await saveMyResume(resume);
            setResume({ ...emptyResume, ...data.resume });
            setIsDirty(false);
            setMessage("Resume saved to your account.");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not save your resume.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDownload() {
        setDownloading(true);
        setError("");
        try {
            const blob = await downloadMyResumePdf();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const filename = (resume.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resume";
            link.href = url;
            link.download = `${filename}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Save your resume before downloading it.");
        } finally {
            setDownloading(false);
        }
    }

    if (loading) return <main className="resume-builder"><p>Loading your resume…</p></main>;

    return (
        <main className="resume-builder">
            <header className="resume-builder__header">
                <div>
                    <Link to="/" className="resume-builder__back">← Interview prep</Link>
                    <p className="eyebrow">RESUME STUDIO</p>
                    <h1>Build your resume</h1>
                    <p>Write your details once, then try different layouts, fonts, and colors.</p>
                </div>
                <button className="resume-builder__download" type="button" onClick={handleDownload} disabled={downloading || saving || isDirty || !resume.fullName}>
                    {downloading ? "Preparing PDF…" : isDirty ? "Save changes to download" : "Download PDF"}
                </button>
            </header>

            <div className="resume-builder__layout">
                <form className="resume-editor" onSubmit={handleSave}>
                    <section className="editor-section">
                        <h2>Contact details</h2>
                        <label>Full name<input value={resume.fullName} onChange={(event) => update("fullName", event.target.value)} required /></label>
                        <div className="editor-grid">
                            <label>Email<input type="email" value={resume.email} onChange={(event) => update("email", event.target.value)} /></label>
                            <label>Phone<input value={resume.phone} onChange={(event) => update("phone", event.target.value)} /></label>
                        </div>
                        <div className="editor-grid">
                            <label>Location<input value={resume.location} onChange={(event) => update("location", event.target.value)} placeholder="City, Country" /></label>
                            <label>Links<input value={resume.links} onChange={(event) => update("links", event.target.value)} placeholder="LinkedIn · Portfolio · GitHub" /></label>
                        </div>
                    </section>

                    <section className="editor-section">
                        <h2>Resume content</h2>
                        <label>Professional summary<textarea rows={4} value={resume.summary} onChange={(event) => update("summary", event.target.value)} placeholder="A concise introduction to your experience and strengths" /></label>
                        <label>Experience<textarea rows={7} value={resume.experience} onChange={(event) => update("experience", event.target.value)} placeholder={"Senior Developer — Acme Co. (2022–present)\nBuilt ...\nImproved ...\n\nDeveloper — Example Inc. (2020–2022)\nDelivered ..."} /></label>
                        <label>Education<textarea rows={4} value={resume.education} onChange={(event) => update("education", event.target.value)} placeholder={"B.Sc. Computer Science — University (2020)\nRelevant coursework or achievements"} /></label>
                        <label>Skills<textarea rows={3} value={resume.skills} onChange={(event) => update("skills", event.target.value)} placeholder="React, TypeScript, Node.js, PostgreSQL" /></label>
                    </section>

                    <section className="editor-section">
                        <h2>Design</h2>
                        <label>Layout<select value={resume.template} onChange={(event) => update("template", event.target.value)}>
                            <option value="modern">Modern — color header</option>
                            <option value="classic">Classic — centered header</option>
                            <option value="compact">Compact — tighter spacing</option>
                        </select></label>
                        <label>Font<select value={resume.font} onChange={(event) => update("font", event.target.value)}>
                            <option value="Helvetica">Helvetica — clean</option>
                            <option value="Times-Roman">Times — traditional</option>
                            <option value="Courier">Courier — monospaced</option>
                        </select></label>
                        <fieldset className="theme-options">
                            <legend>Accent color</legend>
                            {Object.entries(themes).map(([name, color]) => (
                                <label key={name} className={resume.theme === name ? "is-selected" : ""}>
                                    <input type="radio" name="resume-theme" value={name} checked={resume.theme === name} onChange={() => update("theme", name)} />
                                    <span style={{ backgroundColor: color }} />{name}
                                </label>
                            ))}
                        </fieldset>
                    </section>

                    {error && <p className="resume-message resume-message--error" role="alert">{error}</p>}
                    {message && <p className="resume-message" role="status">{message}</p>}
                    <button className="resume-builder__save" type="submit" disabled={saving}>{saving ? "Saving…" : "Save resume"}</button>
                </form>

                <section className="resume-preview-wrap" aria-label="Live resume preview">
                    <div className={`resume-preview resume-preview--${resume.template}`} style={{ "--resume-accent": themes[resume.theme], "--resume-font": resume.font === "Times-Roman" ? "Georgia, serif" : resume.font === "Courier" ? "'Courier New', monospace" : "Arial, sans-serif" }}>
                        <header className="resume-preview__header">
                            <h2>{resume.fullName || "Your Name"}</h2>
                            <p>{[resume.email, resume.phone, resume.location, resume.links].filter(Boolean).join("  ·  ") || "Email · Phone · Location · Links"}</p>
                        </header>
                        {[["Profile", resume.summary], ["Experience", resume.experience], ["Education", resume.education], ["Skills", resume.skills]].map(([title, content]) => (
                            <section key={title} className="resume-preview__section">
                                <h3>{title}</h3>
                                <p className={title === "Skills" ? "resume-preview__skills" : ""}>{content || `Your ${title.toLowerCase()} will appear here.`}</p>
                            </section>
                        ))}
                    </div>
                    <p className="resume-preview__caption">Live preview · Save before downloading your latest edits</p>
                </section>
            </div>
        </main>
    );
}
