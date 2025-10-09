import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedChat: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  unreadCounts: {}, // { chatId: count }
  lastMessageTimes: {}, // { chatId: timestamp }
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
      
      const { messages, selectedChat, unreadCounts } = get();
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
        selectedChat: get().selectedChat?._id === groupId ? { ...get().selectedChat, ...res.data } : get().selectedChat,
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
        selectedChat: get().selectedChat?._id === groupId ? null : get().selectedChat,
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
        selectedChat: get().selectedChat?._id === groupId ? { ...get().selectedChat, ...res.data } : get().selectedChat,
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
        selectedChat: get().selectedChat?._id === groupId ? { ...get().selectedChat, ...res.data } : get().selectedChat,
      });
      toast.success("Member removed successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
      throw error;
    }
  },

  getChatMessages: async (chatId, isGroup) => {
    set({ isMessagesLoading: true });
    try {
      const endpoint = isGroup ? `/groups/${chatId}/messages` : `/messages/${chatId}`;
      const res = await axiosInstance.get(endpoint);
      
      const populatedMessages = res.data.map(msg => {
        if (typeof msg.senderId === 'string') {
          const sender = get().users.find(user => user._id === msg.senderId);
          return { 
            ...msg, 
            senderId: sender || { _id: msg.senderId, fullName: "Unknown User", profilePic: "/avatar.png" } 
          };
        }
        return msg;
      });
      set({ messages: populatedMessages });

      const authUserId = useAuthStore.getState().authUser._id;
      const unreadMessageIds = populatedMessages
        .filter(msg => {
          const senderId = msg.senderId._id || msg.senderId;
          return (isGroup ? senderId !== authUserId : senderId === chatId) &&
                 !msg.readBy?.some(r => r.user === authUserId);
        })
        .map(msg => msg._id);

      if (unreadMessageIds.length > 0) {
        await get().markMessagesAsRead(unreadMessageIds, isGroup, chatId);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendChatMessage: async (chatId, isGroup, messageData) => {
    const { messages } = get();
    try {
      const endpoint = isGroup ? `/groups/${chatId}/send` : `/messages/send/${chatId}`;
      const res = await axiosInstance.post(endpoint, messageData);
      set({ messages: [...messages, res.data] });
      
      get().setLastMessageTime(chatId, Date.now());
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToChatMessages: () => {
    const { selectedChat } = get();
    if (!selectedChat) return;

    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser._id;

    const handleNewMessage = (incomingData) => {
      const actualMessage = incomingData.message || incomingData;

      if (!actualMessage) {
        console.error("Received an empty message object:", incomingData);
        return;
      }

      // Determine if it's a group chat based on selectedChat or message content
      const isGroup = selectedChat?.type === 'group' || !!actualMessage.groupId;

      // Determine the correct chatId to associate the message with
      let targetChatId;
      if (isGroup) {
        targetChatId = selectedChat?._id || actualMessage.groupId;
      } else {
        targetChatId = selectedChat?._id === actualMessage.senderId?._id
          ? selectedChat._id
          : actualMessage.senderId?._id;
      }

      if (!targetChatId) {
        console.error("Could not determine targetChatId for new message:", actualMessage);
        return;
      }

      const senderId = actualMessage.senderId?._id || actualMessage.senderId;
      const chatId = selectedChat?._id; // Use selectedChat's ID for current view

      const populatedNewMessage = actualMessage;

      // Update last message and time for the relevant chat in the sidebar
      get().setLastMessage(targetChatId, populatedNewMessage, isGroup);
      get().setLastMessageTime(targetChatId, Date.now());

      // Handle unread counts if the message is for a different chat or group
      if ((isGroup && targetChatId !== chatId) || (!isGroup && senderId !== chatId)) {
        get().incrementUnreadCount(targetChatId);
        return;
      }

      // Add the message to the current chat's messages if it's the selected chat
      set((state) => ({
        messages: [...state.messages, populatedNewMessage],
      }));

      // Mark as read if not sent by the current user and it's the selected chat
      if (senderId !== authUserId) {
        get().markMessagesAsRead([actualMessage._id], isGroup, targetChatId);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewMessage);

    socket.on("messages:read:update", ({ messageIds, readBy, readAt }) => {
      get().updateMessageReadStatus(messageIds, readBy, readAt);
    });
  },

  unsubscribeFromChatMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messages:read:update");
  },

  setSelectedChat: (chat) => {
    if (chat) {
      get().clearUnreadCount(chat._id);
    }
    set({ selectedChat: chat });
  },

  setLastMessage: (chatId, message, isGroup = false) => {
    set((state) => {
      const newLastMessages = {
        ...state.lastMessages,
        [chatId]: {
          text: message.text,
          image: message.image,
          senderId: message.senderId,
        },
      };

      let updatedUsers = state.users.map(user => 
        user._id === chatId ? { ...user, lastMessage: newLastMessages[chatId] } : user
      );
      let updatedGroups = state.groups.map(group =>
        group._id === chatId ? { ...group, lastMessage: newLastMessages[chatId] } : group
      );

      return {
        lastMessages: newLastMessages,
        users: updatedUsers,
        groups: updatedGroups,
      };
    });
  },

}));



