import axios from "axios";

export const mlAxios = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 5000,
});

export default mlAxios;
