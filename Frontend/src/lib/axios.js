import axios from "axios";

export const axiosInstance = axios.create({
    baseURL:"https://talkup-server.onrender.com/api",
    withCredentials:true,
})
