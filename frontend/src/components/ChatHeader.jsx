import { X, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import GroupSettingsModal from "./GroupSettingsModal";

const ChatHeader = () => {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);

  if (selectedUser) {
    return (
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <>
        <div className="p-2.5 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="avatar">
                <div className="size-10 rounded-full relative">
                  <img src={selectedGroup.groupPic || "/avatar.png"} alt={selectedGroup.name} />
                </div>
              </div>

              {/* Group info */}
              <div>
                <h3 className="font-medium">{selectedGroup.name}</h3>
                <p className="text-sm text-base-content/70">{selectedGroup.members.length} members</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings button */}
              <button onClick={() => setShowSettings(true)} className="btn btn-sm btn-ghost btn-circle">
                <Settings className="size-5" />
              </button>

              {/* Close button */}
              <button onClick={() => setSelectedGroup(null)} className="btn btn-sm btn-ghost btn-circle">
                <X />
              </button>
            </div>
          </div>
        </div>

        {showSettings && (
          <GroupSettingsModal group={selectedGroup} onClose={() => setShowSettings(false)} />
        )}
      </>
    );
  }

  return null;
};

export default ChatHeader;