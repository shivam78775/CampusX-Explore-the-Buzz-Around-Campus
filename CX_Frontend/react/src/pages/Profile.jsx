import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Card } from "../components/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { Avatar } from "../components/Avatar";
import { Grid3X3, Video, FileText } from "lucide-react";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null);

  const defaultPostPic = "default.png";
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/profile/${username}`
        );
        setUser(res.data.user);
        // Filter out anonymous posts from user profile
        const nonAnonymousPosts = res.data.posts.filter(
          (post) => !post.isAnonymous
        );
        setPosts(nonAnonymousPosts);
        setIsFollowing(res.data.isFollowing);
        setLoggedInUserId(res.data.loggedInUserId);
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile.");
        setLoading(false);
        console.error("Profile fetch error:", err);
      }
    };

    if (username) fetchProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/follow/${user._id}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        setIsFollowing(!isFollowing);
        setUser((prev) => ({
          ...prev,
          followersCount: isFollowing
            ? prev.followersCount - 1
            : prev.followersCount + 1,
        }));
      }
    } catch (err) {
      console.error("Follow/Unfollow failed", err);
    }
  };

  if (loading)
    return <div className="text-center mt-10">Loading profile...</div>;
  if (error)
    return <div className="text-center text-red-500 mt-10">{error}</div>;

  const imagePosts = posts.filter(
    (post) => post.postpic && post.postpic !== defaultPostPic
  );
  const blogPosts = posts.filter(
    (post) => !post.postpic || post.postpic === defaultPostPic
  );

  return (
    <div className="min-h-screen w-screen flex justify-center bg-white overflow-x-hidden">
      <div className="flex justify-center p-4 bg-white min-h-screen text-black">
        <Card className="w-full max-w-md bg-white rounded-2xl mb-15">
          {/* Cover and Avatar */}
          <div className="relative">
            <img
              src={user.coverpic || "/default.png"}
              alt="Cover"
              className="w-full h-32 object-cover rounded-t-2xl"
            />
            <span className="w-24 h-24 overflow-hidden">
              <img
                src={user.profilepic || "/default.png"}
                alt="Avatar"
                className="w-24  rounded-full object-cover border-4 border-white absolute left-4 -bottom-12"
              />
            </span>
          </div>

          <div className="mt-16 px-4 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <p className="text-sm mt-1 text-gray-600">
                  {" "}
                  {user.bio || "🎓 CampusX Student"}
                </p>
              </div>

              {user._id !== loggedInUserId && (
                <span
                  className="bg-gradient-to-r from-[#eafe31] to-[#d2f93c] text-black rounded-full px-4 py-1 cursor-pointer"
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-between text-center mt-4">
              <div>
                <p className="font-bold">{user.postsCount}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <div>
                <p className="font-bold">{user.followersCount}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </div>
              <div>
                <p className="font-bold">{user.followingCount}</p>
                <p className="text-sm text-gray-500">Following</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="posts" className="mt-6 mb-6">
              <TabsList className="grid grid-cols-3 bg-gray-100 rounded-xl overflow-hidden">
                <TabsTrigger
                  value="posts"
                  onClick={() => setActiveTab("posts")}
                  className="flex justify-center items-center gap-1"
                >
                  <Grid3X3 className="w-4 h-4" /> Posts
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  onClick={() => setActiveTab("videos")}
                  className="flex justify-center items-center gap-1"
                >
                  <Video className="w-4 h-4" /> Videos
                </TabsTrigger>
                <TabsTrigger
                  value="blogs"
                  onClick={() => setActiveTab("blogs")}
                  className="flex justify-center items-center gap-1"
                >
                  <FileText className="w-4 h-4" /> Blogs
                </TabsTrigger>
              </TabsList>

              {/* Posts tab */}
              <TabsContent
                value="posts"
                className="grid grid-cols-3 gap-2 mt-4"
              >
                {imagePosts.length === 0 ? (
                  <p className="col-span-3 text-center text-gray-500">
                    No posts yet.
                  </p>
                ) : (
                  imagePosts.map((post) => (
                    <Link to={`/post/${post._id}`} key={post._id}>
                      <img
                        src={post.postpic}
                        alt="Post"
                        className="w-full h-32 object-cover rounded-lg border-[0.5px] border-gray-700"
                      />
                    </Link>
                  ))
                )}
              </TabsContent>

              {/* Videos tab */}
              <TabsContent
                value="videos"
                className="text-center text-gray-500 mt-4"
              >
                No videos yet.
              </TabsContent>

              {/* Blogs tab */}
              <TabsContent
                value="blogs"
                className="text-left text-gray-800 mt-4"
              >
                {blogPosts.length === 0 ? (
                  <p className="text-center text-gray-500">No blogs yet.</p>
                ) : (
                  blogPosts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-gray-50 rounded-xl shadow-sm text-black min-w-[350px] mb-11"
                    >
                      <div className="flex items-center p-3">
                        <Avatar className="w-10 h-10 mr-3" />
                        <div>
                          <p className="font-semibold text-black mx-2">
                            @{post?.username || "username"}
                          </p>
                          <p className="text-xs text-gray-500 mx-2">
                            {post?.date
                              ? new Date(post.date).toLocaleString()
                              : "• Just now"}
                          </p>
                        </div>
                      </div>
                      {post?.postpic && post.postpic !== "default" && (
                        <img
                          src={post.postpic}
                          alt="Post"
                          className="w-full object-cover"
                        />
                      )}
                      <div className="p-3">
                        <p className="text-sm">
                          <span className="font-semibold">
                            @{post?.username}
                          </span>{" "}
                          {post?.caption || "No description."}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>
        <Footer />
      </div>
    </div>
  );
}
