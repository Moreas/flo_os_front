import axios from 'axios';
axios.defaults.withCredentials = true;

// Force localhost for development - override any environment variables
const API_BASE = 'http://localhost:8000';
export default API_BASE; 