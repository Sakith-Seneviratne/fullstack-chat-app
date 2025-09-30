import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
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

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

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
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 flex items-center gap-3 transition-all ${
                    selectedUser?._id === user._id
                      ? "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-blue-600"
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
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate text-sm">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </div>
                    </div>
                  )}
                </button>
              ))}

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
                  {groups.map((group) => (
                    <button
                      key={group._id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full p-3 flex items-center gap-3 transition-all ${
                        selectedGroup?._id === group._id
                          ? "bg-neutral-100 dark:bg-neutral-800 border-l-2 border-blue-600"
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
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate text-sm">
                            {group.name}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {group.members.length} members
                          </div>
                        </div>
                      )}
                    </button>
                  ))}

                  {groups.length === 0 && open && (
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