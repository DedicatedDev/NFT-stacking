//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
interface IMarket {
    struct NFT {
        address contractAddress;
        uint256 tokenId;
        string  tokenUri;
    }
    function staking(NFT memory nft) external;
}