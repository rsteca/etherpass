pragma solidity ^0.4.17;

contract Etherpass {
    mapping(address => mapping (bytes32 => string)) public passwords;

    // Save password
    function savePassword(bytes32 name, string password) public {
        passwords[msg.sender][name] = password;
    }

    // Get password
    function getPassword(bytes32 name) public view returns (string) {
        return passwords[msg.sender][name];
    }
}
