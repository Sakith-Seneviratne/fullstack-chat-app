import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, messages } = get();
    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (messageIds) => {
    try {
      await axiosInstance.post("/messages/mark-read", { messageIds });
      
      const { messages, selectedUser, selectedGroup, unreadCounts } = get();
      const authUserId = useAuthStore.getState().authUser._id;
      
      const updatedMessages = messages.map((msg) => {
        if (messageIds.includes(msg._id)) {
          const readBy = msg.readBy || [];
          const alreadyRead = readBy.some(r => r.user === authUserId);
          
          if (!alreadyRead) {
            return {
              ...msg,
              readBy: [...readBy, { user: authUserId, readAt: new Date() }],
              isRead: true
            };
          }
        }
        return msg;
      });
      
      set({ messages: updatedMessages });
      
      const chatId = selectedUser?._id || selectedGroup?._id;
      if (chatId) {
        set({
          unreadCounts: {
            ...unreadCounts,
            [chatId]: 0
          }
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  getUnreadCount: async (chatId, isGroup = false) => {
    try {
      const endpoint = isGroup 
        ? `/groups/${chatId}/unread` 
        : `/messages/unread/${chatId}`;
      
      const res = await axiosInstance.get(endpoint);
      
      set({
        unreadCounts: {
          ...get().unreadCounts,
          [chatId]: res.data.count
        }
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
    }
  },

  updateMessageReadStatus: (messageIds, readBy, readAt) => {
    const { messages } = get();
    
    const updatedMessages = messages.map((msg) => {
      if (messageIds.includes(msg._id)) {
        const existingReadBy = msg.readBy || [];
        const alreadyRead = existingReadBy.some(r => r.user === readBy);
        
        if (!alreadyRead) {
          return {
            ...msg,
            readBy: [...existingReadBy, { user: readBy, readAt }],
            isRead: true
          };
        }
      }
      return msg;
    });
    
    set({ messages: updatedMessages });
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [...get().groups, res.data] });
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  updateGroup: async (groupId, groupData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, groupData);
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: res.data,
      });
      toast.success("Group updated successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: null,
      });
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  addGroupMembers: async (groupId, members) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/add-members`, { members });
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: res.data,
      });
      toast.success("Members added successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/remove-member`, { memberId });
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: res.data,
      });
      toast.success("Member removed successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  subscribeToMessages: () => {
  const { selectedUser } = get();
  if (!selectedUser) return;

  const socket = useAuthStore.getState().socket;

  socket.on("newMessage", (newMessage) => {
    // Handle both populated and non-populated senderId
    const senderId = newMessage.senderId?._id || newMessage.senderId;
    console.log("👤 Sender ID:", senderId);
    
    const isMessageSentFromSelectedUser = senderId === selectedUser._id;
    console.log("✅ Is from selected user?", isMessageSentFromSelectedUser);
    
    if (!isMessageSentFromSelectedUser) {
      console.log("❌ Message not from selected user, ignoring");
      return;
    }

    console.log("✅ Adding message to state");
    set({
      messages: [...get().messages, newMessage],
    });
  });

  socket.on("messages:read:update", ({ messageIds, readBy, readAt }) => {
    get().updateMessageReadStatus(messageIds, readBy, readAt);
  });
},

  subscribeToGroupMessages: () => {
  const { selectedGroup } = get();
  if (!selectedGroup) return;

  const socket = useAuthStore.getState().socket;

  socket.on("newGroupMessage", ({ groupId, message }) => {
    console.log("📨 Group message received:", { groupId, message });
    console.log("📌 Selected group ID:", selectedGroup._id);
    
    if (groupId === selectedGroup._id) {
      console.log("✅ Adding group message to state");
      set({
        messages: [...get().messages, message],
      });
    } else {
      console.log("❌ Message not for this group, ignoring");
    }
  });

  socket.on("messages:read:update", ({ messageIds, readBy, readAt }) => {
    get().updateMessageReadStatus(messageIds, readBy, readAt);
  });
},

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messages:read:update");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup, selectedUser: null }),
}));