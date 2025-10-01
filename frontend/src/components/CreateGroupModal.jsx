import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Upload } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ onClose }) => {
  const { users, createGroup } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupPic, setGroupPic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPic(reader.result);
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Select at least one member");
      return;
    }

    try {
      await createGroup({
        name: groupName,
        description: groupDescription,
        members: selectedMembers,
        groupPic: groupPic,
      });
      onClose();
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Group Picture */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={previewUrl || "/avatar.png"}
                  alt="Group"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-neutral-100 dark:ring-neutral-800"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Upload group picture
              </p>
            </div>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
                required
              />
            </div>

            {/* Group Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Enter group description (optional)"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all resize-none"
                rows="3"
              />
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Select Members <span className="text-red-500">*</span>
                </label>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {selectedMembers.length} selected
                </span>
              </div>
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-neutral-800">
                {users.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => toggleMember(user._id)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="flex-1 text-neutral-900 dark:text-neutral-100 text-sm">
                      {user.fullName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;