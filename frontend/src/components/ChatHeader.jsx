import { ArrowLeft, Settings } from "lucide-react";
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
    <div className="p-2 md:p-3 border-b border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Back button for mobile */}
          <button 
            onClick={() => setSelectedChat(null)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-neutral-800 text-neutral-400 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            <img 
              src={chatProfilePic || "/avatar.png"} 
              alt={chatName}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
            />
            {!isGroup && onlineUsers.includes(selectedChat._id) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full ring-2 ring-neutral-950" />
            )}
          </div>

          {/* User/Group info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-neutral-100 text-sm truncate">
              {chatName}
            </h3>
            <p className="text-xs text-neutral-400 truncate">
              {chatStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Settings button (only for groups) */}
          {isGroup && (
            <button 
              onClick={() => setShowSettings(true)} 
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-neutral-800 text-neutral-400"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </div>

      {isGroup && showSettings && (
        <GroupSettingsModal group={selectedChat} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default ChatHeader;