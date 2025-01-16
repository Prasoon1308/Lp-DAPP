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
import { getBalance, getSwapOutput, swapExactTokensForTokens } from "../_utils/web3Functions/balance";
import {
  UniswapV2Router02,
  UniswapV2Factory,
} from "../_utils/contractAddresses";
import UniswapV2RouterABI from "../../ABI/UniswapV2Router";
import UniswapV2FactoryABI from "../../ABI/UniswapV2Factory";
import UniswapV2PairABI from "../../ABI/UniswapV2Pair";
import { checkAllowance } from "@/_utils/web3Functions/balance";

export default function Swap() {
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

  const handleSwap = async (token1, amount1, token2) => {
    setStatus("Processing...");
    console.log("Processing...");

    try {
      const balance1 = await getBalance(token1, walletAddress, provider);
      let balance1Ether = ethers.utils.formatEther(balance1.toString());
      console.log("Token 1 balance of the user: ", balance1Ether.toString());
      setStatus(`Token 1 balance of the user: ${balance1Ether.toString()}`);

      const amount1Wei = ethers.utils.parseEther(amount1);

      if (amount1Wei.lt(balance1)) {
        await checkAllowance(token1, amount1Wei, provider, signer);
        console.log("Token1 - allowance checked");
        setStatus("Token1 - allowance checked");
        
        const output = await getSwapOutput(token1, token2, amount1, provider);
        console.log("Expected Output: ", output);
        setStatus(`Expected Output: ${output}`);
        setAmount2(output);

        const outputWei = ethers.utils.parseEther(output);
        console.log("Expected Output in Wei: ", outputWei.toString());

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

        const tx = await swapExactTokensForTokens(
          amount1,
          output,
          ["0x0e87a6042699d79C0a9221D0114E9Cb874B32c27", "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4"],
          walletAddress,
          deadline,
          signer,
          0.5
        )
        console.log("Swap Transaction: ", await tx);
        setStatus(`Swap successful. Transaction hash: ${tx.hash}`);
      } else {
        setStatus("Insufficient balance");
        console.error("Insufficient balance");
      }
    } catch (error) {
      console.error("Failed to swap:", error);
      setStatus("Failed to swap");
    }
  };
  const handleAction = () => {
    handleSwap(
      "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
      amount1,
      "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4"
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
        <h1>Swap Exact Tokens For Tokens</h1>
        <div>
          <form>
            <label>Token 1 Address: </label> <br />
            <input
              type="text"
              placeholder="Token 1 Address"
              value="0x0e87a6042699d79C0a9221D0114E9Cb874B32c27" // TestyTokenA
            />
            <br />
            <label>Amount of Token 1: </label> <br />
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
            <p>Approximate tokens you will get: {amount2}</p>
          </form>
        </div>
        <button onClick={handleAction}>Swap</button>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
