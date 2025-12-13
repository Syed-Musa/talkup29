import axios from "axios";

export const mlAxios = axios.create({
  baseURL: "https://YOUR_ML_SERVICE_DOMAIN.onrender.com",
  timeout: 5000,
});

export default mlAxios;

