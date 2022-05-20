//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./presets/OwnablePausableUpgradeable.sol";

contract AliceNFT is
    UUPSUpgradeable,
    ERC721URIStorageUpgradeable,
    OwnablePausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;
    address public marketplaceAddress;

    event NewAliceToken(uint256 tokenId);

    function initialize(address _marketplaceAddress) external initializer {
        __OwnablePausableUpgradeable_init(msg.sender);
        __ERC721_init("Alice", "AL");
        marketplaceAddress = _marketplaceAddress;
    }

    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function claimToken(string memory tokenURI) external payable {
        require(msg.value >= 0.01 ether, "AliceNFT: not enough funds");
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(marketplaceAddress, true);
        emit NewAliceToken(newItemId);
    }

    function withdraw(address payable to, uint256 value)
        public
        payable
        onlyAdmin
        whenNotPaused
        nonReentrant
    {
        require(address(this).balance >= value, "Balance is insufficient.");
        to.transfer(value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        whenNotPaused
        onlyAdmin
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
