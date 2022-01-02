//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "./NovelPaymaster.sol";

// This is done so that OpenSea can cover Matic gas costs: https://docs.opensea.io/docs/polygon-basic-integration
// import "./MetaTransactions.sol";

contract NovelCollection is Ownable, ERC721Enumerable, BaseRelayRecipient {
    using Strings for uint256;

    event Revealed();

    uint256 private _nextTokenId = 0;
    string private _btURI;
    string private _cURI;
    mapping(address => uint32) whitelist;
    mapping(address => uint32) mintPerCustomer;

    uint256 public startingIndex = 0;

    string public override versionRecipient = "2.2.3+novel-irelayrecipient";

    uint32 public immutable supplyCap;
    // string public metadataProofHash;

    constructor(
        string memory _name,
        string memory _symbol,
        uint32 _supplyCap,
        // string memory _metadataProofHash,
        string memory __cURI,
        address _forwarder
        // address payable _paymasterContractAddress
    ) ERC721(_name, _symbol) {
        supplyCap = _supplyCap;
        // metadataProofHash = _metadataProofHash;
        _cURI = __cURI;

        _setTrustedForwarder(_forwarder);
    
        // NaivePaymaster novelPaymaster = NaivePaymaster(_paymasterContractAddress);
        // novelPaymaster.enableContract(address(this));
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

    function canMintAmount(address customer, uint32 amount) public view returns (bool) {
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