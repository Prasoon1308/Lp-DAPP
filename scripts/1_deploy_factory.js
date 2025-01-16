const { ethers } = require("hardhat");
require("dotenv").config();


const { WETH, DAI, USDC, USDT,SHIBA_INU} = process.env


function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

async function main() {
  console.log("start delploy");
  const [owner] = await ethers.getSigners();
  console.log(`Depoying contracts with the account: ${owner.address} `); // usr not used

  // const balance = await owner.getBalance()
  // console.log(`Account balance: ${balance.toString()}`)

  const Factory = await ethers.deployContract("UniswapV2Factory", [
    owner.address,
    [DAI, WETH, USDC,SHIBA_INU],
  ], owner);
  const factory = await Factory.waitForDeployment();
  console.log(`Factory contract address: ${await factory.getAddress()}`);

  console.log(owner.address, [DAI, WETH, USDC,SHIBA_INU]);
  console.log("Waiting");

  sleep(10000);

  await run("verify:verify", {
    address: await factory.getAddress(),
    constructorArguments: [owner.address, [DAI, WETH, USDC,SHIBA_INU]],
    contract: "contracts/uniswapv2/UniswapV2Factory.sol:UniswapV2Factory",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
