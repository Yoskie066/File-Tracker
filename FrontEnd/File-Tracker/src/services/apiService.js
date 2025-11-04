import tokenService from './tokenService';

class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.failedRequests = [];
  }

  // Faculty API calls
  async facultyApi(url, options = {}) {
    return this.makeApiCall(url, options, 'faculty');
  }

  // Admin API calls
  async adminApi(url, options = {}) {
    return this.makeApiCall(url, options, 'admin');
  }

  async makeApiCall(url, options = {}, userType) {
    const accessToken = userType === 'faculty' 
      ? tokenService.getFacultyAccessToken()
      : tokenService.getAdminAccessToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        return this.handleTokenRefresh(url, config, userType);
      }

      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async handleTokenRefresh(originalUrl, originalConfig, userType) {
    if (this.isRefreshing) {
      // If already refreshing, wait for the new token
      return new Promise((resolve, reject) => {
        this.failedRequests.push({ resolve, reject, originalUrl, originalConfig, userType });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = userType === 'faculty'
        ? tokenService.getFacultyRefreshToken()
        : tokenService.getAdminRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshUrl = userType === 'faculty'
        ? 'http://localhost:3000/api/faculty/refresh-token'
        : 'http://localhost:3000/api/admin/admin-refresh-token';

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Store new tokens
      if (userType === 'faculty') {
        tokenService.setFacultyAccessToken(data.accessToken);
        tokenService.setFacultyRefreshToken(data.refreshToken);
      } else {
        tokenService.setAdminAccessToken(data.accessToken);
        tokenService.setAdminRefreshToken(data.refreshToken);
      }

      // Update the original request with new token
      originalConfig.headers.Authorization = `Bearer ${data.accessToken}`;

      // Retry original request
      const retryResponse = await fetch(originalUrl, originalConfig);

      // Process any queued requests
      this.processFailedRequests(data.accessToken);

      return retryResponse;
    } catch (error) {
      // Clear tokens and redirect to login
      if (userType === 'faculty') {
        tokenService.clearFacultyTokens();
        window.location.href = '/login';
      } else {
        tokenService.clearAdminTokens();
        window.location.href = '/admin-login';
      }
      
      this.processFailedRequests(null, error);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.failedRequests = [];
    }
  }

  processFailedRequests(newToken, error = null) {
    this.failedRequests.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.originalConfig.headers.Authorization = `Bearer ${newToken}`;
        fetch(request.originalUrl, request.originalConfig)
          .then(request.resolve)
          .catch(request.reject);
      }
    });
  }
}

export default new ApiService();