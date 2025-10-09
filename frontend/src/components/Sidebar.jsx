import { useEffect, useState, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const getUsers = useChatStore((state) => state.getUsers);
  const getGroups = useChatStore((state) => state.getGroups);
  const users = useChatStore((state) => state.users);
  const groups = useChatStore((state) => state.groups);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const setSelectedChat = useChatStore((state) => state.setSelectedChat);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const isGroupsLoading = useChatStore((state) => state.isGroupsLoading);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const lastMessageTimes = useChatStore((state) => state.lastMessageTimes);
  const lastMessages = useChatStore((state) => state.lastMessages);

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  // Helper to format last message preview
  const formatLastMessage = (chatId, isGroup, currentLastMessages) => {
    const lastMsg = currentLastMessages?.[chatId];
    if (!lastMsg) return null;

    let senderName = "Unknown";
    if (isGroup) {

      const group = groups.find((g) => g._id === chatId);

      const actualSenderId = lastMsg.senderId?._id || lastMsg.senderId; // Handle senderId being object or string

      const sender = group?.members.find((member) => {

        return member._id === actualSenderId;
      });

      senderName = sender?.fullName || "Unknown";
    } else {
      const sender = users.find((user) => user._id === lastMsg.senderId);
      senderName = sender?.fullName || "Unknown";
    }

    if (lastMsg.image && !lastMsg.text) {
      return (
        <div className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          <span>{isGroup ? `${senderName}: Photo` : "Photo"}</span>
        </div>
      );
    }

    const messageText = lastMsg.text?.length > 30 
      ? lastMsg.text.substring(0, 30) + "..." 
      : lastMsg.text || ""; // Ensure it's not undefined/null

    return isGroup ? `${senderName}: ${messageText}` : messageText;
  };

  const combinedChats = useMemo(() => {
    const allChats = [
      ...users.map(user => ({
        ...user,
        type: 'user',
        chatId: user._id,
        name: user.fullName,
        lastMessage: lastMessages[user._id],
        lastMessageTime: lastMessageTimes[user._id],
        unreadCount: unreadCounts[user._id] || 0,
      })),
      ...groups.map(group => ({
        ...group,
        type: 'group',
        chatId: group._id,
        name: group.name,
        lastMessage: lastMessages[group._id],
        lastMessageTime: lastMessageTimes[group._id],
        unreadCount: unreadCounts[group._id] || 0,
      }))
    ];

    return allChats.sort((a, b) => {
      const aTime = a.lastMessageTime || 0;
      const bTime = b.lastMessageTime || 0;
      const aUnread = a.unreadCount;
      const bUnread = b.unreadCount;

      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;
      
      return bTime - aTime;
    });
  }, [users, groups, unreadCounts, lastMessageTimes, lastMessages]);

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside
        className={`h-full border-r border-neutral-700 flex flex-col transition-all duration-300 ease-in-out bg-neutral-900 ${
          open ? "w-72" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="border-b border-neutral-700 p-5 bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              {open && (
                <span className="font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                  Chats
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {open ? (
                <ChevronLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              ) : (
                <ChevronRight className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              )}
            </button>
          </div>

          {/* Create Group Button */}
          {open && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-600 hover:bg-neutral-700 text-neutral-100 text-sm font-medium transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Create Group
            </button>
          )}
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto flex-1 py-2">
          {combinedChats.length === 0 && open && (
            <div className="text-center text-neutral-500 py-8 px-4 text-sm">
              No chats yet
            </div>
          )}
          {combinedChats.map((chat) => {
            const unreadCount = unreadCounts[chat.chatId] || 0;
            const hasUnread = unreadCount > 0;
            const lastMessage = formatLastMessage(chat.chatId, chat.type === 'group', lastMessages);
            const isSelected = (selectedChat?._id === chat.chatId);

            return (
              <button
                key={chat.chatId}
                onClick={() => {
                  setSelectedChat(chat);
                }}
                className={`w-full p-3 flex items-center gap-3 transition-all relative ${
                  isSelected
                    ? "bg-neutral-800 border-l-2 border-neutral-600"
                    : hasUnread
                    ? "bg-neutral-800/10 hover:bg-neutral-800/30"
                    : "hover:bg-neutral-800/50"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.type === 'user' ? chat.profilePic || "/avatar.png" : chat.groupPic || "/avatar.png"}
                    alt={chat.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {chat.type === 'user' && onlineUsers.includes(chat.chatId) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-neutral-950" />
                  )}
                </div>

                {open && (
                  <div className="text-left min-w-0 flex-1">
                    <div className={`truncate text-sm ${
                      hasUnread 
                        ? "text-neutral-100 font-semibold" 
                        : "text-neutral-200 font-medium"
                    }`}>
                      {chat.type === 'user' ? chat.fullName : chat.name}
                    </div>
                    <div className={`text-xs truncate ${
                      hasUnread
                        ? "text-neutral-300 font-medium"
                        : "text-neutral-400"
                    }`}>
                      {lastMessage && lastMessage.trim() !== '' ? lastMessage : 
                        (chat.type === 'user' && onlineUsers.includes(chat.chatId) ? "Online" : 
                         `${chat.members?.length || 0} members`)
                      }
                    </div>
                  </div>
                )}

                {/* Unread Indicator */}
                {open && hasUnread && (
                  <div className="shrink-0 flex items-center gap-1 text-neutral-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-semibold">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  </div>
                )}

                {/* Unread Icon for Collapsed Sidebar */}
                {!open && hasUnread && (
                  <MessageSquare className="absolute top-2 right-2 w-4 h-4 text-neutral-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile at Bottom */}
        {open && authUser && (
          <div className="border-t border-neutral-700 p-3 bg-neutral-900">
            <div className="flex items-center gap-3">
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt={authUser.fullName}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-neutral-100 truncate text-sm">
                  {authUser.fullName}
                </div>
                <div className="text-xs text-neutral-400">Online</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </>
  );
};

export default Sidebar;