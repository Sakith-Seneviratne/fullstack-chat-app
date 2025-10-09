import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, File, Download } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getChatMessages,
    isMessagesLoading,
    selectedChat,
    subscribeToChatMessages,
    unsubscribeFromChatMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      getChatMessages(selectedChat._id, selectedChat.type === 'group');
      subscribeToChatMessages();
    }

    return () => unsubscribeFromChatMessages();
  }, [
    selectedChat,
    getChatMessages,
    subscribeToChatMessages,
    unsubscribeFromChatMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (!messages.length || !authUser || !selectedChat) return;

    // Find unread messages not sent by current user
    const unreadMessages = messages.filter((msg) => {
      const senderId = msg.senderId?.['_id'] || msg.senderId;
      const isOwnMessage = senderId === authUser._id;
      const isRead = msg.readBy?.some((r) => r.user === authUser._id);
      return !isOwnMessage && !isRead;
    });

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg._id);
      
      // Mark as read locally and on server
      markMessagesAsRead(messageIds, selectedChat.type === 'group', selectedChat._id);

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("messages:read", {
          messageIds,
          chatId: selectedChat._id,
          isGroup: selectedChat.type === 'group',
        });
      }
    }
  }, [messages, authUser, socket, selectedChat, markMessagesAsRead]);

  // Add this useEffect after your existing useEffects
useEffect(() => {
  if (selectedChat?.type === 'group' && socket) {
    // Join the group room
    socket.emit("joinGroup", selectedChat._id);
    console.log("🏠 Joined group room:", selectedChat._id);
    
    return () => {
      // Leave the group room when switching chats
      socket.emit("leaveGroup", selectedChat._id);
      console.log("🚪 Left group room:", selectedChat._id);
    };
  }
}, [selectedChat, socket]);

  // Helper function to check if message is read
  const getReadStatus = (message) => {
    const senderId = message.senderId?.['_id'] || message.senderId;
    const isOwnMessage = senderId === authUser._id;

    if (!isOwnMessage) return null;

    if (!message.readBy || message.readBy.length === 0) {
      return { status: "sent", icon: Check };
    }

    // Check if read by anyone other than sender
    const readByOthers = message.readBy.filter((r) => r.user !== authUser._id);
    
    if (readByOthers.length > 0) {
      return { status: "read", icon: CheckCheck, isRead: true };
    }

    return { status: "delivered", icon: CheckCheck, isRead: false };
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (!selectedChat) return null;

  return (
    <div className="bg-neutral-900 flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {Array.isArray(messages) && messages.map((message, index) => {
          const senderId = message.senderId?.['_id'] || message.senderId;
          const isOwnMessage = senderId === authUser._id;
          const readStatus = getReadStatus(message);
          const isGroup = selectedChat.type === 'group';

          return (
            <div
              key={message._id || index}
              className={`flex items-start gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
              {...(index === messages.length - 1 && { ref: messageEndRef })}
            >
              {!isOwnMessage && (
                <div className="shrink-0">
                  <img
                    src={isGroup ? message.senderId?.profilePic || "/avatar.png" : selectedChat.profilePic || "/avatar.png"}
                    alt="profile pic"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                  />
                </div>
              )}

              <div className={`flex flex-col max-w-xs sm:max-w-md ${isOwnMessage ? "items-end" : "items-start"}`}>
                <div className={`flex items-center gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                  {isGroup && !isOwnMessage && (
                    <span className="text-sm font-medium text-neutral-200">
                      {message.senderId?.fullName || "Unknown"}
                    </span>
                  )}
                  <time className="text-xs text-neutral-400">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                
                <div className={`flex flex-col mt-1 p-3 rounded-lg shadow-md ${
                  isOwnMessage ? "bg-neutral-600 text-neutral-100" : "bg-neutral-700 text-neutral-100"
                }`}>
                  {/* Image Attachment */}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}

                  {/* File Attachment */}
                  {message.file && (
                    <a
                      href={message.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={message.file.name}
                      className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg mb-2 hover:bg-neutral-700 transition border border-neutral-700"
                    >
                      <div className="p-2 bg-neutral-700 rounded-lg flex-shrink-0">
                        <File size={24} className="text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-neutral-100">
                          {message.file.name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatFileSize(message.file.size)}
                        </p>
                      </div>
                      <Download size={20} className="text-neutral-400 flex-shrink-0" />
                    </a>
                  )}

                  {/* Text Message */}
                  {message.text && <p>{message.text}</p>}
                </div>
                
                {/* Read Receipt Indicator */}
                {readStatus && (
                  <div className="flex items-center gap-1 mt-1 text-neutral-400">
                    <readStatus.icon
                      size={14}
                      className={readStatus.isRead ? "text-neutral-400" : ""}
                    />
                    {isGroup && message.readBy && message.readBy.length > 1 && (
                      <span className="text-xs">
                        {message.readBy.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isOwnMessage && (
                <div className="shrink-0">
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput selectedChat={selectedChat} />
    </div>
  );
};

export default ChatContainer;