// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VRFMock {
    uint64 public s_subId;

    constructor() {}
    
    function createSubscription() external returns (uint64) {
        s_subId++;
        return s_subId;
    }

    function getCurrentSubId() external view returns (uint64) {
        return s_subId;
    }

    function fundSubscription(uint64, uint96) external {}

    function addConsumer(uint64, address) external {}

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external pure returns (uint256) {
        return 1;
    }

    function fulfillRandomWords(uint256, address consumer) external {
        uint256[] memory words = new uint256[](1);
        words[0] = uint256(keccak256(abi.encodePacked(block.timestamp, consumer)));

        (bool ok, ) = consumer.call(
            abi.encodeWithSignature(
                "fulfillRandomWords(uint256,uint256[])",
                1,
                words
            )
        );
        require(ok, "callback failed");
    }
}
