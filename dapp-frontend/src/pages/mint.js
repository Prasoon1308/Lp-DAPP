import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tokenABI from "../../ABI/Token";
import {
  UniswapV2Router02,
  UniswapV2Factory,
} from "../_utils/contractAddresses";
import UniswapV2RouterABI from "../../ABI/UniswapV2Router";
import UniswapV2FactoryABI from "../../ABI/UniswapV2Factory";
import UniswapV2Pair from "../../ABI/UniswapV2Pair";

export default function Mint() {
  let [signer, setSigner] = useState("");
  let [provider, setProvider] = useState("");
  let [walletAddress, setWalletAddress] = useState("");
  let [network, setNetwork] = useState("");
  let [balance, setBalance] = useState("");
  let [connected, setConnected] = useState(false);
  let [status1, setStatus1] = useState("");
  let [status2, setStatus2] = useState("");

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
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleAction1 = () => {
    console.log("Action1:", amount1);
    handleMintToken1(amount1);
  };
  const handleAction2 = () => {
    console.log("Action2:", amount2);
    handleMintToken2(amount2);
  };

  const handleMintToken1 = async (amount) => {
    try {
      console.log(
        "Mint1:",
        "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
        amount
      );
      const token1Contract = new ethers.Contract(
        "0x0e87a6042699d79C0a9221D0114E9Cb874B32c27",
        tokenABI,
        signer
      );
      const amount1Wei = ethers.utils.parseEther(amount);
      const mintTx = await token1Contract.mint(walletAddress, amount1Wei);
      console.log("Minted Token 1");
      setStatus1(
        `Minted successfully! Transaction Hash: ${await mintTx.hash}`
      );
    } catch (error) {
      console.log("Error while minting Token 1:", error);
      setStatus1("Error while minting Token 1");
    }
  };
  const handleMintToken2 = async (amount) => {
    try {
      console.log(
        "Mint2:",
        "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4",
        amount
      );
      const token2Contract = new ethers.Contract(
        "0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4",
        tokenABI,
        signer
      );
      const amount2Wei = ethers.utils.parseEther(amount);
      const mintTx = await token2Contract.mint(walletAddress, amount2Wei);
      console.log("Minted Token 2");
      setStatus2(
        `Minted successfully! Transaction Hash: ${await mintTx.hash}`
      );
    } catch (error) {
      console.log("Error while minting Token 2:", error);
      setStatus2("Error while minting Token 2");
    }
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
        <h1>Mint</h1>
        <div>
          <form>
            <label>Token 1 Address: </label> <br />
            <input
              type="text"
              placeholder="Token 1 Address"
              title="Token 1 Address"
              value="0x0e87a6042699d79C0a9221D0114E9Cb874B32c27"
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
          </form>
          <button onClick={handleAction1}>Mint Token1</button>
          <br />
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>Status1: {status1}</p>
        </div>

        <div>
          <form>
            <label>Token 2 Address: </label>
            <br />
            <input
              type="text"
              placeholder="Token 2 Address"
              value="0xDC89D11E9Fd37499B7643A9E0a60Ae4187A838A4"
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
        <button onClick={handleAction2}>Mint Token 2</button>
        <br />
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Status2: {status2}</p>
      </div>
    </div>
  );
}
