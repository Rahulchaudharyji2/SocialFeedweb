import React from "react";

export default function CommentList({ comments }) {
  return (
    <div className="border-t border-gray-700 pt-3">
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      ) : (
        comments.map((c, idx) => (
          <div key={idx} className="text-sm mb-1">
            <span className="text-accent">{c.commenter}</span>: {c.content}
          </div>
        ))
      )}
    </div>
  );
}
