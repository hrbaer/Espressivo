/*
 *  C O N V E R T E R S E R V I C E
 *
 *  Sends a MuseScore file to the server and receives the converted file.
 *
 */

// Provides acces to a score file converter service on the Web.
export default class ConverterService {
    static url = 'https://cloud.ursamedia.ch' // The author currently offers this service

    // Converts data using the Web service.
    async convert(data, route) {
        return await this.postToURL(ConverterService.url + '/' + route, data)
    }

    // Posts data to a converter service.
    async postToURL(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            body: data,
        })
        if (response.ok) {
            return await response.arrayBuffer()
        }
    }

    // Gets the version of the remote mscore version.
    async getVersion() {
        const response = await fetch(ConverterService.url + '/mscore/version')
        if (response.ok) {
            const text = await response.text()
            return text
        }
    }
}
