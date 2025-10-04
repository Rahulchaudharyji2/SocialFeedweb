import React, { useState } from "react";
import { ethers } from "ethers";

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

export default function TipModal({ postId, contract, contractAddress, onClose, onTipped }) {
  const [tokenAddr, setTokenAddr] = useState("");
  const [tokenMeta, setTokenMeta] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // load token metadata (symbol, decimals, name)
  const loadTokenMeta = async () => {
    if (!tokenAddr) return alert("Enter token contract address first");
    try {
      const provider = contract?.provider ?? new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      const [symbol, decimals, name] = await Promise.all([
        token.symbol(),
        token.decimals(),
        token.name()
      ]);
      setTokenMeta({ symbol, decimals: Number(decimals), name });
    } catch (e) {
      console.error(e);
      alert("Invalid token contract or token doesn't implement ERC20 standard methods.");
    }
  };

  // main flow: check allowance -> approve if needed -> call tipPostERC20
  const handleSend = async () => {
    if (!tokenAddr || !amount || !tokenMeta) return alert("Provide token, load token, and amount");
    setLoading(true);
    try {
      const provider = contract?.provider ?? new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const token = new ethers.Contract(tokenAddr, ERC20_ABI, signer);

      // parse amount according to token decimals
      const amountParsed = ethers.parseUnits(amount, tokenMeta.decimals); // BigInt

      // check allowance
      const allowance = await token.allowance(me, contractAddress); // BigInt
      if (allowance < amountParsed) {
        // need to approve the SocialFeed contract to spend tokens
        const txApprove = await token.approve(contractAddress, amountParsed);
        await txApprove.wait();
      }

      // call contract tip function
      const tx = await contract.tipPostERC20(postId, tokenAddr, amountParsed);
      await tx.wait();
      onTipped && onTipped();
      onClose();
    } catch (e) {
      console.error(e);
      alert("ERC20 tip failed: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tip with ERC-20</h3>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <label className="text-sm text-gray-300">Token contract address</label>
        <input
          value={tokenAddr}
          onChange={(e) => setTokenAddr(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 p-2 rounded my-2"
        />
        <div className="flex gap-2 mb-2">
          <button onClick={loadTokenMeta} className="bg-accent px-4 py-2 rounded">Load Token</button>
          {tokenMeta && <div className="text-sm text-gray-300 px-2 py-2">Loaded: {tokenMeta.symbol} ({tokenMeta.name})</div>}
        </div>

        <label className="text-sm text-gray-300">Amount ({tokenMeta?.symbol ?? 'token'})</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 10.5"
          className="w-full bg-gray-800 p-2 rounded my-2"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600"
          >
            {loading ? "Processing..." : "Approve & Tip"}
          </button>
        </div>
      </div>
    </div>
  );
}
