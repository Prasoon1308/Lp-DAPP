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
import { getBalance, checkAllowance } from "@/_utils/web3Functions/balance";

const defaultData = {
  decimals: 18,
  address1: "0xb4102C0985d94DE1Ae48fE6530e7cCB2228c30Fa",
  address2: "0x599B9bD208FbA7077c3f87e58B89f95AE8d64eE3",
  balance: "",
  swapValue: 0,
  isExact: false,
  price: 0,
};

export default function AddLiquidity({}) {
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

  const handleAddLiquidity = async (token1, amount1, token2, amount2) => {
    setStatus("Processing...");
    console.log("Processing...");

    try {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
      const balance1 = await getBalance(token1, walletAddress, provider);
      let balance1Ether = ethers.utils.formatEther(balance1.toString());
      console.log(amount1, "Token 1 balance of the user: ", balance1Ether.toString());
      setStatus(`Token 1 balance of the user: ${balance1Ether.toString()}`);

      const balance2 = await getBalance(token2, walletAddress, provider);
      let balance2Ether = ethers.utils.formatEther(balance2.toString());
      console.log(amount2, "Token 2 balance of the user: ", balance2Ether.toString());
      setStatus(`Token 2 balance of the user: ${balance2Ether.toString()}`);

      const amount1Wei = ethers.utils.parseEther(amount1);
      const amount2Wei = ethers.utils.parseEther(amount2);

      if (amount1Wei.lt(balance1) && amount2Wei.lt(balance2)) {

        await checkAllowance(token1, amount1Wei, provider, signer);
        console.log("Token1 - allowance checked");
        setStatus("Token1 - allowance checked");

        await checkAllowance(token2, amount2Wei, provider, signer);
        console.log("Token2 - allowance checked");
        setStatus("Token2 - allowance checked");

        console.log(
          "token1",
          token1,
          "amount1",
          amount1,
          "token2",
          token2,
          "amount2",
          amount2
        );

        // Calculate token output for optimal liquidity
        const optimalAmount2 = await calculateLiquidityOutput(
          token1,
          token2,
          amount1Wei,
          signer
        );
        console.log(optimalAmount2);

        const userAddress = walletAddress;
        console.log(signer, provider, userAddress);

        const factorycontract = new ethers.Contract(
          UniswapV2Factory,
          UniswapV2FactoryABI,
          provider
        );
        console.log(factorycontract);

        // Check if token pair exists or create it
        let pairAddress = await factorycontract.getPair(token1, token2);
        if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
          pairAddress = await createPair(token1, token2, signer);
          setStatus(`Pair created at address: ${pairAddress}`);
        } else {
          setStatus(`Pair already exists at address: ${pairAddress}`);
        }
        console.log(await pairAddress);

        // Add Liquidity
        const routerContract = new ethers.Contract(
          UniswapV2Router02,
          UniswapV2RouterABI,
          signer
        );
        const receipt = await routerContract.addLiquidity(
          "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
          "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4",
          amount1Wei,
          amount2Wei,
          1000,
          2000,
          walletAddress,
          1746865324
        );
        console.log("receipt:", await receipt);

        setStatus(
          `Liquidity added successfully! Transaction Hash: ${await receipt.hash}`
        );
      } else {
        setStatus("Insufficient balance");
        console.error("Insufficient balance");
      }
    } catch (error) {
      console.error("Error adding liquidity:", error);
      setStatus("Error adding liquidity. Check console for details.");
    }
  };

  // const handleAddLiquidityETH = async ({ token1, amount1, amount2 }) => {
  //   setStatus("Processing...");

  //   try {
  //     const amountTokenBN = ethers.utils.parseEther(amount1);
  //     const amountETHBN = ethers.utils.parseEther(amount2);
  //     const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  //     const userAddress = await signer.getAddress();

  //     // Add Liquidity ETH
  //     const receipt = await addLiquidityETH(
  //       token1,
  //       amountETHBN,
  //       amountTokenBN,
  //       amountETHBN.mul(95).div(100), // 5% slippage tolerance
  //       amountTokenBN.mul(95).div(100),
  //       userAddress,
  //       deadline,
  //       signer
  //     );

  //     setStatus(
  //       `Liquidity added successfully! Transaction Hash: ${receipt.hash}`
  //     );
  //   } catch (error) {
  //     console.error("Error adding liquidity with ETH:", error);
  //     setStatus("Error adding liquidity with ETH. Check console for details.");
  //   }
  // };

  const handleAction = () => {
    console.log(`Add Liquidity with:`, { token1, amount1, token2, amount2 });

    handleAddLiquidity(
      "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
      amount1,
      "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4",
      amount2
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
        <h1>Add Liquidity</h1>
        <div>
          <form>
            <label>Token 1 Address: </label> <br />
            <input
              type="text"
              placeholder="Token 1 Address"
              value="0x0e87a6042699d79C0a9221D0114E9Cb874B32c27" // TestyTokenA
            />
            <br />
            <label>Amount of Token 1: </label>
            <br />
            <input
              type="text"
              placeholder="Amount of Token 1"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
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
            <label>Amount of Token 2: </label>
            <br />
            <input
              type="text"
              placeholder="Amount of Token 2"
              value={amount2}
              onChange={(e) => setAmount2(e.target.value)}
            />
            <br />
          </form>
        </div>
        <button onClick={handleAction}>Add Liquidity</button>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
