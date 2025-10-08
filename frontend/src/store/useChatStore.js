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
  unreadCounts: {}, // { userId: count } or { groupId: count }
  lastMessageTimes: {}, // { userId: timestamp } or { groupId: timestamp }
  lastMessages: {}, // { chatId: { text, image, senderId } }

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
      
      // Fetch unread counts for all users
      const authUserId = useAuthStore.getState().authUser._id;
      const unreadPromises = res.data.map(user => 
        get().getUnreadCount(user._id, false)
      );
      await Promise.all(unreadPromises);
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
      
      // Fetch unread counts for all groups
      const unreadPromises = res.data.map(group => 
        get().getUnreadCount(group._id, true)
      );
      await Promise.all(unreadPromises);
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
      
      // Mark messages as read
      const unreadMessageIds = res.data
        .filter(msg => {
          const authUserId = useAuthStore.getState().authUser._id;
          return msg.senderId._id === userId && 
                 !msg.readBy?.some(r => r.user === authUserId);
        })
        .map(msg => msg._id);
      
      if (unreadMessageIds.length > 0) {
        await get().markMessagesAsRead(unreadMessageIds, false, userId);
      }
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
      
      // Mark group messages as read
      const authUserId = useAuthStore.getState().authUser._id;
      const unreadMessageIds = res.data
        .filter(msg => {
          return msg.senderId._id !== authUserId && 
                 !msg.readBy?.some(r => r.user === authUserId);
        })
        .map(msg => msg._id);
      
      if (unreadMessageIds.length > 0) {
        await get().markMessagesAsRead(unreadMessageIds, true, groupId);
      }
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
      
      // Update last message time
      get().setLastMessageTime(selectedUser._id, Date.now());
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, messages } = get();
    try {
      const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
      set({ messages: [...messages, res.data] });
      
      // Update last message time
      get().setLastMessageTime(selectedGroup._id, Date.now());
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (messageIds, isGroup = false, chatId = null) => {
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
      
      set({
        messages: updatedMessages,
      });

      if (isGroup && chatId) {
        set({
          unreadCounts: {
            ...unreadCounts,
            [chatId]: 0
          }
        });
      } else if (!isGroup && chatId) {
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

  incrementUnreadCount: (chatId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1
      }
    }));
  },

  clearUnreadCount: (chatId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [chatId]: 0 }
    }));
  },

  setLastMessageTime: (chatId, time) => {
    set((state) => ({
      lastMessageTimes: { ...state.lastMessageTimes, [chatId]: time }
    }));
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
    const authUserId = useAuthStore.getState().authUser._id;
  
    socket.on("newMessage", (newMessage) => {
      const senderId = newMessage.senderId?._id || newMessage.senderId;
      const isMessageSentFromSelectedUser = senderId === selectedUser._id;
      
      // Always update last message
      get().setLastMessage(senderId, newMessage);
      
      // Always update last message time for the sender or receiver
      get().setLastMessageTime(senderId, Date.now());

      if (!isMessageSentFromSelectedUser) {
        get().incrementUnreadCount(senderId);
        return;
      }
  
      set({
        messages: [...get().messages, newMessage],
      });
      
      get().setLastMessageTime(senderId, Date.now());
      
      if (senderId !== authUserId) {
        get().markMessagesAsRead([newMessage._id], false, senderId);
      }
    });
  
    socket.on("messages:read:update", ({ messageIds, readBy, readAt }) => {
      get().updateMessageReadStatus(messageIds, readBy, readAt);
    });
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
  
    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser._id;
  
    socket.on("newGroupMessage", ({ groupId, message }) => {
      // Always update last message
      get().setLastMessage(groupId, message);
      
      // Always update last message time for the group
      get().setLastMessageTime(groupId, Date.now());

      if (groupId !== selectedGroup._id) {
        get().incrementUnreadCount(groupId);
        get().setLastMessageTime(groupId, Date.now());
        return;
      }
  
      set({
        messages: [...get().messages, message],
      });
      
      get().setLastMessageTime(groupId, Date.now());
      
      const senderId = message.senderId?._id || message.senderId;
      if (senderId !== authUserId) {
        get().markMessagesAsRead([message._id], true, groupId);
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

  setSelectedUser: (selectedUser) => {
    if (selectedUser) {
      get().clearUnreadCount(selectedUser._id);
    }
    set({ selectedUser, selectedGroup: null });
  },
  
  setSelectedGroup: (selectedGroup) => {
    if (selectedGroup) {
      get().clearUnreadCount(selectedGroup._id);
    }
    set({ selectedGroup, selectedUser: null });
  },

  setLastMessage: (chatId, message) => {
    set((state) => ({
      lastMessages: {
        ...state.lastMessages,
        [chatId]: {
          text: message.text,
          image: message.image,
          senderId: message.senderId
        }
      }
    }));
  },
}));



