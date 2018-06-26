# EtherPass Browser Extension

Browser extension (Chrome, Firefox) to save your passwords to the ethereum blockchain. 
Works in a similar fashion to LastPass, but instead of storing the passwords in a private server, 
they are stored forever encrypted on the blockchain.

[Install on chrome](https://chrome.google.com/webstore/search/etherpass?hl=en-US)

Install on firefox (coming soon...)

### How to use it

The first screen you will see will ask you for a private key and a master password to sign up. 
Use a private key that holds some ether so you will be able to pay for storing your passwords. 
The master password will be used only for encrypting the private key locally so you won't need to insert it each time you open your browser.

By default the extension will use the ropsten testnet so you won't be using the real ethereum mainnet and spending real money.

The cost for storing a password in the mainnet varies with the gas price. Storing a password spends around 111238 gas.
Just for reference, the last time I tried to store a password I spent around $0.4 (US dollars).

Retrieving a password is **free**, once you pay to store it, you will never have to pay again.

### How it works

Each time you save a password, this password is encrypted using your private key and stored forever on the ethereum blockchain. 
This ensures that while you keep your private key, you will **never** lose your passwords.

### Warning
This project is still on beta, use at your own risk.

