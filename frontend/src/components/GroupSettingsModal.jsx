import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Upload, UserPlus, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ group, onClose }) => {
  const { users, updateGroup, deleteGroup, addGroupMembers, removeGroupMember } = useChatStore();
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("info"); // "info" or "members"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold">Group Settings</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-300">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "text-primary border-b-2 border-primary"
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            Group Info
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "members"
                ? "text-primary border-b-2 border-primary"
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            Members ({group.members.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "info" ? (
            <div className="space-y-4">
              {/* Group Picture */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={previewUrl || "/avatar.png"}
                    alt="Group"
                    className="size-24 rounded-full object-cover"
                  />
                  {isAdmin && (
                    <label className="absolute bottom-0 right-0 bg-primary text-primary-content p-2 rounded-full cursor-pointer hover:bg-primary-focus">
                      <Upload className="size-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isAdmin && <p className="text-sm text-zinc-500">Click to change picture</p>}
              </div>

              {/* Group Name */}
              <div>
                <label className="label">
                  <span className="label-text">Group Name</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="input input-bordered w-full"
                  disabled={!isAdmin}
                />
              </div>

              {/* Group Description */}
              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  disabled={!isAdmin}
                />
              </div>

              {/* Admin Info */}
              <div>
                <label className="label">
                  <span className="label-text">Group Admin</span>
                </label>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <img
                    src={group.admin.profilePic || "/avatar.png"}
                    alt={group.admin.fullName}
                    className="size-10 rounded-full"
                  />
                  <span>{group.admin.fullName}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin ? (
                <div className="space-y-2 pt-2">
                  <button onClick={handleUpdateGroup} className="btn btn-primary w-full">
                    Save Changes
                  </button>
                  <button onClick={handleDeleteGroup} className="btn btn-error w-full">
                    <Trash2 className="size-4 mr-2" />
                    Delete Group
                  </button>
                </div>
              ) : (
                <button onClick={handleLeaveGroup} className="btn btn-error w-full">
                  <LogOut className="size-4 mr-2" />
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
                  className="btn btn-primary w-full"
                >
                  <UserPlus className="size-4 mr-2" />
                  Add Members
                </button>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.profilePic || "/avatar.png"}
                        alt={member.fullName}
                        className="size-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{member.fullName}</p>
                        {member._id === group.admin._id && (
                          <p className="text-xs text-primary">Admin</p>
                        )}
                      </div>
                    </div>

                    {isAdmin && member._id !== group.admin._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="btn btn-sm btn-ghost btn-circle text-error"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <h3 className="text-lg font-semibold">Add Members</h3>
              <button
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                }}
                className="btn btn-sm btn-ghost btn-circle"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {availableUsers.length === 0 ? (
                <p className="text-center text-zinc-500 py-4">No more users to add</p>
              ) : (
                <>
                  <div className="border border-base-300 rounded-lg max-h-60 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer"
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
                          className="checkbox checkbox-sm"
                        />
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="size-10 rounded-full"
                        />
                        <span className="flex-1">{user.fullName}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddMembers(false);
                        setSelectedNewMembers([]);
                      }}
                      className="btn btn-ghost flex-1"
                    >
                      Cancel
                    </button>
                    <button onClick={handleAddMembers} className="btn btn-primary flex-1">
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