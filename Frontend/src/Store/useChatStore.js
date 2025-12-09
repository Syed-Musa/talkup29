import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./userAuth";
export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},

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

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set({
        messages: [...get().messages, newMessage],
      });

      const authUser = useAuthStore.getState().authUser;
      if (authUser) {
        socket.emit("mark_seen", {
          senderId: newMessage.senderId,
          receiverId: authUser._id,
        });
      }
    });
    // Message delivered ack for a sent message
    socket.on("message_delivered", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, status: "delivered" } : m
        ),
      }));
    });
    // Messages seen by recipient (sender receives this)
    socket.on("messages_seen", ({ senderId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          String(m.senderId) === String(senderId) ? { ...m, status: "seen" } : m
        ),
      }));
    });

    socket.on("user_typing", ({ userId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [userId]: true,
        },
      }));
    });

    socket.on("user_stop_typing", ({ userId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[userId];
        return { typingUsers: updated };
      });
    });

    socket.on("user_last_seen_update",({userId,lastSeen})=>{
      set((state)=>({
        users:state.users.map((u)=>
          u._id === userId ? {...u ,lastSeen}: u
        )
      }))
    })
  },
  setTyping: (isTyping) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !selectedUser || !authUser) return;

    if (isTyping) {
      socket.emit("typing", {
        reciverUserId: selectedUser._id,
        userId: authUser._id,
      });
    } else {
      socket.emit("stop_typing", {
        reciverUserId: selectedUser._id,
        userId: authUser._id,
      });
    }
  },

  unsubscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("user_typing");
    socket.off("user_stop_typing");
  },

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
    });
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && selectedUser && authUser) {
      socket.emit("mark_seen", {
        senderId: selectedUser._id,
        receiverId: authUser._id,
      });
    }
  },
}));
