export { loadPlaylist, formatTime, totalPlayTime }

// Adds leading zeros.
function zero(t) {
    return t.toString().padStart(2, '0')
}

// Formats seconds.
function formatTime(time) {
    let secs = Math.max(time, 0)
    let s = secs % 60
    let m = Math.floor(secs / 60) % 60
    let h = Math.floor(secs / 3600)
    if (h > 0) {
        return `${h}:${zero(m)}:${zero(s)}`
    }
    return `${m}:${zero(s)}`
}

// Calculates the total duration.
function totalPlayTime(entries) {
    if (entries) {
        return entries.reduce((sum, entry) => sum + entry.time, 0)
    }
}

// Loads a playlist.
function loadPlaylist(playlistURL, eventType) {
    getPlaylist(playlistURL, eventType)
}

// Gets the playlist file name from the query string.
function getPlaylistFilename(playlistURL) {
    let search = window.location.search
    if (search.startsWith('?')) {
        search = search.substring(1)
    } else {
        search = playlistURL || 'empty.m3u'
    }
    return search
}

// Gets the playlist from a *.m3u file and sends a 'newplaylist' event.
async function getPlaylist(playlistURL, eventType) {
    const url = getPlaylistFilename(playlistURL)
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}, "${playlistURL}"`)
        }

        const text = await response.text()
        const playlist = parsePlaylist(text)

        window.dispatchEvent(
            new CustomEvent(eventType, {
                detail: { playlist: playlist, url: url },
            }),
        )
    } catch (error) {
        alert(error.message)
    }
}

// Parses the m3u8 playlist format.
function parsePlaylist(content) {
    var playlist = { entries: [] }
    var entry = {}
    var index = 1
    var lines = content.split(/\r?\n/)
    for (const line of lines) {
        if (line.startsWith('#')) {
            const info = line.split(':', 2)
            switch (info[0]) {
                case '#EXTM3U':
                    break
                case '#PLAYLIST':
                    playlist.title = info[1]
                    break
                case '#EXTINF':
                    {
                        const params = info[1].split(/,(.+)/)
                        entry.time = parseInt(params[0])
                        entry.title = params[1]
                    }
                    break
                case '#EXTALBUMARTURL':
                    entry.coverURL = info[1]
                    break
                default:
                    console.log('Not handled:', info[0])
            }
        } else {
            if (line.length > 0) {
                entry.url = line
                entry.index = index
                playlist.entries.push(entry)
                index += 1
                entry = {}
            }
        }
    }
    return playlist
}
