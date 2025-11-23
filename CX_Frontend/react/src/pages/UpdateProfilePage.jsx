import React, { useState, useEffect } from "react";
import axios from "axios";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelSquareIcon } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router-dom";


export default function UpdateProfile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilepic, setProfilepic] = useState("");
  const [coverpic, setCoverpic] = useState("");
  const [previewProfile, setPreviewProfile] = useState("");
  const [previewCover, setPreviewCover] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/me`, {
          withCredentials: true,
        });
        const { name, bio, profilepic, coverpic } = res.data;
        setName(name);
        setBio(bio);
        setProfilepic(profilepic);
        setCoverpic(coverpic);
        setPreviewProfile(profilepic);
        setPreviewCover(coverpic);
      } catch (err) {
        console.error("Failed to load user data", err);
      }
    };
    fetchUserData();
  }, []);

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilepic(file);
      setPreviewProfile(URL.createObjectURL(file));
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverpic(file);
      setPreviewCover(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (profilepic) formData.append("profilepic", profilepic);
      if (coverpic) formData.append("coverpic", coverpic);

      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/update-profile`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Profile updated successfully!");
      navigate("/profile");
    } catch (err) {
      console.error("Error updating profile", err);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen w-screen flex justify-center bg-white overflow-x-hidden">
      <div className="max-w-md mx-auto mt-10 p-4 bg-white rounded-xl shadow text-black">
        <div className="flex justify-between">
          <h3 className="text-xl font-bold mb-4">Update Profile</h3>
          <span
            onClick={() => navigate("/profile")}
            className="cursor-pointer hover:opacity-70 transition font-bold"
          >
            <HugeiconsIcon icon={CancelSquareIcon} />
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium">Profile Picture</label>
            {previewProfile && (
              <img
                src={previewProfile}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            )}
            <input type="file" onChange={handleProfileUpload} />
          </div>

          <div>
            <label className="block text-sm font-medium">Cover Image</label>
            {previewCover && (
              <img
                src={previewCover}
                alt="Cover"
                className="w-full h-32 object-cover mb-2 rounded"
              />
            )}
            <input type="file" onChange={handleCoverUpload} />
          </div>

          <button
            type="submit"
            className="w-full  border-black underline bg-gray-500 py-2 rounded hover:bg-gray-600"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
