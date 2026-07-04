/*
 * N O T I F Y
 *
 * Notify using the Notification API.
 *
 */

function notify(title, options) {
    console.log('Notification permission:', Notification.permission)
    if (Notification.permission === 'default') {
        Notification.requestPermission(function (result) {
            if (result === 'granted') {
                notify(title, options)
            }
        })
    } else if (Notification.permission === 'granted') {
        const notification = new Notification(title, options)
        setTimeout(notification.close(), 4000)
    } else if (Notification.permission === 'denied') {
        console.log(title, Notification.permission)
    }
}

export default notify
