//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";

// import "./NovelPaymaster.sol";

// This is done so that OpenSea can cover Matic gas costs: https://docs.opensea.io/docs/polygon-basic-integration
// import "./MetaTransactions.sol";

// We are using OpenGSN to do the transactions (gasless to the customer)
contract NovelCollection is Ownable, ERC721Enumerable, BaseRelayRecipient {
    // string functionality
    using Strings for uint256;

    // when reveal() is called it emits an event
    event Revealed();

    // increment token IDs, every time a new one is minted
    uint256 private _nextTokenId = 0;

    // base URI of token specific metadata
    string private _btURI;

    // URI for collection metadata
    string private _cURI;

    // which wallets are allowed to mint a token
    mapping(address => uint32) whitelist;

    // saving all the minting wallet addresses
    mapping(address => uint32) mintPerCustomer;

    // 0 means collection is NOT revealed, other numbers meen it is
    uint256 public startingIndex = 0;

    // the version of the recepient (the collection contract)
    // should we same version number as NovelPaymaster#versionPaymaster
    string public override versionRecipient = "2.2.3+novel-irelayrecipient";

    // max amount of token
    uint32 public immutable supplyCap;

    // proves that metadata is valid (ex: like an MD5 hash of the metadata json)
    string public metadataProofHash;

    constructor(
        // Name of collection (ex: ToliCollection)
        string memory _name,
        // The symbol of the token (ex: TOLI)
        string memory _symbol,
        // Max amount of that token
        uint32 _supplyCap,
        // proves that metadata is valid (ex: like an MD5 hash of the metadata json)
        string memory _metadataProofHash,
        // URI for collection metadata
        string memory __cURI,
        // GSN Forwarder address (for gasless txns)
        address _forwarder
    )
        // address of the GSN Paymaster
        // doesn't work right now
        // address payable _paymasterContractAddress
        ERC721(_name, _symbol)
    {
        supplyCap = _supplyCap;
        metadataProofHash = _metadataProofHash;
        _cURI = __cURI;

        _setTrustedForwarder(_forwarder);

        // // Doesn't work right now
        // // NovelPaymaster novelPaymaster = NovelPaymaster(_paymasterContractAddress);
        // _paymasterContractAddress.delegatecall(
        //     abi.encodeWithSignature("enableContract(address)", address(this))
        // );
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _btURI;
    }

    // function contractURI() public view returns (string memory) {
    //     return string(abi.encodePacked(_cURI, address(this)));
    // }

    function contractURI() public pure returns (string memory) {
        return "https://ennf00de38owpbo.m.pipedream.net";
    }

    function setWhitelistedAmount(
        address[] memory customers,
        uint32[] memory tokenCounts
    ) external onlyOwner {
        require(
            customers.length == tokenCounts.length,
            "NovelCollection: invalid input lengths, customers and tokenCount arrays must be the same length"
        );

        for (uint256 i = 0; i < customers.length; i++) {
            whitelist[customers[i]] = tokenCounts[i];
        }
    }

    function whitelistedAmount(address customer) public view returns (uint32) {
        return whitelist[customer];
    }

    function mintedAmount(address customer) public view returns (uint32) {
        return mintPerCustomer[customer];
    }

    function mintableAmount(address customer) public view returns (uint32) {
        uint32 _mintedAmount = mintedAmount(customer);
        uint32 _whitelistedAmount = whitelistedAmount(customer);

        if (_mintedAmount > _whitelistedAmount) {
            return 0;
        } else {
            return whitelistedAmount(customer) - mintedAmount(customer);
        }
    }

    function canMintAmount(address customer, uint32 amount)
        public
        view
        returns (bool)
    {
        return mintableAmount(customer) >= amount;
    }

    function mint(uint32 count) external {
        require(!isRevealed(), "NovelCollection: sale is over");

        address customer = _msgSender();
        require(
            whitelist[customer] >= count,
            "NovelCollection: requested count exceeds whitelist limit"
        );

        require(
            totalSupply() + count <= supplyCap,
            "NovelCollection: cap reached"
        );

        for (uint256 i = 0; i < count; i++) {
            _nextTokenId++; // this begins token IDs at 1
            mintPerCustomer[customer]++;
            _safeMint(customer, _nextTokenId);
        }
    }

    /**
     * @dev Finalize starting index
     */
    function reveal(string memory baseTokenURI) external onlyOwner {
        require(!isRevealed(), "NovelCollection: already revealed");

        _btURI = baseTokenURI;
        startingIndex = uint256(blockhash(block.number - 1)) % supplyCap;

        // Prevent default sequence
        if (startingIndex == 0) {
            startingIndex = 1;
        }

        emit Revealed();
    }

    /**
     * @dev Returns true if the metadata starting index has been revealed
     */
    function isRevealed() public view returns (bool) {
        return startingIndex > 0;
    }

    function walletOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (!isRevealed()) {
            // Pre-reveal placeholder
            return "https://ennf00de38owpbo.m.pipedream.net";
        }

        // uint256 trueIndex = (startingIndex + tokenId) % supplyCap;
        return "https://ennf00de38owpbo.m.pipedream.net";
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        // if OpenSea's ERC721 Proxy Address is detected, auto-return true
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }

        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721.isApprovedForAll(_owner, _operator);
    }

    /**
     * @dev Withdrawal implemented for safety reasons in case funds are
     * accidentally sent to the contract
     */
    function withdraw() external {
        uint256 balance = address(this).balance;
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent);
    }

    function _msgSender()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (address)
    {
        return BaseRelayRecipient._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, BaseRelayRecipient)
        returns (bytes memory)
    {
        return BaseRelayRecipient._msgData();
    }
}
