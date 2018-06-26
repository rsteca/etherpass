import '../css/bootstrap.css'
import '../css/popup.css'
import 'bootstrap'
import 'popper.js'
import ko from 'knockout'
import App from './app'
import AES from 'crypto-js/aes'
import {getSiteHash} from './utils'
import CryptoJS from 'crypto-js'
import ethereumjsWallet from 'ethereumjs-wallet'

let checkerString = 'etherpass'


function url_domain(data) {
    // function token from https://stackoverflow.com/a/8498668
    let a = document.createElement('a')
    a.href = data
    return a.hostname;
}

let ViewModel = function() {
    this.privateKey = ko.observable('')
    this.masterPassword = ko.observable('')
    this.currentPopup = ko.observable('loading')
    this.user = ko.observable('')
    this.password = ko.observable('')
    this.domain = ko.observable('')
    this.loginError = ko.observable('')
    this.saveSuccess = ko.observable(false)
    this.encryptedPrivateKey = null
    this.encryptedCheck = null
    this.networks = ko.observableArray(['ropsten', 'mainnet'])
    this.selectedNetwork = ko.observable('ropsten')

    chrome.extension.sendMessage({getNetwork: true}, response => {
        this.selectedNetwork(response.network)
    })

    this.publicKey = ko.computed(() => {
        if (this.privateKey().length) {
            let wallet = ethereumjsWallet.fromPrivateKey(new Buffer(this.privateKey(), 'hex'))
            return '0x' + wallet.getAddress().toString('hex')
        }
        return ''
    })

    this.selectedNetwork.subscribe(network => {
        chrome.extension.sendMessage({setNetwork: true, network: network})
    })

    chrome.storage.sync.get(['encryptedPrivateKey', 'encryptedCheck'], result => {
        // get encripted private key from local storage if it exist
        if (result.encryptedPrivateKey) {
            this.encryptedPrivateKey = result.encryptedPrivateKey
            this.encryptedCheck = result.encryptedCheck
            chrome.extension.sendMessage({getPassword: true}, response => {
                // get the master password if it's set
                let masterPassword = response.password
                if (masterPassword && masterPassword.length) {
                    // decrypt private key
                    let bytes = CryptoJS.AES.decrypt(result.encryptedPrivateKey, masterPassword)
                    let privateKey = bytes.toString(CryptoJS.enc.Utf8)
                    // set private key
                    this.privateKey(privateKey)
                    this.masterPassword(masterPassword)
                    // show the "save user" popup
                    this.currentPopup('save-user')
                } else {
                    // prompt for master password to the user
                    this.currentPopup('prompt-password')
                }
            })
        } else {
            this.currentPopup('prompt-register')
        }

    })

    this.currentPopup.subscribe(currentPopup => {
        if (currentPopup === 'save-user') {
            chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, tabs => {
                let domain = url_domain(tabs[0].url)
                this.domain(domain)
            })
        }
    })

    this.register = () => {
        // save a new private key which will be used for the ethereum wallet
        // and also for encrypting saved passwords
        let privateKey = this.privateKey()
        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.slice(2, privateKey.length)
        }
        this.privateKey(privateKey)

        // encrypt the private key using the master password
        let encryptedPrivateKey = AES.encrypt(this.privateKey(), this.masterPassword()).toString()
        let encryptedCheck = AES.encrypt(checkerString, this.masterPassword()).toString()
        this.encryptedPrivateKey = encryptedPrivateKey
        this.encryptedCheck = encryptedCheck

        // save the encrypted private key to local storage
        chrome.storage.sync.set(
            {
                encryptedPrivateKey: encryptedPrivateKey,
                encryptedCheck: encryptedCheck
            },
            () => {
                chrome.extension.sendMessage({setPassword: true, password: this.masterPassword()})
                this.currentPopup('save-user')
            }
        )
    }

    this.login = () => {
        // ask for master password to decrypt the private key
        this.loginError('')
        let bytes = CryptoJS.AES.decrypt(this.encryptedCheck, this.masterPassword())
        if (checkerString !== bytes.toString(CryptoJS.enc.Utf8)) {
            this.masterPassword('')
            this.loginError('Wrong password')
            return
        } else {
            // if the master password is correct, decrypt the private key
            let privateKeyBytes = CryptoJS.AES.decrypt(this.encryptedPrivateKey, this.masterPassword())
            let privateKey = privateKeyBytes.toString(CryptoJS.enc.Utf8)
            this.privateKey(privateKey)
            chrome.extension.sendMessage({setPassword: true, password: this.masterPassword()})
            this.currentPopup('save-user')
        }
    }

    this.logout = () => {
        // forget master password
        this.masterPassword('')
        this.currentPopup('prompt-password')
        chrome.extension.sendMessage({setPassword: true, password: null})
    }

    this.saveUser = () => {
        // save an user and a password for the selected domain
        App.init(this.privateKey(), this.selectedNetwork())
        window.App = App

        let user = {
            username: this.user(),
            password: this.password()
        }

        let ciphertext = AES.encrypt(JSON.stringify(user), this.privateKey()).toString()
        let siteHash = getSiteHash(this.domain(), this.privateKey())

        // save it to the ethereum network
        App.savePassword(siteHash, ciphertext)
        this.user('')
        this.password('')
        this.saveSuccess(true)
        setTimeout(() => this.saveSuccess(false), 10000)
    }
}

window.addEventListener('load', loadEvent => {
    ko.applyBindings(new ViewModel())
})
