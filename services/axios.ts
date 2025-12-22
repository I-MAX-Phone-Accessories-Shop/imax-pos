/// <reference types="vite/client" />
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

axios.defaults.baseURL = BASE_URL;

export default axios;
