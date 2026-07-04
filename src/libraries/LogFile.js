/*
 *  L O G F I L E
 *
 *  Collects information and log data for each visited score file.
 *
 */

export default class LogFile {
    constructor() {
        this.content = []
    }

    openEntry() {
        this.entry = { logs: [] }
        this.content.push(this.entry)
        this.entry.startDate = Date.now()
    }

    closeEntry() {
        this.entry.stopDate = Date.now()
    }

    addComposer(composer) {
        this.entry.composer = composer
    }

    addTitles(titles) {
        this.entry.titles = titles
    }

    addVerses(verses) {
        this.entry.verses = verses
    }

    addDate() {
        this.entry.date = Date.now()
    }

    addFilename(filename) {
        this.entry.filename = filename
    }

    addLog(log) {
        const trimmedLog = log.trim()
        if (trimmedLog.length > 0) {
            this.entry.logs.push(trimmedLog)
        }
    }

    deleteEntries() {
        this.content.splice(0)
    }
}
