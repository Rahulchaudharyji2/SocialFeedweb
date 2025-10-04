import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Profile({ contract, posts }) {
  const [address, setAddress] = useState(null);
  const [reputation, setReputation] = useState(0);
  const [stats, setStats] = useState({
    posts: 0,
    likes: 0,
    comments: 0,
    tipsEth: "0.0",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const provider = contract?.provider ?? new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);

        if (contract?.getReputation) {
          try {
            const r = await contract.getReputation(addr);
            setReputation(Number(r)); // getReputation should return uint
          } catch (e) {
            console.warn("getReputation not available or failed", e);
          }
        }
      } catch (e) {
        // user not connected
      }
    };
    init();
  }, [contract]);

  useEffect(() => {
    if (!posts || !address) return;
    const userPosts = posts.filter(p => p.author && p.author.toLowerCase() === address.toLowerCase());
    const postsCount = userPosts.length;
    const likes = userPosts.reduce((acc, p) => acc + Number(p.likeCount || 0), 0);
    const comments = userPosts.reduce((acc, p) => acc + Number(p.commentCount || 0), 0);
    // sum tip amounts (BigInt)
    let totalTips = BigInt(0);
    userPosts.forEach(p => {
      try {
        const t = BigInt(p.tipAmount || 0);
        totalTips += t;
      } catch (e) {}
    });
    const tipsEth = ethers.formatEther(totalTips.toString());
    setStats({ posts: postsCount, likes, comments, tipsEth });
  }, [posts, address]);

  return (
    <div className="bg-gray-900 p-4 rounded-xl mb-6">
      <h3 className="text-lg font-semibold mb-2">Profile</h3>
      <p className="text-sm text-gray-300">Address: <span className="text-accent">{address ?? "Not connected"}</span></p>
      <p className="text-sm text-gray-300">Reputation: <span className="font-bold">{reputation}</span></p>

      <div className="mt-3 text-sm text-gray-300">
        <div>Posts: {stats.posts}</div>
        <div>Likes received: {stats.likes}</div>
        <div>Comments received: {stats.comments}</div>
        <div>Total tips received: {stats.tipsEth} ETH</div>
      </div>
    </div>
  );
}
