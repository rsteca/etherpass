import Web3 from "web3"
import $ from "jquery"
import TruffleContract from "truffle-contract"
import EtherpassArtifact from "../truffle/build/contracts/Etherpass.json"

import ethereumjsWallet from 'ethereumjs-wallet'
import ProviderEngine from 'web3-provider-engine'
import FilterSubprovider from 'web3-provider-engine/subproviders/filters'
import WalletSubprovider from 'web3-provider-engine/subproviders/wallet'
import Web3Subprovider from 'web3-provider-engine/subproviders/web3'


let infura_apikey = 'IN64xokKGrFdfNSqh0bp'

let App = {
    web3Provider: null,
    contracts: {},
    address: null,
    web3: null,

    init: function(privateKey, network='ropsten') {
        return App.initWeb3(privateKey, network)
    },

    initWeb3: function(privateKey, network) {
        let RPC_SERVER = 'https://ropsten.infura.io/' + infura_apikey
        if (network === 'mainnet') {
            RPC_SERVER = 'https://mainnet.infura.io/' + infura_apikey
        }
        if (network === 'localhost') {
            // Use Ganache for development, you will need web3 1.x.x for this to work :(
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545')
            App.web3 = new Web3(App.web3Provider)
            let account = App.web3.eth.accounts.privateKeyToAccount(privateKey)
            App.web3.eth.accounts.wallet.add(account)
            App.web3.eth.defaultAccount = account.address
            App.address = account.address
        } else if (network === 'ropsten' || network === 'mainnet') {
            // Connect to ropsten network through Infura
            const wallet = ethereumjsWallet.fromPrivateKey(new Buffer(privateKey, 'hex'))
            const engine = new ProviderEngine()
            engine.addProvider(new FilterSubprovider())
            engine.addProvider(new WalletSubprovider(wallet, {}))
            engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(RPC_SERVER)))
            engine.start()
            App.web3Provider = engine
            App.address = '0x' + wallet.getAddress().toString('hex')
            App.web3 = new Web3(App.web3Provider)
        }
        return App.initContract()
    },

    initContract: function() {
        App.contracts.Etherpass = TruffleContract(EtherpassArtifact)
        // Set the provider for our contract
        App.contracts.Etherpass.setProvider(App.web3Provider)
        App.contracts.Etherpass.defaults({from: App.address})
        //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
        if (typeof App.contracts.Etherpass.currentProvider.sendAsync !== "function") {
            App.contracts.Etherpass.currentProvider.sendAsync = function() {
                return App.contracts.Etherpass.currentProvider.send.apply(
                    App.contracts.Etherpass.currentProvider, arguments
                )
            }
        }
    },

    savePassword: function(name, password) {
        App.contracts.Etherpass.deployed().then(function(etherpassInstance) {
            return etherpassInstance.savePassword(name, password,
                {from: App.address, gas: 1000000}
            )
        }).catch(function(err) {
            console.error(err.message)
        })
    },

    getPassword: function(name) {
        return App.contracts.Etherpass.deployed().then(function(etherpassInstance) {
            return etherpassInstance.getPassword(name,
                {from: App.address, gas: 1000000}
            )
        }).catch(function(err) {
            console.error(err.message)
        })
    },
}

export default App
