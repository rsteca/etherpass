import $ from 'jquery'
import App from './app'
import {getSiteHash} from './utils'
import CryptoJS from 'crypto-js'
import AES from 'crypto-js/aes'
import 'notifyjs-browser'
import ko from 'knockout'


function getNetwork(callback) {
    chrome.extension.sendMessage({getNetwork: true}, response => {
        callback(response.network)
    })
}

function getPrivateKey(callback) {
    // get the password to decrypt the private key
    chrome.extension.sendMessage({getPassword: true}, response => {
        if (!response.password) {
            return
        }
        let password = response.password

        // get the encrypted private key from local storage
        chrome.storage.sync.get(['encryptedPrivateKey'], result => {
            // decrypt the private key and execute callback
            let bytes = CryptoJS.AES.decrypt(result.encryptedPrivateKey, password)
            let privateKey = bytes.toString(CryptoJS.enc.Utf8)
            callback(privateKey)
        })
    })
}

function checkExistingUser(callback) {
    getPrivateKey(privateKey => {
        getNetwork(network => {
            // Initialize truffle App
            App.init(privateKey, network)

            // get the hash of the website hostname
            let siteHash = getSiteHash(window.location.hostname, privateKey)

            // look in the blockchain if there is a stored password for this site
            App.getPassword(siteHash).then(function(ciphertext) {
                if (ciphertext) {
                    // bingo! we have a password, now decrypt it with the private key
                    let bytes = CryptoJS.AES.decrypt(ciphertext, privateKey)
                    let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
                    callback(decryptedData)
                } else {
                    callback(null)
                }
            })
        })
    })
}

function fillUserData() {
    checkExistingUser(userData => {
        if (userData) {
            // fill the form (if any) with the user and password
            let passwordInput = $('input[type=password]')
            passwordInput.css({
                background: "yellow",
                border: "3px red solid"
            })
            passwordInput.val(userData.password)
            let usernameInput = passwordInput.closest('form').find('input[type=text]')
            usernameInput.val(userData.username)
        }
    })

}

function saveUser(username, password, domain) {
    getPrivateKey(privateKey => {
        getNetwork(network => {
            App.init(privateKey, network)
            window.App = App

            let user = {
                username: username,
                password: password
            }
            let ciphertext = AES.encrypt(JSON.stringify(user), privateKey).toString()

            let siteHash = getSiteHash(domain, privateKey)
            App.savePassword(siteHash, ciphertext)
        })
    })
}

function notifySaveLoginInfo() {
    chrome.extension.sendMessage({getLoginInfo: true}, response => {
        if (!response || response.noResult) {
            return
        }
        checkExistingUser(userData => {
            if (userData && userData.username === response.user
                && userData.password === response.password) {
                return
            }
            // show notification
            $.notify({}, {
              style: 'foo',
              autoHide: false,
              clickToHide: false
            })

            // send user and password to notification
            setTimeout(()=> {
                window.postMessage(
                    {
                        type: 'content_script_type',
                        user: response.user,
                        password: response.password,
                        domain: response.domain,
                    },
                    '*' /* targetOrigin: any */
                )
            }, 500)
        })
    })
}


window.addEventListener('load', loadEvent => {
    // set the notification style
    $.get(chrome.extension.getURL('/notification.html'), function(data) {
        $.notify.addStyle('foo', {html: data})
    })

    // check if the user wants to save a login info
    window.addEventListener('message', event => {
        if (event.data.type === 'notification_type') {
            saveUser(event.data.user, event.data.password, event.data.domain)
        }
    })

    // if a form is submited, show a notification
    $('form').submit(function(event) {
        let password = $(this).find('input[type=password]').val()
        let user = $(this).find('input[type=text]').val()

        chrome.extension.sendMessage({
            setLoginInfo: true,
            domain: window.location.hostname,
            user: user,
            password: password
        })
    })

    fillUserData()
    setTimeout(() => notifySaveLoginInfo(), 2000)
})
