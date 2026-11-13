import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
    createInterviewReport,
    downloadInterviewReportPdf,
    getInterviewReportById,
    getMyInterviewReports
} from "../services/interview.api";
import "../services/home.scss";

function ReportSection({ title, children }) {
    return (
        <section className="report-section">
            <h3>{title}</h3>
            {children}
        </section>
    );
}

function QuestionList({ questions }) {
    if (!questions?.length) return <p className="report-empty">No questions were returned.</p>;

    return (
        <ol className="question-list">
            {questions.map((item, index) => (
                <li key={`${item.question}-${index}`}>
                    <details className="question-card">
                        <summary>{item.question}</summary>
                        <div className="question-card__details">
                            <p><strong>What it assesses:</strong> {item.intention}</p>
                            <p><strong>Answer guidance:</strong> {item.answer}</p>
                        </div>
                    </details>
                </li>
            ))}
        </ol>
    );
}

export default function Home() {
    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    const resumeInputRef = useRef(null);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const canGenerate = Boolean(jobDescription.trim() && selfDescription.trim() && resumeFile);

    function handleRemoveResume() {
        setResumeFile(null);
        if (resumeInputRef.current) resumeInputRef.current.value = "";
    }

    function handleReturnToWorkspace() {
        setReport(null);
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    useEffect(() => {
        let active = true;
        getMyInterviewReports()
            .then((data) => {
                if (active) setReports(data.interviewReports || []);
            })
            .catch(() => {
                if (active) setError("Could not load your saved reports.");
            });

        return () => {
            active = false;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!canGenerate || loading) return;

        setError("");
        setReport(null);

        setLoading(true);
        try {
            const data = await createInterviewReport({
                jobDescription,
                selfDescription,
                resumeFile
            });
            setReport(data.interviewReport);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setReports((currentReports) => [
                data.interviewReport,
                ...currentReports.filter((item) => item._id !== data.interviewReport._id)
            ]);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not generate the report. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleOpenReport(reportId) {
        setError("");
        try {
            const data = await getInterviewReportById(reportId);
            setReport(data.interviewReport);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not open this report.");
        }
    }

    async function handleDownloadPdf() {
        if (!report?._id) return;
        setPdfLoading(true);
        setError("");
        try {
            const pdfBlob = await downloadInterviewReportPdf(report._id);
            const objectUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            const safeTitle = (report.title || "interview-report").replace(/[^a-z0-9]+/gi, "-");
            link.href = objectUrl;
            link.download = `${safeTitle}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Could not download the PDF.");
        } finally {
            setPdfLoading(false);
        }
    }

    return (
        <main className={`home-page${report ? " home-page--report" : ""}`}>
            {!report ? <>
            <header className="home-header">
                <p className="eyebrow">INTERVIEW PREP</p>
                <h1>Build a focused interview plan</h1>
                <p>Share the role and your background to get tailored interview questions and a preparation roadmap.</p>
                <Link className="resume-builder-link" to="/resume">Build or edit your resume</Link>
            </header>

            <form className="interview-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Job description</span>
                    <textarea
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Paste the job description here"
                        rows={8}
                        required
                    />
                </label>

                <label className="form-field">
                    <span>Your background</span>
                    <textarea
                        value={selfDescription}
                        onChange={(event) => setSelfDescription(event.target.value)}
                        placeholder="Describe your experience, strengths, and areas you want to improve"
                        rows={5}
                        required
                    />
                </label>

                <label className="form-field">
                    <span>Resume PDF <small>(maximum 3 MB)</small></span>
                    <input
                        ref={resumeInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                        required
                    />
                </label>
                {resumeFile && (
                    <div className="selected-resume">
                        <span title={resumeFile.name}>{resumeFile.name}</span>
                        <button type="button" onClick={handleRemoveResume} aria-label="Remove selected resume">
                            Remove
                        </button>
                    </div>
                )}

                {error && <p className="form-error" role="alert">{error}</p>}

                <button className="generate-button" type="submit" disabled={!canGenerate || loading}>
                    {loading ? "Generating report..." : "Generate interview report"}
                </button>
            </form>

            <section className="saved-reports">
                <div className="saved-reports__header">
                    <div>
                        <p className="eyebrow">YOUR HISTORY</p>
                        <h2>Saved interview reports</h2>
                    </div>
                    <span>{reports.length} {reports.length === 1 ? "report" : "reports"}</span>
                </div>
                {reports.length ? (
                    <ul className="saved-reports__list">
                        {reports.map((savedReport) => (
                            <li key={savedReport._id}>
                                <button type="button" onClick={() => handleOpenReport(savedReport._id)}>
                                    <span>
                                        <strong>{savedReport.title || "Interview report"}</strong>
                                        <small>{new Date(savedReport.createdAt).toLocaleDateString()}</small>
                                    </span>
                                    <span className="saved-reports__score">
                                        {savedReport.matchScore ?? "--"}% match
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="report-empty">Your generated reports will appear here.</p>
                )}
            </section>
            </> : (
                <button className="back-button" type="button" onClick={handleReturnToWorkspace}>
                    Back to workspace
                </button>
            )}

            {report && (
                <article className="report-result" aria-live="polite">
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <header className="report-header">
                        <div>
                            <p className="eyebrow">YOUR REPORT</p>
                            <h2>{report.title || "Interview preparation report"}</h2>
                        </div>
                        <p className="score-badge">Match score: {report.matchScore ?? "--"}%</p>
                        <button className="download-button" type="button" onClick={handleDownloadPdf} disabled={pdfLoading}>
                            {pdfLoading ? "Preparing PDF..." : "Download PDF"}
                        </button>
                    </header>

                    <ReportSection title="Technical questions">
                        <p className="report-hint">Select a question to see its assessment and answer guidance.</p>
                        <QuestionList questions={report.technicalQuestions} />
                    </ReportSection>

                    <ReportSection title="Behavioral questions">
                        <p className="report-hint">Select a question to see its assessment and answer guidance.</p>
                        <QuestionList questions={report.behavioralQuestions} />
                    </ReportSection>

                    <ReportSection title="Skill gaps">
                        {report.skillGaps?.length ? (
                            <ul className="gap-list">
                                {report.skillGaps.map((gap, index) => (
                                    <li key={`${gap.skill}-${index}`}>
                                        <strong>{gap.skill}</strong><span>{gap.severity}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="report-empty">No skill gaps were returned.</p>}
                    </ReportSection>

                    <ReportSection title="Preparation plan">
                        <p className="report-hint">Each day shows its focus. Select a day to see the detailed tasks.</p>
                        {report.preparationPlan?.length ? (
                            <div className="plan-list">
                                {report.preparationPlan.map((day, index) => (
                                    <details className="plan-day" key={`${day.day}-${index}`}>
                                        <summary>
                                            <span className="plan-day__number">Day {day.day}</span>
                                            <span className="plan-day__focus">{day.focus}</span>
                                        </summary>
                                        <div className="plan-day__details">
                                            <ul>{day.tasks?.map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        ) : <p className="report-empty">No preparation plan was returned.</p>}
                    </ReportSection>
                </article>
            )}
        </main>
    );
}
