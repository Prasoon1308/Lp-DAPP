import { useState, useEffect } from "react";
import { ethers } from "ethers";
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

export default function CreatePair() {
  let [signer, setSigner] = useState("");
  let [provider, setProvider] = useState("");
  let [walletAddress, setWalletAddress] = useState("");
  let [network, setNetwork] = useState("");
  let [balance, setBalance] = useState("");
  let [connected, setConnected] = useState(false);
  let [status, setStatus] = useState("");

  let [token1, setToken1] = useState("");
  let [token2, setToken2] = useState("");

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

  const handleAction =  () => {
    console.log(`Create Pair with: ${token1} and ${token2}`);

    handleCreatePair(token1, token2);
  }
  const handleCreatePair = async (token1Address, token2Address) => {
    console.log("Create Pair:", token1Address, token2Address);
    try {
      const factorycontract = new ethers.Contract(
        UniswapV2Factory,
        UniswapV2FactoryABI,
        provider
      );
      console.log(factorycontract);
      let pairAddress = await factorycontract.getPair(
        token1Address,
        token2Address
      );
      if (!pairAddress || pairAddress === ethers.constants.AddressZero) {
        pairAddress = await createPair(token1Address, token2Address, signer);
        setStatus(`Pair created at address- ${pairAddress}`);
      } else {
        setStatus(`Pair already exists at address- ${pairAddress}`);
      }
      console.log("Pair Address:", await pairAddress);
    } catch (error) {
      console.error("Failed to create pair:", error);
      setStatus("Failed to create pair");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
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
      <h1>Create New Pair</h1>
      <div>
        <form>
        <label>Token 1 Address</label><br />
        <input
          type="text"
          placeholder="Token 1 Address"
          value={token1}
          onChange={(e) => setToken1(e.target.value)}
        /><br />
        <label>Token 2 Address</label><br />
        <input
          type="text"
          placeholder="Token 2 Address"
          value={token2}
          onChange={(e) => setToken2(e.target.value)}
        /><br />
        </form>
      </div>
      <button onClick={handleAction}>Create Pair</button>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
