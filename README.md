# Lp-DAPP

## Sepolia Network (chain id - 11155111) Verified Contracts

- UniswapV2Factory = `0x7C8b160f3EE780E950AAC6eA0279565290Eb025D`;
- UniswapV2Router02 = `0xd27aF3D3b0DEd928e3873747b8a7852493b1cdE1`;
- TEST = `0xb4102C0985d94DE1Ae48fE6530e7cCB2228c30Fa`;
- TEST2 = `0x599B9bD208FbA7077c3f87e58B89f95AE8d64eE3`;
- TestyTokenA = `0x0e87a6042699d79C0a9221D0114E9Cb874B32c27`;
- TestyTokenB = `0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4`;
- WETH9 = `0xf5257c6F8301b3e976BBE3224aD1611F5d1d6888`;
- UniswapV2Pair = `0x226D69F87a1D8b76bC1842F72E77e7C75C934Cc4`;

## Installation

1. Clone the repository.
2. To interact with smart contracts:

   2.1 Use remix to compile and deploy the smart contracts after uploading contracts folder

   2.2 Through hardhat: `npm install` to install dependencies, `npx hardhat compile` to compile smart contracts and `npx hardhat node` to start local hardhat node
3. To interact with frontend:
- Enter the frontend directory
    ```bash
    cd dapp-frontend
    ```
- Install dependencies
    ```bash
    npm install
    ```
- Start deploymet server
    ```bash
    npm run dev
    ```

## Flow
- Connect with your metamask wallet at each page
- Start by minting some tokens (the default tokens have `public` `mint` function to enable the test) at `/mint` page. Enter the amount of tokens (in ether - 10<sup>18</sup> wei).
- You can add liquidity (of the minted tokens) at `/add-liquidity` page. Enter the amount of respected tokens you desire to add to the liquidity pool (in ether - 10<sup>18</sup> wei).
    - After `Add Liquidity` button is clicked, metamask popup will occur requesting for token allowance of the respected tokens with respected input amounts. Confirm each of them and then confirm the transaction to complete the process.
- You can remove liquidity at `/remove-liquidity` page. Enter the percentage of liquidity to be withdrawn (1-100).
    - After `Remove Liquidity` button is clicked, metamask popup will occur requesting for token allowance of the liquidity pool token with respected input amount. Confirm the token allowance and then confirm the transaction to complete the process.
- You can swap the `TestyTokenA` with `TestyTokenB` at `/swap` page. Enter the amount of tokens to be swapped (in ether - 10<sup>18</sup> wei).
    - After `swap` button is clicked, metamask popup will occur requesting for token allowance of the `TestyTokenA` with respected input amount. Confirm the token allowance and then confirm the transaction to complete the process.
- You can also add/deploy a new LP of two tokens at `/create-pair` page. Enter the token addresses in any order.

## Contract deployment (Through Remix)
- Compile and deploy the ERC20 token contracts (one with mint rights with `onlyOwner`)
- The `WETH9` contract is available in the repo, which will act as a wrapped base token for the deployed exchange.
- First deploy `UniswapV2Factory` contract with the admin (feeToSetter) address as parameter. 
- After deployment fetch the `pairCodeHash` (this code changes with different networks) from the get function and paste it in the `UniswapV2Library` contract's `pairFor` function after removing `0x`.
- After the last changes, deploy the `UniswapV2Router02` contract with the factory and weth contract addresses.
