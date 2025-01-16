import { useState, useEffect } from "react";
import { ethers } from "ethers";
import LiquidityForm from "../components/LiquidityForm";
import {
  addLiquidity,
  addLiquidityETH,
  calculateLiquidityOutput,
  calculateLiquidityShared,
  createPair,
  getPair,
} from "../_utils/web3Functions/liquidityFunctions";
import {
  UniswapV2Router02,
  UniswapV2Factory,
} from "../_utils/contractAddresses";
import UniswapV2RouterABI from "../../ABI/UniswapV2Router";
import UniswapV2FactoryABI from "../../ABI/UniswapV2Factory";
import UniswapV2PairABI from "../../ABI/UniswapV2Pair";
import {
  getBalance,
  checkAllowance,
  calculateSlippageAmount,
} from "@/_utils/web3Functions/balance";
import tokenABI from "../../ABI/Token";

const defaultData = {
  decimals: 18,
  address1: "0xb4102C0985d94DE1Ae48fE6530e7cCB2228c30Fa",
  address2: "0x599B9bD208FbA7077c3f87e58B89f95AE8d64eE3",
  balance: "",
  swapValue: 0,
  isExact: false,
  price: 0,
};

export default function RemoveLiquidity({}) {
  let [signer, setSigner] = useState("");
  let [provider, setProvider] = useState("");
  let [walletAddress, setWalletAddress] = useState("");
  let [network, setNetwork] = useState("");
  let [balance, setBalance] = useState("");
  let [connected, setConnected] = useState(false);
  let [status, setStatus] = useState("");

  let [token1, setToken1] = useState("");
  let [amount1, setAmount1] = useState("");
  let [token2, setToken2] = useState("");
  let [amount2, setAmount2] = useState("");
  let [lpercentage, setLpercentage] = useState("");
  let [liquidityToken, setLiquidityToken] = useState("");

  const connectWallet = async () => {
    try {
      let providerr = new ethers.providers.Web3Provider(window.ethereum);
      provider = providerr;
      console.log(await provider.send("eth_requestAccounts", []));
      setProvider(provider);

      signer = provider.getSigner();
      setSigner(signer);

      console.log("signer:", signer, "provider:", provider);

      // Get wallet address
      walletAddress = await signer.getAddress();
      setWalletAddress(walletAddress);

      // Get network name
      network = await provider.getNetwork();
      setNetwork(network.name);

      // Get wallet balance
      balance = await provider.getBalance(walletAddress);
      setBalance(ethers.utils.formatEther(balance));

      setConnected(true);
      console.log("Connected wallet:", walletAddress, network, balance);
      setStatus("Connected wallet");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setStatus("Failed to connect wallet");
    }
  };

  const handleRemoveLiquidity = async (token1, token2, liquidityPercentage) => {
    setStatus("Processing...");

    try {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const routerContract = new ethers.Contract(
        UniswapV2Router02,
        UniswapV2RouterABI,
        signer
      );

      const token1Contract = new ethers.Contract(token1, tokenABI, signer);
      const token2Contract = new ethers.Contract(token2, tokenABI, signer);
      const factoryContract = new ethers.Contract(
        UniswapV2Factory,
        UniswapV2FactoryABI,
        signer
      );
      const pairAddress = await factoryContract.getPair(token1, token2);
      const pairContract = new ethers.Contract(
        pairAddress,
        UniswapV2PairABI,
        signer
      );

      const balance1 = await token1Contract.balanceOf(pairAddress); //total amount of token1 in the pair contract
      const balance2 = await token2Contract.balanceOf(pairAddress); //total amount of token2 in the pair contract

      const liquidity = await pairContract.balanceOf(walletAddress); //total liquidity of the user
      const liquidityEther = ethers.utils.formatEther(liquidity.toString());
      console.log("Liquidity of the user: ", liquidityEther.toString());
      setLiquidityToken(liquidityEther.toString());

      const removeLiquidityPer = ethers.BigNumber.from(liquidity.toString())
        .mul(ethers.BigNumber.from(liquidityPercentage.toString()))
        .div(ethers.BigNumber.from("100"));

      const totalSupply = await pairContract.totalSupply();
      const amount0 = removeLiquidityPer.mul(balance1).div(totalSupply);
      const amount1 = removeLiquidityPer.mul(balance2).div(totalSupply);
      console.log(amount0.toString(), amount1.toString());

      const [amount0S] = calculateSlippageAmount(amount0, 0.5);
      const [amount1S] = calculateSlippageAmount(amount1, 0.5);
      console.log(
        "amount0S",
        amount0S.toString(),
        "amount1S",
        amount1S.toString()
      );

      const currentAllowance = await pairContract.allowance(
        walletAddress,
        UniswapV2Router02
      );
      if (currentAllowance.lt(removeLiquidityPer)) {
        const allowance = await pairContract.approve(
          UniswapV2Router02,
          removeLiquidityPer
        );
        const allowed = await allowance.wait();
      }
      setStatus("Allowance approved");

      const tx = await routerContract.removeLiquidity(
        token1,
        token2,
        removeLiquidityPer,
        parseInt(amount0S).toString(),
        parseInt(amount1S).toString(),
        walletAddress,
        deadline
      );
      setStatus(
        `Liquidity added successfully! Transaction Hash: ${await tx.hash}`
      );
    } catch (error) {
      console.error("Error adding liquidity:", error);
      setStatus("Error adding liquidity. Check console for details.");
    }
  };

  // const removeLiquidityETH = async (tokenA, tokenB, liquidityPerecenatge, to, deadline, signer) {
  //   // need to optimise according to tokenA and tokenB
  //   const routerContract = new ethers.Contract(UniswapV2Router02, UniswapV2RouterABI, signer);
  //   const deadlineBN = ethers.BigNumber.from(deadline);

  //   const tokenAContract = new ethers.Contract(tokenA, WETH9ABI, signer); // wethAddress
  //   const tokenBContract = new ethers.Contract(tokenB, ERC20, signer);
  //   const factoryContract = new ethers.Contract(UniswapV2Factory, UniswapV2FactoryABI, signer);
  //   const pairAddress = await factoryContract.getPair(tokenA, tokenB); //wethaddress
  //   const pairContract = new ethers.Contract(pairAddress, PairABI, signer);

  //   const balanceA = await tokenAContract.balanceOf(pairAddress);
  //   const balanceB = await tokenBContract.balanceOf(pairAddress);
  //   const liquidity = await pairContract.balanceOf(to);
  //   // const removeLiquidityPer = liquidity.toString() * (liquidityPerecenatge / 100);
  //   const removeLiquidityPer = ethers.BigNumber.from(liquidity.toString()).mul(ethers.BigNumber.from(liquidityPerecenatge.toString())).div(ethers.BigNumber.from('100'));
  //   const totalSupply = await pairContract.totalSupply();
  //   const amount0 = removeLiquidityPer.mul(balanceA).div(totalSupply); // divide by slippage Tolerance
  //   const amount1 = removeLiquidityPer.mul(balanceB).div(totalSupply); // divide by slippage Tolerance

  //   const [amount0S] = calculateSlippageAmount(amount0, 0.5);
  //   const [amount1S] = calculateSlippageAmount(amount1, 0.5);

  //   const owner = await signer.getAddress();
  //   const currentAllowance = await pairContract.allowance(owner, UniswapV2Router02);

  //   try {
  //     if (currentAllowance.lt(removeLiquidityPer)) {
  //       const allowance = await pairContract.approve(UniswapV2Router02, removeLiquidityPer);
  //       const allowed = await allowance.wait();
  //     }
  //     const tx = await routerContract.removeLiquidityETH(tokenB, removeLiquidityPer, parseInt(amount1S).toString(), parseInt(amount0S).toString(), to, deadlineBN);
  //     const receipt = await tx.wait();
  //     return receipt;
  //   } catch (error) {
  //     console.error('Error removing liquidity:', error);
  //     throw error;
  //   }
  // }

  const handleAction = async () => {
    console.log(`Removing ${lpercentage} % of Liquidity`);

    handleRemoveLiquidity(
      "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
      "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4",
      lpercentage
    );
  };

  return (
    <div>
      <div style={{ textAlign: "right", padding: "10px" }}>
        {connected ? (
          <div>
            <p>Address: {walletAddress}</p>
            <p>Network: {network}</p>
            <p>Balance: {balance} ETH</p>
          </div>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Remove Liquidity</h1>
        <div>
          <form>
            <label>Token 1 Address: </label> <br />
            <input
              type="text"
              placeholder="Token 1 Address"
              value="0x0e87a6042699d79C0a9221D0114E9Cb874B32c27" // TestyTokenA
            />
            <br />
            <label>Token 2 Address: </label>
            <br />
            <input
              type="text"
              placeholder="Token 2 Address"
              value="0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4" // TestyTokenB
            />
            <br />
            <label>Liquidity Percentage </label>
            <br />
            <input
              type="text"
              placeholder="Liquidity Percentage"
              value={lpercentage}
              onChange={(e) => setLpercentage(e.target.value)}
            />
            <br />
          </form>
        </div>
        <button onClick={handleAction}>Remove Liquidity</button>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
