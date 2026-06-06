/*
  Notify using the Notification API.
*/

function notify(title, options) {
  console.log(Notification.permission);
  if (Notification.permission === 'default') {
    Notification.requestPermission(function(result) {
      if (result === 'granted') {
        notify(title, options);
      }
    })
  }
  else if (Notification.permission === 'granted') {
    var notification = new Notification(title, options);
    setTimeout(notification.close.bind(notification), 4000);
  }
  else if (Notification.permission === 'denied') {
    console.log(title, text, Notification.permission);
  }
}

export default notify
