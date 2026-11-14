const sections = require("../../../resume-sections.json")

function withDefaultSections(entries) {
    return [...entries, ...["education", "skills"]
        .filter(type => !entries.some(section => section.type === type))
        .map(type => ({ type, entries: [{}] }))]
}

function normalizeResume(resume) {
    if (!resume) return resume
    if (resume.sections !== undefined) return { ...resume, sections: withDefaultSections(resume.sections) }
    const order = ["summary", "experience", "education", "skills"]
    return {
        ...resume,
        sections: order.filter(type => type !== "experience" || resume[type]?.trim()).map(type => {
            const field = { summary: "text", experience: "details", education: "details", skills: "skills" }[type]
            return { type, entries: [{ [field]: resume[type] || "" }] }
        })
    }
}

function validateSections(value) {
    if (!Array.isArray(value)) throw new Error("Sections must be a list.")
    const seen = new Set()
    const validated = value.map(section => {
        const type = section?.type
        if (typeof type !== "string" || !Object.hasOwn(sections, type) || seen.has(type)) {
            throw new Error("Each resume section must have a unique, supported type.")
        }
        seen.add(type)
        if (!Array.isArray(section.entries) || section.entries.length > (type === "summary" ? 1 : 50)) {
            throw new Error("Invalid number of resume entries.")
        }
        const entries = section.entries.map(entry => {
            if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("Invalid resume entry.")
            return Object.fromEntries(Object.entries(entry).map(([field, value]) => {
                if (!Object.hasOwn(sections[type].fields, field) || typeof value !== "string" || value.length > 12000) {
                    throw new Error("Invalid resume entry field.")
                }
                return [field, value]
            }))
        })
        return { type, entries }
    })
    return withDefaultSections(validated)
}

module.exports = { sections, normalizeResume, validateSections }
