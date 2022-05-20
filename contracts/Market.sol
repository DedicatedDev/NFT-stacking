//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./presets/OwnablePausableUpgradeable.sol";

import "./interface/IMarket.sol";

contract Market is
    IMarket,
    UUPSUpgradeable,
    ERC721URIStorageUpgradeable,
    OwnablePausableUpgradeable
{
    IERC721Upgradeable nft721;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIds;
    mapping(address => mapping(uint256 => NFT)) _stackedNFTs;

    event NewLPToken(uint256 tokenId);

    function initialize() external initializer {
        __ERC721_init("Cerulean Blue", "CB");
        __OwnablePausableUpgradeable_init(msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyAdmin {}

    function _mintLpNFTToken(string memory tokenURI, NFT memory _nft)
        internal
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        _stackedNFTs[msg.sender][newItemId] = _nft;
        return newItemId;
    }

    function redeem(uint256 _lpTokenId) external whenNotPaused {
        IMarket.NFT memory _nft = _stackedNFTs[msg.sender][_lpTokenId];
        nft721 = IERC721Upgradeable(_nft.contractAddress);
        nft721.transferFrom(address(this), msg.sender, _nft.tokenId);
    }

    function staking(NFT memory _nft) external virtual override whenNotPaused {
        nft721 = IERC721Upgradeable(_nft.contractAddress);
        nft721.transferFrom(msg.sender, address(this), _nft.tokenId);
        uint256 lpTokenId = _mintLpNFTToken(_nft.tokenUri, _nft);
        emit NewLPToken(lpTokenId);
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

    function getMyToken(uint256 lpTokenId) external view returns (NFT memory) {
        return _stackedNFTs[msg.sender][lpTokenId];
    }
}
