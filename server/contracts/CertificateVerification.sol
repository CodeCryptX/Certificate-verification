// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract CertificateVerification {
    struct Certificate {
        string studentId;
        string hash;
        uint256 timestamp;
    }

    mapping(string => Certificate) public certificates;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    function storeHash(string memory cid, string memory hash, string memory _StudentId) public onlyAdmin {
        certificates[cid] = Certificate(_StudentId, hash, block.timestamp);
    }

    function verifyHash(string memory cid) public view returns(string memory) {
        return certificates[cid].hash;
    }
}