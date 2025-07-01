import axios from 'axios';
axios.defaults.withCredentials = true;

// Use production backend URL in production, localhost in development
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://flo-os-back.onrender.com'  // Production backend URL on Render
  : 'http://localhost:8000';  // Development backend URL

export default API_BASE; 