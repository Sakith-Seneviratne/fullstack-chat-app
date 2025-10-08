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
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    subscribeToGroupMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);


  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    } else if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
    }

    return () => unsubscribeFromMessages();
  }, [
    selectedUser,
    selectedGroup,
    getMessages,
    getGroupMessages,
    subscribeToMessages,
    subscribeToGroupMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (!messages.length || !authUser) return;

    // Find unread messages not sent by current user
    const unreadMessages = messages.filter((msg) => {
      const senderId = msg.senderId._id || msg.senderId;
      const isOwnMessage = senderId === authUser._id;
      const isRead = msg.readBy?.some((r) => r.user === authUser._id);
      return !isOwnMessage && !isRead;
    });

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg._id);
      
      // Mark as read locally and on server
      markMessagesAsRead(messageIds);

      // Emit socket event for real-time updates
      if (socket) {
        const chatId = selectedUser?._id || selectedGroup?._id;
        socket.emit("messages:read", {
          messageIds,
          chatId,
          isGroup: !!selectedGroup,
        });
      }
    }
  }, [messages, authUser, socket, selectedUser, selectedGroup, markMessagesAsRead]);

  // Add this useEffect after your existing useEffects
useEffect(() => {
  if (selectedGroup && socket) {
    // Join the group room
    socket.emit("joinGroup", selectedGroup._id);
    console.log("🏠 Joined group room:", selectedGroup._id);
    
    return () => {
      // Leave the group room when switching chats
      socket.emit("leaveGroup", selectedGroup._id);
      console.log("🚪 Left group room:", selectedGroup._id);
    };
  }
}, [selectedGroup, socket]);

  // Helper function to check if message is read
  const getReadStatus = (message) => {
    const senderId = message.senderId._id || message.senderId;
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

  return (
    <div className="bg-white dark:bg-neutral-900 flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => {
          const senderId = message.senderId._id || message.senderId;
          const isOwnMessage = senderId === authUser._id;
          const readStatus = getReadStatus(message);

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser
                        ? selectedUser.profilePic || "/avatar.png"
                        : message.senderId.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                {selectedGroup && !isOwnMessage && (
                  <span className="text-sm font-medium mr-2">
                    {message.senderId.fullName}
                  </span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
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
                    className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg mb-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                      <File size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">
                        {message.file.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatFileSize(message.file.size)}
                      </p>
                    </div>
                    <Download size={20} className="text-neutral-500 flex-shrink-0" />
                  </a>
                )}

                {/* Text Message */}
                {message.text && <p>{message.text}</p>}
              </div>
              
              {/* Read Receipt Indicator */}
              {readStatus && (
                <div className="chat-footer opacity-50 flex items-center gap-1 mt-1">
                  <readStatus.icon
                    size={14}
                    className={readStatus.isRead ? "text-blue-500" : ""}
                  />
                  {selectedGroup && message.readBy && message.readBy.length > 1 && (
                    <span className="text-xs">
                      {message.readBy.length - 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;