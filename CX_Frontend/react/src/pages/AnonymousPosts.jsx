import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Post from "../components/Post";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function AnonymousPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAnonymousPosts();
  }, []);

  const fetchAnonymousPosts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/post/anonymous`,
        { withCredentials: true }
      );

      // Randomize posts for variety
      let shuffledPosts = res.data.sort(() => Math.random() - 0.5);

      setPosts(shuffledPosts);
    } catch (err) {
      console.error("Error fetching anonymous posts:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-white animate-fadeIn">
        <div className="text-center">
          <LoadingSpinner size="xl" color="green" text="Loading anonymous posts..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-white px-4 pt-8 pb-20 overflow-x-hidden animate-fadeIn">
      <div className="w-full max-w-md min-w-[350px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slideIn">
          <span
            onClick={() => navigate(-1)}
            className="cursor-pointer hover:opacity-70 transition-smooth hover:scale-110"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="w-8 h-8 text-gray-500"
            />
          </span>
          <div className="text-center">
            <h2 className="text-xl font-bold text-black">Anonymous Posts</h2>
            <p className="text-sm text-gray-500">Share your thoughts anonymously</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Anonymous Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="w-8 h-8 text-gray-400"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Anonymous Posts Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to share your thoughts anonymously
              </p>
              <button
                onClick={() => navigate("/create-post")}
                className="bg-gradient-to-r from-[#eafe31] to-[#d2f93c] text-black font-semibold py-3 px-6 rounded-2xl shadow-md hover:opacity-90 transition-smooth hover:scale-105"
              >
                Create Anonymous Post
              </button>
            </div>
          ) : (
            posts.map((post, index) => (
              <div 
                key={post._id} 
                className="animate-fadeIn" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Post post={post} currentUserId={user?._id} />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
          <Footer />
        </div>

      </div>
    </div>
  );
}
