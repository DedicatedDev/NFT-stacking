//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "./Market.sol";

contract MarketV2 is Market {
    event ASSERT(string msg);

    function staking(NFT memory _nft) external override whenNotPaused {
        emit ASSERT("MarketV2: this is version 2 contract");
    }
}
