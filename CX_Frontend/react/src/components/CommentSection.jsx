import React, { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SentIcon } from "@hugeicons/core-free-icons";

function CommentSection({ post, isOpen, onClose }) {
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setComments(post?.comments || []);
  }, [post?.comments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/post/comment/${post._id}`,
        { text: newComment.trim() },
        { withCredentials: true }
      );

      // Add the new comment to the list
      setComments(prev => [...prev, res.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50 rounded-b-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Comments ({comments.length})</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Comments List */}
      <div className="max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {comments.filter(comment => comment && comment.text).map((comment, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden flex-shrink-0">
                  <img
                    src={comment.user?.profilepic || "/default.png"}
                    alt={comment.user?.username || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800">
                        @{comment.user?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(comment.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <div className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden flex-shrink-0">
            <img
              src="/default.png"
              alt="Your profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <HugeiconsIcon icon={SentIcon} className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommentSection;
