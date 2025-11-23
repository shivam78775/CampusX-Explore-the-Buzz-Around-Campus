import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Post from "../components/Post";
import Footer from "../components/Footer";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default function SinglePostPage({ currentUserId }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/post/${postId}`,
          {
            withCredentials: true,
          }
        );
        setPost(res.data);
      } catch (err) {
        console.error("Error loading post", err);
      }
    };
    fetchPost();
  }, [postId]);

  if (!post) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen w-screen flex justify-center bg-white overflow-x-hidden">
      <div className="max-w-xl mx-auto mt-6 p-4 bg-white rounded-xl shadow text-black">
        <div className="flex justify-start items-center gap-5 pb-5">
          <span
            onClick={() => navigate(-1)}
            className="cursor-pointer hover:opacity-70 transition font-bold"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="w-8 h-8 text-gray-500"
            />
          </span>
          <h2 className="font-bold text-2xl">Posts</h2>
        </div>
        <Post post={post} currentUserId={currentUserId} />
      </div>
      <Footer />
    </div>
  );
}
