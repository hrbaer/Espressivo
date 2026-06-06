/*
  Get the input device configuration.
*/

function parseHex(hex) {
    return parseInt(hex, 16)
}

async function hidconfig(vendorId, productId, connection) {
    const response = await fetch('./hidconfig.json')
    if (response.ok) {
        const json = await response.json()
        const config = json.find((e) => {
            return (
                parseHex(e.vendorId) == vendorId &&
                parseHex(e.productId) == productId &&
                (e.connection == connection || e.connection == null)
            )
        })
        return config
    }
}

export default hidconfig
