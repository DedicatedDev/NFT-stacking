import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, use } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  AliceNFT,
  AliceNFT__factory,
  Market,
  Market__factory,
} from "../typechain";
import { NewAliceTokenEvent } from "../typechain/AliceNFT";
import { TypedEvent } from "../typechain/common";
import { NewLPTokenEvent } from "../typechain/Market";

describe("Market", function () {
  let aliceNFTFactory: AliceNFT__factory;
  let aliceNFT: AliceNFT;
  let marketFactory: Market__factory;
  let market: Market;
  let owner, user1: SignerWithAddress;
  const tokenUri: string =
    "https://bafybeidrw4igtipfskpp37a4di46sb6iyoydfna52nq4rphnhxoumo6jbu.ipfs.nftstorage.link/metadata/";

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
    marketFactory = await ethers.getContractFactory("Market");
    market = (await upgrades.deployProxy(marketFactory, [], {
      kind: "uups",
    })) as Market;

    aliceNFTFactory = await ethers.getContractFactory("AliceNFT");
    aliceNFT = await aliceNFTFactory.deploy();
    await aliceNFT.deployed();
  });

  it("mint nft from AliceNFT contract", async () => {
    expect(
      await aliceNFT
        .connect(user1)
        .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
    ).to.emit(aliceNFT, "NewAliceToken");
    const receiptEth = await ethers.provider.getBalance(aliceNFT.address);
    expect(receiptEth).to.equal(ethers.utils.parseEther("0.01"));
    const nft = await aliceNFT.balanceOf(user1.address);
    expect(nft).to.eq(BigNumber.from(1));
  });

  it("stacking", async () => {
    //Mint NFT from AliceNFT
    const firstEvent: <T extends TypedEvent<any>>(
      p: Promise<ContractTransaction>
    ) => Promise<T["args"]> = (p) =>
      p.then((t) => t.wait()).then((t) => (t.events || [])[0].args);

    const tokenId = (
      await firstEvent<NewAliceTokenEvent>(
        aliceNFT
          .connect(user1)
          .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
      )
    ).tokenId;

    //Stacking NFT to Market contract
    await aliceNFT.connect(user1).approve(market.address, tokenId);
    await market.connect(user1).staking({
      contractAddress: aliceNFT.address,
      tokenId: tokenId,
      tokenUri: tokenUri,
    });
  });

  it("redeem NFT from market", async () => {
    //Mint NFT from AliceNFT
    const firstEvent: <T extends TypedEvent<any>>(
      p: Promise<ContractTransaction>
    ) => Promise<T["args"]> = (p) =>
      p.then((t) => t.wait()).then((t) => (t.events || [])[0].args);

    const tokenId = (
      await firstEvent<NewAliceTokenEvent>(
        aliceNFT
          .connect(user1)
          .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
      )
    ).tokenId;

    //Stacking NFT to Market contract
    await aliceNFT.connect(user1).approve(market.address, tokenId);
    const lpTokenId = (
      await firstEvent<NewLPTokenEvent>(
        market.connect(user1).staking({
          contractAddress: aliceNFT.address,
          tokenId: tokenId,
          tokenUri: tokenUri,
        })
      )
    ).tokenId;

    //Redeem NFT from market again
    await market.connect(user1).redeem(lpTokenId);
    expect(await aliceNFT.balanceOf(market.address)).to.equal(
      BigNumber.from(0)
    );
    expect(await aliceNFT.balanceOf(user1.address)).to.equal(BigNumber.from(1));
  });

  it("pause market contract", async () => {
    //Mint NFT from AliceNFT
    const firstEvent: <T extends TypedEvent<any>>(
      p: Promise<ContractTransaction>
    ) => Promise<T["args"]> = (p) =>
      p.then((t) => t.wait()).then((t) => (t.events || [])[0].args);

    const tokenId = (
      await firstEvent<NewAliceTokenEvent>(
        aliceNFT
          .connect(user1)
          .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
      )
    ).tokenId;

    //Stacking NFT to Market contract
    await aliceNFT.connect(user1).approve(market.address, tokenId);
    await market.pause();
    await expect(
      market.connect(user1).staking({
        contractAddress: aliceNFT.address,
        tokenId: tokenId,
        tokenUri: tokenUri,
      })
    ).to.be.revertedWith("Pausable: paused");
  });

  it("revert pause market contract by none owner", async () => {
    //Mint NFT from AliceNFT
    const firstEvent: <T extends TypedEvent<any>>(
      p: Promise<ContractTransaction>
    ) => Promise<T["args"]> = (p) =>
      p.then((t) => t.wait()).then((t) => (t.events || [])[0].args);

    const tokenId = (
      await firstEvent<NewAliceTokenEvent>(
        aliceNFT
          .connect(user1)
          .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
      )
    ).tokenId;

    //Stacking NFT to Market contract
    await aliceNFT.connect(user1).approve(market.address, tokenId);
    await expect(market.connect(user1).pause()).to.be.reverted;
  });

  it("upgrade market contract to v2", async () => {
    //Mint NFT from AliceNFT
    const firstEvent: <T extends TypedEvent<any>>(
      p: Promise<ContractTransaction>
    ) => Promise<T["args"]> = (p) =>
      p.then((t) => t.wait()).then((t) => (t.events || [])[0].args);

    const tokenId = (
      await firstEvent<NewAliceTokenEvent>(
        aliceNFT
          .connect(user1)
          .claimToken(tokenUri, { value: ethers.utils.parseEther("0.01") })
      )
    ).tokenId;

    //Stacking NFT to Market contract
    await aliceNFT.connect(user1).approve(market.address, tokenId);
    const lpTokenId = (
      await firstEvent<NewLPTokenEvent>(
        market.connect(user1).staking({
          contractAddress: aliceNFT.address,
          tokenId: tokenId,
          tokenUri: tokenUri,
        })
      )
    ).tokenId;

    const marketV2Factory = await ethers.getContractFactory("MarketV2");
    const marketV2 = await upgrades.upgradeProxy(market, marketV2Factory);

    //check contract address is same or not
    expect(marketV2.address).to.equal(market.address);
    //after update, check stacked NFT exist or not.
    const nft = await marketV2.connect(user1).getMyToken(lpTokenId);
    expect(nft.tokenId).to.equal(tokenId);
    //check migrate function is working or not in version 2
    expect(await marketV2.connect(user1).staking(nft)).to.emit(
      marketV2,
      "ASSERT"
    );
  });
});
