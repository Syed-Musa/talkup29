import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:3000";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLogging: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  chechAuth: async () => {
    try {
      const res = await axiosInstance.get("/user/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      console.log("Error in checking auth", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signUp: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/user/signup", data);
      set({ authUser: res.data });
      toast.success("Account created seccessfully!");
      get().connectSocket();
    } catch (error) {
      console.log("error in signUp", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/user/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disConnectSocket();
    } catch (error) {
      console.log("error in logout", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
  },
  login: async (data) => {
    set({ isLogging: true });
    try {
      const res = await axiosInstance.post("/user/login", data);
      set({ authUser: res.data });
      toast.success("Login Successfully!");
      get().connectSocket();
    } catch (error) {
      console.log("error in login", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
    set({ isLogging: false });
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/user/update-profile", data);
      set({ authUser: res.data });
      toast.success("profile updated successfully");
    } catch (error) {
      console.log(
        "error in updating profile",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if(!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL,{
      query:{
        userId:authUser._id,
      },
      withCredentials: true,
      autoConnect:false,
      reconnection:true
    });
    socket.connect();
    set({socket:socket});

    socket.on("getOnlineUsers", (userIds)=>{
      set({onlineUsers:userIds})
    })
    socket.emit("online",{receiverId:authUser._id})

  },
  disConnectSocket: () => {
    if(get().socket?.connected) get().socket.disconnect();
  },
}));
