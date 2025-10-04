import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import CommentList from "./CommentList";
import TipModal from "./TipModal";

export default function PostCard({ post, contract }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [showERC20Modal, setShowERC20Modal] = useState(false);

  // Load all comments for a post
  const loadComments = async () => {
    try {
      const c = await contract.getComments(post.id);
      setComments(c);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  // Like post (one per user)
  const likePost = async () => {
    try {
      const tx = await contract.likePost(post.id);
      await tx.wait();
      alert("Post liked!");
    } catch (err) {
      alert("You already liked this post or something went wrong.");
      console.error(err);
    }
  };

  // Add comment
  const addComment = async () => {
    if (!comment.trim()) return alert("Please write something!");
    try {
      const tx = await contract.commentOnPost(post.id, comment);
      await tx.wait();
      setComment("");
      loadComments();
    } catch (err) {
      console.error("Error commenting:", err);
    }
  };

  // Tip with native token (ETH)
  const tipPost = async () => {
    const eth = prompt("Enter tip amount in ETH:");
    if (!eth) return;
    try {
      const tx = await contract.tipPost(post.id, { value: ethers.parseEther(eth) });
      await tx.wait();
      alert("Tip sent successfully!");
    } catch (err) {
      console.error("Error sending tip:", err);
    }
  };

  // Show ERC20 modal
  const openERC20Modal = () => {
    setShowERC20Modal(true);
  };

  useEffect(() => {
    if (contract) loadComments();
  }, [contract]);

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-accent/30 transition">
      <h3 className="text-xl font-semibold mb-2">{post.content}</h3>
      <p className="text-sm text-gray-400 mb-2">By: {post.author}</p>
      <p className="text-sm text-gray-400 mb-4">
        ❤️ {post.likeCount.toString()} | 💬 {post.commentCount.toString()} | 💰{" "}
        {ethers.formatEther(post.tipAmount || 0)} ETH
      </p>

      <div className="flex space-x-3 mb-4">
        <button
          onClick={likePost}
          className="bg-accent px-4 py-2 rounded-xl hover:brightness-110"
        >
          Like
        </button>
        <button
          onClick={tipPost}
          className="bg-green-600 px-4 py-2 rounded-xl hover:brightness-110"
        >
          Tip (ETH)
        </button>
        <button
          onClick={openERC20Modal}
          className="bg-blue-600 px-4 py-2 rounded-xl hover:brightness-110"
        >
          Tip (ERC20)
        </button>
      </div>

      <div className="flex mb-4">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-gray-800 p-2 rounded-l-xl outline-none"
        />
        <button
          onClick={addComment}
          className="bg-accent px-4 rounded-r-xl"
        >
          Send
        </button>
      </div>

      <CommentList comments={comments} />

      {showERC20Modal && (
        <TipModal
          postId={post.id}
          contract={contract}
          onClose={() => setShowERC20Modal(false)}
        />
      )}
    </div>
  );
}
