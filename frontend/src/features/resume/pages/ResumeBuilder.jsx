import sectionDefinitions from "../../../../../resume-sections.json";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { downloadMyResumePdf, getMyResume, listMyResumes, saveMyResume } from "../services/resume.api";
import "../services/resume-builder.scss";

const emptyResume = {
    label: "", fullName: "", email: "", phone: "", location: "", linkedin: "", links: "",
    sections: ["education", "skills"].map(type => ({ type, entries: [{}] })), template: "modern", font: "Helvetica", theme: "ocean"
};

const themes = {
    ocean: "#256a78",
    forest: "#356b4a",
    plum: "#704477"
};

export default function ResumeBuilder() {
    const [resume, setResume] = useState(emptyResume);
    const [editing, setEditing] = useState(false);
    const [mobilePanel, setMobilePanel] = useState("edit");
    const [resumes, setResumes] = useState([]);
    const [switching, setSwitching] = useState(false);
    const [sectionToAdd, setSectionToAdd] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        listMyResumes()
            .then(savedResumes => {
                if (active) setResumes(savedResumes);
            })
            .catch((requestError) => {
                if (active) setError(requestError.response?.data?.message || "Could not load your resume.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    async function selectResume(id) {
        if (isDirty && !window.confirm("Discard unsaved changes?")) return;
        setError("");
        setMessage("");
        setSwitching(true);
        try {
            const saved = id ? await getMyResume(id) : null;
            setResume({ ...emptyResume, ...saved });
            setSectionToAdd("");
            setIsDirty(false);
            setMobilePanel("edit");
            setEditing(true);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not open this resume.");
        } finally {
            setSwitching(false);
        }
    }

    function update(field, value) {
        setResume((current) => ({ ...current, [field]: value }));
        setIsDirty(true);
        setMessage("");
    }

    function changeSection(index, entries) {
        update("sections", resume.sections.map((section, position) =>
            position === index ? { ...section, entries } : section));
    }

    function moveSection(index, offset) {
        const sections = [...resume.sections];
        [sections[index], sections[index + offset]] = [sections[index + offset], sections[index]];
        update("sections", sections);
    }

    function addSection() {
        if (!availableSections.includes(sectionToAdd)) return;
        update("sections", [...resume.sections, { type: sectionToAdd, entries: [{}] }]);
        setSectionToAdd("");
    }

    async function handleSave(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const saved = await saveMyResume(resume);
            setResume({ ...emptyResume, ...saved });
            setResumes(current => [saved, ...current.filter(item => item._id !== saved._id)]);
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
            const blob = await downloadMyResumePdf(resume._id);
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

    const availableSections = Object.keys(sectionDefinitions).filter(type => !resume.sections.some(section => section.type === type));

    if (loading) return <main className="resume-builder"><p>Loading your resume…</p></main>;

    function backToLibrary() {
        if (isDirty && !window.confirm("Discard unsaved changes?")) return;
        setIsDirty(false);
        setError("");
        setMessage("");
        setEditing(false);
    }

    if (!editing) {
        return (
            <main className="resume-builder resume-builder--library">
                <header className="resume-builder__header">
                    <div>
                        <Link to="/" className="resume-builder__back">← Interview prep</Link>
                        <h1>Your resumes</h1>
                    </div>
                    <button className="resume-builder__save" type="button" disabled={switching} onClick={() => selectResume("")}>New resume</button>
                </header>
                {error && <p className="resume-message resume-message--error" role="alert">{error}</p>}
                {switching && <p role="status">Opening resume…</p>}
                {resumes.length ? (
                    <ul className="resume-library-list">
                        {resumes.map(item => (
                            <li key={item._id}>
                                <button type="button" disabled={switching} onClick={() => selectResume(item._id)}>
                                    <span>{item.label || item.fullName || "Untitled resume"}</span>
                                    <span aria-hidden="true">→</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p>No saved resumes yet.</p>}
            </main>
        );
    }

    return (
        <main className="resume-builder">
            <div className="resume-mobile-tabs" role="group" aria-label="Workspace view">
                <button type="button" aria-pressed={mobilePanel === "edit"} onClick={() => setMobilePanel("edit")}>Edit</button>
                <button type="button" aria-pressed={mobilePanel === "preview"} onClick={() => setMobilePanel("preview")}>Preview</button>
            </div>
            <div className="resume-builder__layout" data-panel={mobilePanel}>
                <form className="resume-editor" key={resume._id || "draft"} onSubmit={handleSave} inert={saving || switching}>
                    <header className="resume-editor__header">
                        <button className="resume-builder__back" type="button" onClick={backToLibrary} disabled={saving}>← Back to resumes</button>
                        <h1>{resume.label.trim() || "Edit resume"}</h1>
                    </header>
                    <section className="editor-section">
                        <h2>Contact details</h2>
                        <label>Resume label<input value={resume.label} maxLength={100} onChange={event => update("label", event.target.value)} placeholder="For example, Backend roles" /></label>
                        <label>Full name<input value={resume.fullName} onChange={(event) => update("fullName", event.target.value)} required /></label>
                        <div className="editor-grid">
                            <label>Email<input type="email" value={resume.email} onChange={(event) => update("email", event.target.value)} /></label>
                            <label>Phone<input value={resume.phone} onChange={(event) => update("phone", event.target.value)} /></label>
                        </div>
                        <div className="editor-grid">
                            <label>Location<input value={resume.location} onChange={(event) => update("location", event.target.value)} placeholder="City, Country" /></label>
                            <label>Links<input value={resume.links} onChange={(event) => update("links", event.target.value)} placeholder="Portfolio or GitHub" /></label>
                        </div>
                        <label>LinkedIn<input value={resume.linkedin} onChange={event => update("linkedin", event.target.value)} /></label>
                    </section>

                    {resume.sections.map(({ type, entries }, index) => {
                        const { title, fields } = sectionDefinitions[type];
                        return (
                            <details className="editor-section resume-fold" key={type} open={entries.some(entry => !Object.values(entry).some(Boolean))}>
                                <summary>
                                    <span>{title}</span>
                                    {type !== "summary" && <span className="resume-fold__count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>}
                                </summary>
                                <div className="resume-fold__body">
                                <div className="resume-section-actions">
                                    <button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label={`Move ${title} up`}>Move up</button>
                                    <button type="button" disabled={index === resume.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label={`Move ${title} down`}>Move down</button>
                                    {type !== "education" && type !== "skills" && <button type="button" onClick={() => update("sections", resume.sections.filter(section => section.type !== type))} aria-label={`Remove ${title}`}>Remove section</button>}
                                </div>
                                {entries.map((entry, entryIndex) => (
                                    <fieldset className="resume-entry" key={entryIndex}>
                                        {type !== "summary" && <legend>Entry {entryIndex + 1}</legend>}
                                        {Object.entries(fields).map(([field, label]) => {
                                            const Input = ["text", "details", "contribution", "outcome", "skills"].includes(field) ? "textarea" : "input";
                                            return <label key={field}>{label}<Input maxLength={12000} value={entry[field] || ""} onChange={event => changeSection(index, entries.map((item, position) => position === entryIndex ? { ...item, [field]: event.target.value } : item))} /></label>;
                                        })}
                                        {type !== "summary" && <button type="button" onClick={() => changeSection(index, entries.filter((_, position) => position !== entryIndex))}>Remove entry</button>}
                                    </fieldset>
                                ))}
                                {entries.length < (type === "summary" ? 1 : 50) &&
                                    <button type="button" onClick={() => changeSection(index, [...entries, {}])}>{type === "summary" ? "Add summary" : "Add entry"}</button>}
                                </div>
                            </details>
                        );
                    })}

                    {availableSections.length > 0 && (
                        <section className="editor-section">
                            <label>Choose a section<select value={sectionToAdd} onChange={event => setSectionToAdd(event.target.value)}>
                                <option value="">Select a section</option>
                                {availableSections.map(type => <option key={type} value={type}>{sectionDefinitions[type].title}</option>)}
                            </select></label>
                            <button type="button" disabled={!sectionToAdd} onClick={addSection}>Add section</button>
                        </section>
                    )}

                    <details className="editor-section resume-fold">
                        <summary>Design</summary>
                        <div className="resume-fold__body">
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
                        </div>
                    </details>

                    <div className="resume-save-bar">
                    {error && <p className="resume-message resume-message--error" role="alert">{error}</p>}
                    {message && <p className="resume-message" role="status">{message}</p>}
                    <button className="resume-builder__save" type="submit" disabled={saving}>{saving ? "Saving…" : "Save resume"}</button>
                    </div>
                </form>

                <section className="resume-preview-wrap" aria-label="Live resume preview">
                    <div className="resume-preview-toolbar">
                        <h2>Live preview</h2>
                        <div className="resume-preview-actions">
                        <span className={isDirty ? "resume-status resume-status--dirty" : "resume-status"}>{isDirty ? "Unsaved changes" : resume._id ? "Saved" : "New draft"}</span>
                        <button className="resume-builder__download" type="button" onClick={handleDownload} disabled={downloading || saving || switching || isDirty || !resume._id}>
                    {downloading ? "Preparing PDF…" : isDirty ? "Save changes to download" : "Download PDF"}
                </button>
                        </div>
                    </div>
                    <div className="resume-preview-stage" tabIndex={0} aria-label="Resume page">
                    <div className={`resume-preview resume-preview--${resume.template}`} style={{ "--resume-accent": themes[resume.theme], "--resume-font": resume.font === "Times-Roman" ? "Georgia, serif" : resume.font === "Courier" ? "'Courier New', monospace" : "Arial, sans-serif" }}>
                        <header className="resume-preview__header">
                            <h2>{resume.fullName || "Your Name"}</h2>
                            <p>{[resume.email, resume.phone, resume.location, resume.linkedin, resume.links].filter(Boolean).join("  ·  ") || "Email · Phone · Location · Links"}</p>
                        </header>
                        {resume.sections.map(({ type, entries }) => {
                            const { title, fields } = sectionDefinitions[type];
                            const content = entries.map(entry => Object.keys(fields)
                                .map(field => entry[field]?.trim()).filter(Boolean).join("\n")).filter(Boolean);
                            if (!content.length) return null;
                            return <section key={type} className="resume-preview__section">
                                <h3>{title}</h3>
                                {content.map((entry, index) => <p key={index}>{entry}</p>)}
                            </section>;
                        })}
                    </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
