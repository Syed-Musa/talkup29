import axios from "axios";

export const mlAxios = axios.create({
  baseURL: "https://talkup-python-server.onrender.com",
  timeout: 5000,
});

export default mlAxios;

