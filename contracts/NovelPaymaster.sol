pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// SPDX-License-Identifier: MIT OR Apache-2.0
import "@opengsn/contracts/src/BasePaymaster.sol";
import "@opengsn/contracts/src/interfaces/IRelayHub.sol";
import "./NovelCollection.sol";

// accept everything.
// this paymaster accepts any request.
//
// NOTE: Do NOT use this contract on a mainnet: it accepts anything, so anyone can "grief" it and drain its account

contract NovelPaymaster is BasePaymaster {
    address public owners;

    constructor(address _relayHubAddress, address _forwarderAddress) {
        setRelayHub(IRelayHub(_relayHubAddress));
        setTrustedForwarder(_forwarderAddress);
    }

    /**
     * Withdrawal implemented for safety reasons in case funds are
     * accidentally sent to the contract
     */
    function withdraw() external {
        uint256 balance = address(this).balance;
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent);
    }

    mapping(address => bool) public targetWhitelist;

    // this is how we mark a contract as one we will pay for
    function enableContract(address target) external onlyOwner {
        targetWhitelist[target] = true;
    }

    function isEnabledContract(address target) external view returns (bool) {
        if (targetWhitelist[target]) {
            return true;
        } else {
            return false;
        }
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external virtual override returns (bytes memory context, bool) {
        _verifyForwarder(relayRequest);
        (signature, approvalData, maxPossibleGas);
        require(
            targetWhitelist[relayRequest.request.to],
            "This Target is not added!"
        );

        // Only work on mint function
        NovelCollection novelCollection = NovelCollection(
            relayRequest.request.to
        );
        bytes4 methodSig = GsnUtils.getMethodSig(relayRequest.request.data);
        require(
            methodSig == novelCollection.mint.selector,
            "you can only call mint function"
        );

        // TODO: confirm that this actually works (checks that attempted transaction has a quantity that is whitelisted)
        uint32 quantity = extractMintCountFromCall(relayRequest.request.data);
        require(
            novelCollection.canMintAmount(relayRequest.request.from, quantity)
        );

        return ("", false);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external virtual override {
        (context, success, gasUseWithoutPost, relayData);
    }

    function versionPaymaster()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "2.2.3+novel-paymaster";
    }

    function extractMintCountFromCall(bytes memory b)
        internal
        pure
        returns (uint32)
    {
        uint32 number;

        // if this doesn't work then try 6 instead of 4
        for (uint8 i = 4; i < 8; i++) {
            number = number + uint32(uint8(b[i]) * (2**(8 * (8 - (i + 1)))));
        }
        return number;
    }
}
