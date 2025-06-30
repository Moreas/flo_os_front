import axios from 'axios';
axios.defaults.withCredentials = true;

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
export default API_BASE; 