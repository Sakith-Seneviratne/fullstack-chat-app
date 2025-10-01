import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className=" pt-20 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-blue-50 to-white dark:from-neutral-800 dark:to-neutral-900">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Profile</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">Your profile information</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-neutral-100 dark:ring-neutral-800 shadow-lg"
                />
                <label
                  htmlFor="avatar-upload"
                  className={`
                    absolute bottom-0 right-0 
                    bg-blue-600 hover:bg-blue-700 text-white
                    p-2 rounded-full cursor-pointer 
                    transition-colors shadow-lg
                    ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-70" : ""}
                  `}
                >
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                </label>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
              </p>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <div className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  {authUser?.fullName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                  {authUser?.email}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 p-6">
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Member Since</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {authUser.createdAt?.split("T")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Account Status</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-500">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;