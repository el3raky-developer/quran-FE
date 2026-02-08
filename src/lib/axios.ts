import axios from "axios";

const API_BASE_URL = "https://quran-be-production.up.railway.app";
// const API_BASE_URL = "https://quran-be-6rgt.onrender.com";
// const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
//   timeout: 20000,
});

export default api;