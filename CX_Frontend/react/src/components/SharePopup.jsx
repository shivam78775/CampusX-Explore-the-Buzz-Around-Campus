import React, { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SentIcon, Search01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "./LoadingSpinner";
import LoadingSkeleton from "./LoadingSkeleton";

function SharePopup({ post, isOpen, onClose }) {
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen]);

  // Debounced search for users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/history`,
        { withCredentials: true }
      );
      console.log("Chat history response:", res.data);
      setChats(res.data || []);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/search?username=${searchQuery}`,
        { withCredentials: true }
      );
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;

    setIsSending(true);
    try {
      const postUrl = `${window.location.origin}/post/${post._id}`;
      const shareMessage = post.isAnonymous 
        ? `Check out this anonymous post: ${postUrl}`
        : `Check out this post by @${post.user?.username}: ${postUrl}`;

      // Send to each selected user
      const promises = selectedUsers.map(userId => 
        axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/send`,
          {
            receiverId: userId,
            message: shareMessage,
            type: "post_share",
            postId: post._id
          },
          { withCredentials: true }
        )
      );

      await Promise.all(promises);
      
      // Reset and close
      setSelectedUsers([]);
      onClose();
      alert("Post shared successfully!");
    } catch (err) {
      console.error("Error sharing post:", err);
      alert("Failed to share post. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      alert("Post link copied to clipboard!");
    });
  };

  // Get users to display - either search results or filtered chat history
  const getDisplayUsers = () => {
    if (searchQuery.trim()) {
      // When searching, show search results
      return searchResults.map(user => ({
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          profilepic: user.profilepic
        }
      }));
    } else {
      // When not searching, show chat history
      return chats;
    }
  };

  const displayUsers = getDisplayUsers().filter(item => item && item.user);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Copy Link Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Copy Link</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <HugeiconsIcon 
              icon={Search01Icon} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center animate-fadeIn">
              <LoadingSpinner size="lg" color="blue" text="Loading chats..." />
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center animate-fadeIn">
              <LoadingSpinner size="lg" color="blue" text="Searching users..." />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center animate-fadeIn">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                {searchQuery ? "No users found" : "No chat history found"}
              </p>
            </div>
          ) : (
            <div className="p-2 animate-fadeIn">
              {searchQuery && (
                <div className="px-3 py-2 text-xs text-gray-500 font-medium animate-slideIn">
                  Search Results
                </div>
              )}
              {!searchQuery && chats.length > 0 && (
                <div className="px-3 py-2 text-xs text-gray-500 font-medium animate-slideIn">
                  Recent Chats
                </div>
              )}
              {displayUsers.map((chat, index) => {
                if (!chat || !chat.user) return null;
                
                return (
                  <div
                    key={chat.user._id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-smooth hover:scale-[1.02] animate-slideIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleUserSelect(chat.user._id)}
                  >
                    <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden flex-shrink-0 transition-smooth hover:shadow-md">
                      <img
                        src={chat.user.profilepic || "/default.png"}
                        alt={chat.user.username || "User"}
                        className="w-full h-full object-cover transition-smooth hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        @{chat.user.username || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.user.name || "No name"}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-smooth ${
                      selectedUsers.includes(chat.user._id)
                        ? "bg-blue-500 border-blue-500 scale-110"
                        : "border-gray-300 hover:border-blue-300"
                    }`}>
                      {selectedUsers.includes(chat.user._id) && (
                        <span className="text-white text-xs animate-scaleIn">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedUsers.length} selected
            </span>
            <button
              onClick={handleSend}
              disabled={selectedUsers.length === 0 || isSending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-smooth hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span className="text-sm animate-pulse">Sending...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={SentIcon} className="w-4 h-4 transition-smooth" />
                  <span className="text-sm">Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharePopup;
