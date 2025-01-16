import { useState } from "react";

export default function LiquidityForm({ action }) {
  const [token1, setToken1] = useState("");
  const [amount1, setAmount1] = useState("");
  const [token2, setToken2] = useState("");
  const [amount2, setAmount2] = useState("");

  const handleAction = () => {
    console.log(`${action} with:`, { token1, amount1, token2, amount2 });
    // Add logic to interact with the smart contract
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{action}</h1>
      <div>
        <form>
          <label>Token 1 Address: </label> <br />
          <input
            type="text"
            placeholder="Token 1 Address"
            title="Token 1 Address"
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
          /><br />
          <label>Amount of Token 1: </label><br />
          <input
            type="text"
            placeholder="Amount of Token 1"
            value={amount1}
            onChange={(e) => setAmount1(e.target.value)}
            disabled={!token1}
          /><br />
          <label>Token 2 Address: </label><br />
          <input
            type="text"
            placeholder="Token 2 Address"
            value={token2}
            onChange={(e) => setToken2(e.target.value)}
          /><br />
          <label>Amount of Token 2: </label><br />
          <input
          type="text"
          placeholder="Amount of Token 2"
          value={amount2}
          onChange={(e) => setAmount2(e.target.value)}
          disabled={!token2}
        /><br />
        </form>
      </div>
      <button onClick={handleAction}>{action}</button>
    </div>
  );
}
