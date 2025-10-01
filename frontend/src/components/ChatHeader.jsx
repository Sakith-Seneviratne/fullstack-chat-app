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
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <img 
                src={selectedUser.profilePic || "/avatar.png"} 
                alt={selectedUser.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              {onlineUsers.includes(selectedUser._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
              )}
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                {selectedUser.fullName}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <img 
                  src={selectedGroup.groupPic || "/avatar.png"} 
                  alt={selectedGroup.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>

              {/* Group info */}
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                  {selectedGroup.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedGroup.members.length} members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings button */}
              <button 
                onClick={() => setShowSettings(true)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Close button */}
              <button 
                onClick={() => setSelectedGroup(null)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
              >
                <X className="w-5 h-5" />
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