require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { INFURA_API_KEY, PRIVATE_KEY, LINEASCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [{ version: "0.6.6" }, { version: "0.8.20" }, { version: "0.5.16" }, { version: "0.4.20" }],
    settings: {
      optimizer: {
        enabled: true,
        runs: 5000,
      },
    },
  },
  networks: {
    hardhat: {
    },
    // sepolia: {
    //   url: "https://sepolia.infura.io/v3/<key>",
    //   accounts: [`0x${PRIVATE_KEY}`],
    // }
  },
  etherscan: {
    apiKey: LINEASCAN_API_KEY, // Your Etherscan API key
  },
};
