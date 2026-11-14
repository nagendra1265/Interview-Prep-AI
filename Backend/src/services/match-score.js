const aliases = {
    "nodejs": "node.js", "node js": "node.js", "reactjs": "react", "react.js": "react",
    "js": "javascript", "ts": "typescript", "mongo": "mongodb"
}

function normalize(text) {
    return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim()
}

function canonical(skill) {
    const name = normalize(skill)
    return Object.hasOwn(aliases, name) ? aliases[name] : name
}

function mentions(quote, skill) {
    const names = [skill, ...Object.keys(aliases).filter(alias => aliases[alias] === skill)]
    return names.some(name => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        return new RegExp(`(?:^|[^\\p{L}\\p{N}_+#])${escaped}(?![\\p{L}\\p{N}_+#]|\\.[\\p{L}\\p{N}])`, "u").test(quote)
    })
}

const credit = { demonstrated: 1, mentioned: 0.5, missing: 0 }

function calculateMatchScore(requirements, evidence, sources) {
    const normalizedSources = { resume: normalize(sources.resume), selfDescription: normalize(sources.selfDescription) }
    const strongest = new Map()
    for (const item of evidence) {
        const skill = canonical(item.skill)
        const quote = normalize(item.quote)
        if (!skill || !quote || !normalizedSources[item.source].includes(quote) || !mentions(quote, skill)) continue
        if (credit[item.level] > (credit[strongest.get(skill)?.level] ?? 0)) strongest.set(skill, item)
    }

    const seen = new Set()
    function scoreGroup(skills) {
        const result = []
        for (const name of skills) {
            const skill = canonical(name)
            if (!skill || seen.has(skill)) continue
            seen.add(skill)
            const item = strongest.get(skill)
            result.push(item ? { skill, level: item.level, quote: item.quote, source: item.source } : { skill, level: "missing" })
        }
        return result
    }

    const required = scoreGroup(requirements.required)
    const preferred = scoreGroup(requirements.preferred)
    const coverage = group => group.reduce((sum, item) => sum + credit[item.level], 0) / group.length
    let matchScore = null
    if (required.length && preferred.length) matchScore = Math.round(70 * coverage(required) + 30 * coverage(preferred))
    else if (required.length || preferred.length) matchScore = Math.round(100 * coverage(required.length ? required : preferred))
    return { matchScore, matchBreakdown: { required, preferred } }
}

module.exports = calculateMatchScore
