import { useEffect, useState } from "react";
import StorySection from "../components/StorySection";
import Footer from "../components/Footer";
import Post from "../components/Post";
import Logo from "../assets/Logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MessengerIcon, Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import LoadingSpinner from "../components/LoadingSpinner";
import LoadingSkeleton from "../components/LoadingSkeleton";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BASE_URL}/api/v1`;

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API}/post/all`, {
          withCredentials: true,
        });

        let nonAnonymousPosts = res.data.filter(post => !post.isAnonymous);
        nonAnonymousPosts = nonAnonymousPosts.sort(() => Math.random() - 0.5);

        setPosts(nonAnonymousPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUnreadCounts = async () => {
      if (user) {
        setIsLoadingCounts(true);
        try {
          const messageRes = await axios.get(`${API}/notifications/unread-messages`, {
            withCredentials: true,
          });
          setUnreadMessageCount(messageRes.data.totalUnreadCount);

          const notificationRes = await axios.get(`${API}/notifications/unread-count`, {
            withCredentials: true,
          });
          setUnreadNotificationCount(notificationRes.data.unreadCount);
        } catch (error) {
          console.error("Error fetching unread counts:", error);
        } finally {
          setIsLoadingCounts(false);
        }
      }
    };

    fetchPosts();
    fetchUnreadCounts();
  }, [user]);

  // Real-time Socket Connection
  useEffect(() => {
    if (user) {
      const socketInstance = io(BASE_URL, {
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on("new_notification", () => {
        setUnreadNotificationCount(prev => prev + 1);
      });

      socketInstance.on("receive-message", () => {
        setUnreadMessageCount(prev => prev + 1);
      });

      return () => socketInstance.disconnect();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-white w-screen px-6 animate-fadeIn">
        <div className="min-h-screen bg-white flex justify-center">
          <div className="w-full max-w-md bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="h-20 w-32 bg-gray-200 rounded animate-shimmer"></div>
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-shimmer"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-shimmer"></div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex space-x-4 overflow-x-auto">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-shimmer mb-2"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <LoadingSkeleton key={index} type="post" className="animate-fadeIn" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white w-screen px-6 animate-fadeIn">
      <div className="min-h-screen bg-white flex justify-center">
        <div className="w-full max-w-md bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 mb-[-40px] py-3 animate-slideIn">
            <img src={Logo} alt="CampusX Logo" className="h-20 transition-smooth hover:scale-105" />
            <div className="flex space-x-3">
              <div className="relative">
                <span
                  className="text-black bg-gray-200 rounded-full p-2 cursor-pointer transition-smooth hover:bg-gray-300 hover:scale-110"
                  onClick={() => navigate("/notifications")}
                >
                  <HugeiconsIcon icon={Notification03Icon} />
                </span>
                {!isLoadingCounts && unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce-slow">
                    {unreadNotificationCount}
                  </span>
                )}
                {isLoadingCounts && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="relative">
                <span
                  className="text-black bg-gray-200 rounded-full p-2 cursor-pointer transition-smooth hover:bg-gray-300 hover:scale-110"
                  onClick={() => navigate("/chat")}
                >
                  <HugeiconsIcon icon={MessengerIcon} />
                </span>
                {!isLoadingCounts && unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lime-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-bounce-slow">
                    {unreadMessageCount}
                  </span>
                )}
                {isLoadingCounts && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          <div className="animate-slideIn" style={{ animationDelay: "0.1s" }}>
            <h2 className="lobster text-2xl p-4">Explore the Buzz Around Campus</h2>
          </div>

          {/* Posts */}
          <div className="p-4 space-y-6">
            {posts.map((post, index) => (
              <div
                key={post._id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Post post={post} currentUserId={user?._id} />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="animate-slideIn" style={{ animationDelay: "0.2s" }}>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
