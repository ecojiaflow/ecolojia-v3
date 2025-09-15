import axios from 'axios';
import axiosRetry from 'axios-retry';

const http = axios.create({ timeout: 7000 });

axiosRetry(http, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || (error.response && error.response.status >= 500),
});

export default http;
