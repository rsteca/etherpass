import sha256 from 'crypto-js/sha256'

export function getSiteHash(domain, privateKey) {
    // use the first 7 chars of the private key to anonymize the domain
    let first7Chars = privateKey.slice(0, 7)
    let siteHash = sha256(domain + first7Chars).toString()
    // problems with string encoding in javascript doesn't allow me to use the full hash
    // get only the first 32 chars for storing in the contract
    return siteHash.slice(0, 32)
}
