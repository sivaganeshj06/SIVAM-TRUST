export const getAPIUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.endsWith('.local') ||
    !hostname.includes('.'); // Intranet names like 'sivam-pc'

  return isLocal ? `http://${hostname}:5000` : 'https://sivam-trust.vercel.app';
};

export const API = getAPIUrl();
export default API;
