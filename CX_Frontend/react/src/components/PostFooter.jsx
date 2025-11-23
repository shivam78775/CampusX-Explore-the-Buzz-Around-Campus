import React, { useState, useEffect } from "react";
import socket from "../socket";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MessageMultiple02Icon,
  Share01Icon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import CommentSection from "./CommentSection";
import SharePopup from "./SharePopup";

function PostFooter({ post, currentUserId }) {
  const [likes, setLikes] = useState(post?.likes || []);
  const [comments, setComments] = useState(post?.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  
 

  useEffect(() => {
    const handlePostLiked = ({ postId, updatedLikes }) => {
      if (postId === post._id) {
        setLikes(updatedLikes);
      }
    };

    socket.on("post-liked", handlePostLiked);

    return () => {
      socket.off("post-liked", handlePostLiked);
    };
  }, [post._id]);

  const handleLike = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/post/like-unlike/${post._id}`,
        {},
        { withCredentials: true }
      );

      // Update likes with the response from server
      setLikes(res.data.likes);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleShare = () => {
    setShowSharePopup(true);
  };

  return (
    <div>
      <div className="flex space-x-4 my-2 justify-between items-center">
        <div className="flex gap-2">
          {likes.includes(currentUserId) ? (
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            onClick={handleLike}
            className={`cursor-pointer transition-colors duration-200`}
          />) : (<HugeiconsIcon
            icon={ThumbsUpIcon}
            onClick={handleLike}
            className={`cursor-pointer transition-colors duration-200`}
          />)}

          <p className="text-sm pt-1 text-gray-500">{likes.length} Likes</p>
        </div>
        <div className="flex gap-2">
          <HugeiconsIcon
            icon={MessageMultiple02Icon}
            className="text-gray-600 cursor-pointer hover:text-blue-400 transition-colors duration-200"
            onClick={handleComment}
          />
          <p
            className="text-sm pt-1 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors duration-200"
            onClick={handleComment}
          >
            {comments.length} Comments
          </p>
        </div>

        <HugeiconsIcon 
          icon={Share01Icon} 
          className="text-gray-600 cursor-pointer hover:text-blue-400 transition-colors duration-200" 
          onClick={handleShare}
        />
      </div>
      
      <CommentSection 
        post={post} 
        isOpen={showComments} 
        onClose={() => setShowComments(false)}
      />
      
      <SharePopup 
        post={post} 
        isOpen={showSharePopup} 
        onClose={() => setShowSharePopup(false)}
      />
    </div>
  );
}

export default PostFooter;
