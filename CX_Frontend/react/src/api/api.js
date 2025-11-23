import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat`;

// Fetch messages between two users
export const fetchMessages = async (senderId, receiverId) => {
  try {
    const { data } = await axios.get(
      `${API_URL}/${senderId}/${receiverId}`,
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    throw new Error("Failed to load messages");
  }
};

// Send a new message
export const sendMessage = async (sender, receiver, content) => {
  try {
    const { data } = await axios.post(
      `${API_URL}`,
      { sender, receiver, content },
      { withCredentials: true }
    );
    return data;
  } catch (err) {
    throw new Error("Failed to send message");
  }
};

// Fetch chat history with users
export const fetchChatHistory = async (userId) => {
  try {
    const { data } = await axios.get(
      `${API_URL}/history/${userId}`,
      { withCredentials: true }
    );
    return data;
  } catch (error) {
    console.error("Fetch chat history error:", error);
    throw new Error("Failed to load chat history");
  }
};
