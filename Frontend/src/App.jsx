import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import SocialFeedABI from "./contract/SocialFeed.json";
import PostCard from "./components/PostCard";

const CONTRACT_ADDRESS = "0x260342e0AB8e0089329192D76a0D0a14a4934A71";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, SocialFeedABI.abi, signer);
      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(address);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // Load posts
  const loadPosts = async () => {
    if (!contract) return;
    try {
      const postCount = await contract.postCount();
      const loadedPosts = [];
      for (let i = 1; i <= postCount; i++) {
        const post = await contract.getPost(i);
        loadedPosts.push({ id: i, ...post });
      }
      setPosts(loadedPosts.reverse());
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };

  // Create a new post
  const handleCreatePost = async () => {
    if (!newPost.trim() || !contract) return;
    try {
      setLoading(true);
      const tx = await contract.createPost(newPost);
      await tx.wait();
      setNewPost("");
      await loadPosts();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) loadPosts();
  }, [contract]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center py-12 px-4 font-poppins">
      {!signer ? (
        <button
          onClick={connectWallet}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-extrabold text-center mb-8">
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              On-Chain Social Feed
            </span>
          </h1>

          {/* Profile Section */}
          <div className="text-center text-gray-400 mb-6">
            Connected:{" "}
            <span className="text-orange-400 font-semibold">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
          </div>

          {/* Post Input Section */}
          <div className="flex items-center bg-gray-800/60 rounded-2xl overflow-hidden shadow-md mb-10">
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent text-white px-4 py-3 outline-none"
            />
            <button
              onClick={handleCreatePost}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>

          {/* Posts Section */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  contract={contract}
                  contractAddress={CONTRACT_ADDRESS}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 py-10 italic">
                No posts yet — start the conversation!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
