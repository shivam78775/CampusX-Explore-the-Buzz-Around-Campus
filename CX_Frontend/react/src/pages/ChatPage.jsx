import React, { useState, useEffect } from "react";
import axios from "axios";
import UserList from "../components/ChatList";
import ChatHistory from "../components/ChatHistory";
import ChatWindow from "../components/ChatWindow";
import { fetchChatHistory } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import LoadingSkeleton from "../components/LoadingSkeleton";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ✅ Base URL

function ChatPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/v1/user/me`,
          { withCredentials: true }
        );
        setCurrentUser(res.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch chat history when current user is available
  const loadChatHistory = async () => {
    if (currentUser) {
      try {
        console.log("🔄 Loading chat history for user:", currentUser._id);
        const history = await fetchChatHistory(currentUser._id);
        console.log("📋 Chat history loaded:", history);
        setChatHistory(history);
      } catch (error) {
        console.error("❌ Failed to load chat history:", error);
      }
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [currentUser]);

  // Search user
  const handleSearch = async () => {
    if (query.trim() === "") {
      setFilteredUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/v1/user/search?username=${query}`,
        { withCredentials: true }
      );
      setFilteredUsers(res.data);
    } catch (error) {
      console.error("Search error:", error);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 animate-fadeIn">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" text="Loading user..." />
        </div>
      </div>
    );
  }

  // Mobile-first UI
  const renderListView = () => (
    <div className="flex flex-col h-screen w-full bg-gray-100 p-4 text-black animate-fadeIn">
      <h2 className="text-xl font-bold mb-4 animate-slideIn">Chat</h2>

      <div className="flex mb-4 bg-white rounded-lg p-1 animate-slideIn" style={{ animationDelay: '0.1s' }}>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-smooth ${
            activeTab === "history"
              ? "bg-yellow-400 text-black scale-105"
              : "text-gray-600 hover:text-gray-900 hover:scale-105"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-smooth ${
            activeTab === "search"
              ? "bg-yellow-400 text-black scale-105"
              : "text-gray-600 hover:text-gray-900 hover:scale-105"
          }`}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
      </div>

      {activeTab === "search" && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="p-2 mb-4 border rounded w-full transition-smooth focus:scale-105 animate-slideIn"
          style={{ animationDelay: '0.2s' }}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "history" ? (
          <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <ChatHistory
              chatHistory={chatHistory}
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32 animate-fadeIn">
            <LoadingSpinner size="md" color="blue" text="Searching..." />
          </div>
        ) : (
          <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <UserList users={filteredUsers} onSelectUser={setSelectedUser} />
          </div>
        )}
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="h-screen w-full animate-fadeIn">
      <ChatWindow
        currentUser={currentUser}
        selectedUser={selectedUser}
        onMessageSent={loadChatHistory}
        onBack={() => setSelectedUser(null)}
      />
    </div>
  );

  return selectedUser ? renderChatView() : renderListView();
}

export default ChatPage;
