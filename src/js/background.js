import '../img/icon-128.png'
import '../img/icon-34.png'

window.loginInfoCache = {}

chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
    // Store master password
    if (message.setPassword) {
        window.password = message.password
    } else if (message.getPassword) {
        sendResponse({password: window.password || null})


    // Change current network
    } else if (message.setNetwork) {
        window.network = message.network
    } else if (message.getNetwork) {
        sendResponse({network: window.network || 'ropsten'})


    // Temporarly store login info from webpage
    } else if (window.password && message.setLoginInfo && sender.frameId === 0) {
        window.loginInfoCache[sender.tab.id] = {
            user: message.user,
            password: message.password,
            domain: message.domain
        }
    } else if (window.password && message.getLoginInfo && sender.frameId === 0) {
        let info = window.loginInfoCache[sender.tab.id]
        if (!info) {
            info = {noResult: true}
        } else {
            delete window.loginInfoCache[sender.tab.id]
        }
        sendResponse(info)
    }
})
