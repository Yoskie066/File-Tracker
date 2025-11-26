import tokenService from './tokenService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.failedRequests = [];
  }

  // Initialize token auto-refresh
  init() {
    // Check tokens on app start
    this.autoRefreshTokens();
    
    // Set up periodic token check (every 30 minutes)
    setInterval(() => {
      this.autoRefreshTokens();
    }, 30 * 60 * 1000);
  }

  // Auto-refresh tokens if needed
  async autoRefreshTokens() {
    await tokenService.autoRefreshTokens();
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
    // Auto-refresh tokens before making API call if needed
    await this.autoRefreshTokens();

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
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
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
      let refreshSuccess = false;
      
      if (userType === 'faculty') {
        refreshSuccess = await tokenService.refreshFacultyToken();
      } else {
        refreshSuccess = await tokenService.refreshAdminToken();
      }

      if (!refreshSuccess) {
        throw new Error('Token refresh failed');
      }

      // Get new token
      const newAccessToken = userType === 'faculty'
        ? tokenService.getFacultyAccessToken()
        : tokenService.getAdminAccessToken();

      // Update the original request with new token
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

      // Retry original request
      const retryResponse = await fetch(`${API_BASE_URL}${originalUrl}`, originalConfig);

      // Process any queued requests
      this.processFailedRequests(newAccessToken);

      return retryResponse;
    } catch (error) {
      // Clear tokens and redirect to login
      if (userType === 'faculty') {
        tokenService.clearFacultyTokens();
        window.location.href = '/auth/login';
      } else {
        tokenService.clearAdminTokens();
        window.location.href = '/auth/admin-login';
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
        fetch(`${API_BASE_URL}${request.originalUrl}`, request.originalConfig)
          .then(request.resolve)
          .catch(request.reject);
      }
    });
  }

  // File upload with FormData support
  async uploadFile(url, formData, userType) {
    await this.autoRefreshTokens();

    const accessToken = userType === 'faculty' 
      ? tokenService.getFacultyAccessToken()
      : tokenService.getAdminAccessToken();

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
      });

      if (response.status === 401) {
        return this.handleTokenRefresh(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }, userType);
      }

      return response;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}

export default new ApiService();