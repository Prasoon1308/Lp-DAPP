const { ethers } = require("hardhat");

require("dotenv").config();


const { WETH, DAI, USDC, USDT} = process.env

function sleep(miliseconds) {
    var currentTime = new Date().getTime();

    while (currentTime + miliseconds >= new Date().getTime()) {}
}

async function main() {
  console.log("start delploy");
  const factoryAddress = "0x89b068B6b3a277d7e7CbC4390484CFD5BA50EB32"; // TODO - CHANGETHIS - factory contract address
  const [deployer, user, devAddr] = await ethers.getSigners();

  const Router = await ethers.deployContract("UniswapV2Router02", [
    factoryAddress,
    WETH,
  ]);
  const router = await Router.waitForDeployment();
  console.log(`router contract address: ${await router.getAddress()}`);

  console.log(factoryAddress, WETH);
  sleep(15000);

  await run("verify:verify", {
      constructorArguments: [
          factoryAddress,
          WETH
      ],
      contract: "contracts/uniswapv2/UniswapV2Router02.sol:UniswapV2Router02",
      address: await router.getAddress()
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
