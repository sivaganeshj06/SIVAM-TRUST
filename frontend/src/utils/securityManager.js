import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getJwtExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // to ms
  } catch (e) {
    return 0;
  }
};

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

export const setupAxiosInterceptors = (navigate) => {
  // Request Interceptor: Auto-refresh token if close to expiry
  axios.interceptors.request.use(
    async (config) => {
      // Don't intercept refresh-token or login requests to prevent loop
      if (config.url.includes('/api/auth/refresh-token') || config.url.includes('/api/auth/login')) {
        config.withCredentials = true; // Required to send/receive HttpOnly cookies
        return config;
      }

      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        
        const expiry = getJwtExpiry(token);
        const timeBeforeExpiry = expiry - Date.now();
        
        // Refresh token if within 1 minute of expiring
        if (timeBeforeExpiry < 60000) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              const res = await axios.post(`${API}/api/auth/refresh-token`, {}, { withCredentials: true });
              const { token: newToken, user: newUser } = res.data;
              localStorage.setItem('token', newToken);
              localStorage.setItem('trust_user', JSON.stringify(newUser));
              isRefreshing = false;
              onRefreshed(newToken);
            } catch (err) {
              isRefreshing = false;
              localStorage.removeItem('token');
              localStorage.removeItem('trust_user');
              navigate('/admin/login');
              return Promise.reject(err);
            }
          }

          // Queue requests while token is refreshing
          const retryOriginalRequest = new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              config.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(config);
            });
          });
          return retryOriginalRequest;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Redirect on 401 / 403
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('trust_user');
        navigate('/admin/login');
      } else if (status === 403) {
        navigate('/access-denied');
      }
      return Promise.reject(error);
    }
  );
};

export const setupIdleTimeout = (navigate) => {
  const IDLE_LIMIT = 15 * 60 * 1000; // 15 minutes
  let idleTimer;

  const performLogout = async () => {
    try {
      await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore logout errors on idle timeout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('trust_user');
    navigate('/admin/login');
    alert('Session expired due to inactivity. Please log in again.');
  };

  const resetTimer = () => {
    clearTimeout(idleTimer);
    const token = localStorage.getItem('token');
    if (token) {
      idleTimer = setTimeout(performLogout, IDLE_LIMIT);
    }
  };

  // Activity events
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(name => document.addEventListener(name, resetTimer, true));

  // Initialize
  resetTimer();

  return () => {
    clearTimeout(idleTimer);
    events.forEach(name => document.removeEventListener(name, resetTimer, true));
  };
};

export const setupAbsoluteTimeout = (navigate) => {
  const ABSOLUTE_LIMIT = 8 * 60 * 60 * 1000; // 8 hours absolute session limit
  let absoluteTimer;

  const performLogout = async () => {
    try {
      await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      // Ignore errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('trust_user');
    navigate('/admin/login');
    alert('Session absolute limit reached. Please log in again for safety.');
  };

  const token = localStorage.getItem('token');
  if (token) {
    // Standard expiry time of refresh token is 7 days, but absolute session limit is 8 hours
    // We compute time elapsed since token was created, or simply set it from token start
    // For simplicity, we trigger absolute logout 8 hours from now
    absoluteTimer = setTimeout(performLogout, ABSOLUTE_LIMIT);
  }

  return () => clearTimeout(absoluteTimer);
};
