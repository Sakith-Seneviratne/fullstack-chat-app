import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, ChevronLeft, ChevronRight, Image as ImageIcon, MessageSquare } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    users,
    groups,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    isUsersLoading,
    isGroupsLoading,
    unreadCounts,
    lastMessageTimes,
    lastMessages, // Add this to store
  } = useChatStore();

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
  const formatLastMessage = (chatId) => {
    const lastMsg = lastMessages?.[chatId];
    if (!lastMsg) return null;

    if (lastMsg.image && !lastMsg.text) {
      return (
        <div className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          <span>Photo</span>
        </div>
      );
    }

    return lastMsg.text?.length > 30 
      ? lastMsg.text.substring(0, 30) + "..." 
      : lastMsg.text;
  };

  // Sort users by unread status and last message time
  const sortedUsers = [...users].sort((a, b) => {
    const aUnread = unreadCounts[a._id] || 0;
    const bUnread = unreadCounts[b._id] || 0;
    
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;
    
    const aTime = lastMessageTimes[a._id] || 0;
    const bTime = lastMessageTimes[b._id] || 0;
    return bTime - aTime;
  });

  const sortedGroups = [...groups].sort((a, b) => {
    const aUnread = unreadCounts[a._id] || 0;
    const bUnread = unreadCounts[b._id] || 0;
    
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;
    
    const aTime = lastMessageTimes[a._id] || 0;
    const bTime = lastMessageTimes[b._id] || 0;
    return bTime - aTime;
  });

  const filteredUsers = showOnlineOnly
    ? sortedUsers.filter((user) => onlineUsers.includes(user._id))
    : sortedUsers;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside
        className={`h-full border-r border-neutral-200 dark:border-neutral-700 flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 ${
          open ? "w-72" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 p-5">
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

          {/* Tab Switcher */}
          {open && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "users"
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "groups"
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Groups
              </button>
            </div>
          )}

          {/* Create Group Button & Online Filter */}
          {open && (
            <>
              {activeTab === "groups" && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Group
                </button>
              )}

              {activeTab === "users" && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={showOnlineOnly}
                      onChange={(e) => setShowOnlineOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Show online only
                    </span>
                  </label>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    ({onlineUsers.length - 1})
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto flex-1 py-2">
          {activeTab === "users" ? (
            <>
              {filteredUsers.map((user) => {
                const unreadCount = unreadCounts[user._id] || 0;
                const hasUnread = unreadCount > 0;
                const lastMessage = formatLastMessage(user._id);

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 flex items-center gap-3 transition-all relative ${
                      selectedUser?._id === user._id
                        ? "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-blue-600"
                        : hasUnread
                        ? "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {onlineUsers.includes(user._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
                      )}
                    </div>

                    {open && (
                      <div className="text-left min-w-0 flex-1">
                        <div className={`truncate text-sm ${
                          hasUnread 
                            ? "text-neutral-900 dark:text-neutral-100 font-semibold" 
                            : "text-neutral-900 dark:text-neutral-100 font-medium"
                        }`}>
                          {user.fullName}
                        </div>
                        <div className={`text-xs truncate ${
                          hasUnread
                            ? "text-neutral-700 dark:text-neutral-300 font-medium"
                            : "text-neutral-500 dark:text-neutral-400"
                        }`}>
                          {lastMessage || (onlineUsers.includes(user._id) ? "Online" : "Offline")}
                        </div>
                      </div>
                    )}

                    {/* Unread Indicator */}
                    {open && hasUnread && (
                      <div className="shrink-0 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-semibold">{unreadCount > 99 ? "99+" : unreadCount}</span>
                      </div>
                    )}

                    {/* Unread Icon for Collapsed Sidebar */}
                    {!open && hasUnread && (
                      <MessageSquare className="absolute top-2 right-2 w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })}

              {filteredUsers.length === 0 && open && (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 px-4 text-sm">
                  No online users
                </div>
              )}
            </>
          ) : (
            <>
              {isGroupsLoading ? (
                open && (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 text-sm">
                    Loading groups...
                  </div>
                )
              ) : (
                <>
                  {sortedGroups.map((group) => {
                    const unreadCount = unreadCounts[group._id] || 0;
                    const hasUnread = unreadCount > 0;
                    const lastMessage = formatLastMessage(group._id);

                    return (
                      <button
                        key={group._id}
                        onClick={() => setSelectedGroup(group)}
                        className={`w-full p-3 flex items-center gap-3 transition-all relative ${
                          selectedGroup?._id === group._id
                            ? "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-blue-600"
                            : hasUnread
                            ? "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={group.groupPic || "/avatar.png"}
                            alt={group.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>

                        {open && (
                          <div className="text-left min-w-0 flex-1">
                            <div className={`truncate text-sm ${
                              hasUnread 
                                ? "text-neutral-900 dark:text-neutral-100 font-semibold" 
                                : "text-neutral-900 dark:text-neutral-100 font-medium"
                            }`}>
                              {group.name}
                            </div>
                            <div className={`text-xs truncate ${
                              hasUnread
                                ? "text-neutral-700 dark:text-neutral-300 font-medium"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}>
                              {lastMessage || `${group.members.length} members`}
                            </div>
                          </div>
                        )}

                        {/* Unread Indicator */}
                        {open && hasUnread && (
                          <div className="shrink-0 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-semibold">{unreadCount > 99 ? "99+" : unreadCount}</span>
                          </div>
                        )}

                        {/* Unread Icon for Collapsed Sidebar */}
                        {!open && hasUnread && (
                          <MessageSquare className="absolute top-2 right-2 w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    );
                  })}

                  {sortedGroups.length === 0 && open && (
                    <div className="text-center text-neutral-500 dark:text-neutral-400 py-8 px-4">
                      <p className="text-sm mb-3">No groups yet</p>
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Create Group
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* User Profile at Bottom */}
        {open && authUser && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-3">
            <div className="flex items-center gap-3">
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt={authUser.fullName}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate text-sm">
                  {authUser.fullName}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Online</div>
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