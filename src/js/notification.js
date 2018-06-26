import '../css/bootstrap.css'
import '../css/notification.css'
import 'bootstrap'
import 'popper.js'
import $ from 'jquery'
import ko from 'knockout'
import App from './app'


let ViewModel = function() {
    this.domain = ko.observable(window.location.hostname)
    this.user = ko.observable('')
    this.password = ko.observable('')
    this.showOk = ko.observable(false)

    window.addEventListener('message', event => {
        if (event.data.type === 'content_script_type') {
            this.user(event.data.user)
            this.password(event.data.password)
        }
    })

    this.saveUser = () => {
        window.postMessage(
            {
                type: 'notification_type',
                user: this.user(),
                password: this.password(),
                domain: this.domain()
            },
            '*' /* targetOrigin: any */
        )
        this.showOk(true)
        setTimeout(() => $('.notifyjs-corner').remove(), 1500)
    }

    this.cancel = () => {
        $('.notifyjs-corner').remove()
    }
}


$( document ).ready(function() {
    ko.applyBindings(new ViewModel())
})
