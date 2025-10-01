import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Upload, UserPlus, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ group, onClose }) => {
  const { users, updateGroup, deleteGroup, addGroupMembers, removeGroupMember } = useChatStore();
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("info");
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description || "");
  const [groupPic, setGroupPic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(group.groupPic);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const isAdmin = group.admin._id === authUser._id;
  const currentMemberIds = group.members.map((m) => m._id);
  const availableUsers = users.filter((u) => !currentMemberIds.includes(u._id));

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

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      await updateGroup(group._id, {
        name: groupName,
        description: groupDescription,
        groupPic: groupPic,
      });
      toast.success("Group updated");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        await deleteGroup(group._id);
        onClose();
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) {
      toast.error("Select at least one member");
      return;
    }

    try {
      await addGroupMembers(group._id, selectedNewMembers);
      setShowAddMembers(false);
      setSelectedNewMembers([]);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await removeGroupMember(group._id, memberId);
      } catch (error) {
        // Error handled in store
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await removeGroupMember(group._id, authUser._id);
        onClose();
      } catch (error) {
        // Error handled in store
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Group Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === "info"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Group Info
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === "members"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            Members ({group.members.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === "info" ? (
              <div className="space-y-6">
                {/* Group Picture */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img
                      src={previewUrl || "/avatar.png"}
                      alt="Group"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-neutral-100 dark:ring-neutral-800"
                    />
                    {isAdmin && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {isAdmin && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Click to change picture
                    </p>
                  )}
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isAdmin}
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
                    placeholder="Enter group description"
                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    rows="3"
                    disabled={!isAdmin}
                  />
                </div>

                {/* Admin Info */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Group Admin
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <img
                      src={group.admin.profilePic || "/avatar.png"}
                      alt={group.admin.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-neutral-900 dark:text-neutral-100 text-sm">
                      {group.admin.fullName}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isAdmin ? (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleUpdateGroup}
                      className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Group
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Leave Group
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Members Button */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Members
                  </button>
                )}

                {/* Members List */}
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.profilePic || "/avatar.png"}
                          alt={member.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                            {member.fullName}
                          </p>
                          {member._id === group.admin._id && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">Admin</p>
                          )}
                        </div>
                      </div>

                      {isAdmin && member._id !== group.admin._id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Add Members
              </h3>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {availableUsers.length === 0 ? (
                <p className="text-center text-neutral-500 dark:text-neutral-400 py-8 text-sm">
                  No more users to add
                </p>
              ) : (
                <>
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-neutral-800">
                    {availableUsers.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNewMembers.includes(user._id)}
                          onChange={() => {
                            setSelectedNewMembers((prev) =>
                              prev.includes(user._id)
                                ? prev.filter((id) => id !== user._id)
                                : [...prev, user._id]
                            );
                          }}
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

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddMembers(false);
                        setSelectedNewMembers([]);
                      }}
                      className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMembers}
                      className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Add ({selectedNewMembers.length})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettingsModal;