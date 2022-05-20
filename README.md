# NFT stacking logic

User get a NFT with 0.01 ether from AliceNFT contract.
If User stack his nft to Market Contract, Market contract mint LpNFT token to a user. 
If user redeem his original NFT from Market Contract, he has to send his own LpNFT to Market contract. 

Note: LpNFT can't trade each other because it saved based on stacker wallet address. 

```shell
npx hardhat compile. 
npx hardhat test.
```