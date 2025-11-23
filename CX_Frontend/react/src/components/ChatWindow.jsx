import { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import ScrollableFeed from "react-scrollable-feed";
import { fetchMessages, sendMessage } from "../api/api";

const ChatWindow = ({ selectedUser, currentUser, onMessageSent, onBack }) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    const socketInstance = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true,
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("🟢 Socket Connected:", socketInstance.id);
    });
    
    socketInstance.on("disconnect", () => {
      console.log("🔴 Socket Disconnected");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket Connection Error:", error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch chat history and mark messages as read
  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessagesFromBackend = async () => {
      try {
        const data = await fetchMessages(
          currentUser._id,
          selectedUser._id
        );
        setMessages(data);
        
        // Mark messages as read when opening chat
        await markMessagesAsRead(selectedUser._id, currentUser._id);
      } catch (err) {
        toast.error("Failed to load messages");
      }
    };
    fetchMessagesFromBackend();
  }, [selectedUser]);

  const markMessagesAsRead = async (senderId, receiverId) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/chat/mark-read/${senderId}/${receiverId}`, {
        method: 'PUT',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    socket.on("receive-message", (message) => {
      console.log("📨 Received message:", message);
      if (
        message.sender === selectedUser._id ||
        message.receiver === selectedUser._id
      ) {
        console.log("✅ Adding message to chat");
        setMessages((prev) => [...prev, message]);
      } else {
        console.log("❌ Message not for current chat");
      }
    });
    return () => socket.off("receive-message");
  }, [socket, selectedUser]);

  // Always scroll to the latest message
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  // Typing indicators
  useEffect(() => {
    if (!socket) return;
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedUser._id);
    }

    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;

    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedUser._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const sendMessageHandler = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && newMessage.trim()) {
      try {
        const message = await sendMessage(
          currentUser._id,
          selectedUser._id,
          newMessage
        );
        setNewMessage("");
        // Don't add message to state here - it will be added via socket event
        // This prevents duplicate messages on sender's side
        
        // Refresh chat history in parent component
        if (onMessageSent) {
          onMessageSent();
        }
      } catch (err) {
        toast.error("Failed to send message");
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* Top Bar */}
      <div className="flex items-center gap-3 p-3 border-b sticky top-0 z-10 bg-white">
        {onBack && (
          <button
            aria-label="Back"
            onClick={onBack}
            className="p-2 text-gray-700 hover:text-black"
          >
            <FaArrowLeft />
          </button>
        )}
        <img
          src={selectedUser?.profilepic || "/default.png"}
          alt={selectedUser?.username}
          className="w-10 h-10 rounded-full object-cover border border-gray-200"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">
            {selectedUser?.name || selectedUser?.username}
          </span>
          <span className="text-xs text-gray-500">@{selectedUser?.username}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50 p-4">
        <ScrollableFeed className="no-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 my-2 rounded-lg max-w-[75%] ${
                msg.sender === currentUser._id
                  ? "bg-blue-600 text-white self-end"
                  : "bg-gray-200 text-gray-800 self-start"
              }`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={endRef} />
        </ScrollableFeed>
        {isTyping && (
          <p className="text-sm text-gray-500 italic">typing...</p>
        )}
      </div>
      <div className="flex items-center p-3 gap-2 border-t">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={typingHandler}
          onKeyDown={sendMessageHandler}
          className="flex-1 border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-400"
        />
        <button
          onClick={(e) => sendMessageHandler({ type: "click" })}
          className="p-2 bg-blue-600 text-white rounded-md"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
