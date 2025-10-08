import { X, Settings } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import GroupSettingsModal from "./GroupSettingsModal";

const ChatHeader = () => {
  const { selectedChat, setSelectedChat } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);

  if (!selectedChat) return null;

  const isGroup = selectedChat.type === "group";
  const chatName = isGroup ? selectedChat.name : selectedChat.fullName;
  const chatProfilePic = isGroup ? selectedChat.groupPic : selectedChat.profilePic;
  const chatStatus = isGroup 
    ? `${selectedChat.members.length} members` 
    : onlineUsers.includes(selectedChat._id) ? "Online" : "Offline";

  return (
    <div className="p-4 border-b border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={chatProfilePic || "/avatar.png"} 
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {!isGroup && onlineUsers.includes(selectedChat._id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-neutral-950" />
            )}
          </div>

          {/* User/Group info */}
          <div>
            <h3 className="font-medium text-neutral-100 text-sm">
              {chatName}
            </h3>
            <p className="text-xs text-neutral-400">
              {chatStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button (only for groups) */}
          {isGroup && (
            <button 
              onClick={() => setShowSettings(true)} 
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-transparent hover:bg-neutral-800 text-neutral-400"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Close button */}
          <button 
            onClick={() => setSelectedChat(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-transparent hover:bg-neutral-800 text-neutral-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isGroup && showSettings && (
        <GroupSettingsModal group={selectedChat} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default ChatHeader;