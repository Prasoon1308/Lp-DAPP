import Link from 'next/link';
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Home() {

  let [signer, setSigner] = useState("");
  let [provider, setProvider] = useState("");
  let [walletAddress, setWalletAddress] = useState("");
  let [network, setNetwork] = useState("");
  let [balance, setBalance] = useState("");
  let [connected, setConnected] = useState(false);

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
  console.log("signer:", signer, "provider:", provider);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
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
      <h1>Welcome to the Liquidity dApp</h1>
      <div style={{ margin: '20px' }}>
        <Link href="/mint">
          <button>Mint</button>
        </Link>
      </div>
      <div style={{ margin: '20px' }}>
        <Link href="/create-pair">
          <button>Create New Pair</button>
        </Link>
      </div>
      <div style={{ margin: '20px' }}>
        <Link href="/add-liquidity">
          <button>Add Liquidity</button>
        </Link>
      </div>
      <div style={{ margin: '20px' }}>
        <Link href="/remove-liquidity">
          <button>Remove Liquidity</button>
        </Link>
      </div>
      <div style={{ margin: '20px' }}>
        <Link href="/swap">
          <button>Swap Tokens</button>
        </Link>
      </div>
    </div>
  );
}
