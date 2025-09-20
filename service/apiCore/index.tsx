import axios from "axios";

const API_BASE_URL = "https://farmdee-api-dev.api-framdee.workers.dev";
// const API_BASE_URL = "https://farmdee-api-prod.api-framdee.workers.dev";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 500000,
});

export default api;
