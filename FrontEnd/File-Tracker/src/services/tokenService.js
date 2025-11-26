class tokenService {
  // Faculty tokens
  static getFacultyAccessToken() {
    return localStorage.getItem('facultyAccessToken');
  }

  static setFacultyAccessToken(token) {
    localStorage.setItem('facultyAccessToken', token);
  }

  static getFacultyRefreshToken() {
    return localStorage.getItem('facultyRefreshToken');
  }

  static setFacultyRefreshToken(token) {
    localStorage.setItem('facultyRefreshToken', token);
  }

  // Admin tokens
  static getAdminAccessToken() {
    return localStorage.getItem('adminAccessToken');
  }

  static setAdminAccessToken(token) {
    localStorage.setItem('adminAccessToken', token);
  }

  static getAdminRefreshToken() {
    return localStorage.getItem('adminRefreshToken');
  }

  static setAdminRefreshToken(token) {
    localStorage.setItem('adminRefreshToken', token);
  }

  // Clear all tokens
  static clearAllTokens() {
    localStorage.removeItem('facultyAccessToken');
    localStorage.removeItem('facultyRefreshToken');
    localStorage.removeItem('faculty');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('admin');
  }

  // Clear faculty tokens
  static clearFacultyTokens() {
    localStorage.removeItem('facultyAccessToken');
    localStorage.removeItem('facultyRefreshToken');
    localStorage.removeItem('faculty');
  }

  // Clear admin tokens
  static clearAdminTokens() {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('admin');
  }

  // Check if user is authenticated
  static isFacultyAuthenticated() {
    const token = this.getFacultyAccessToken();
    return token && !this.isTokenExpired(token);
  }

  static isAdminAuthenticated() {
    const token = this.getAdminAccessToken();
    return token && !this.isTokenExpired(token);
  }

  // Get current user type
  static getCurrentUserType() {
    if (this.isFacultyAuthenticated()) return 'faculty';
    if (this.isAdminAuthenticated()) return 'admin';
    return null;
  }

  // Get current user data
  static getCurrentUser() {
    const userType = this.getCurrentUserType();
    if (userType === 'faculty') {
      const facultyData = localStorage.getItem('faculty');
      return facultyData ? JSON.parse(facultyData) : null;
    } else if (userType === 'admin') {
      const adminData = localStorage.getItem('admin');
      return adminData ? JSON.parse(adminData) : null;
    }
    return null;
  }

  // Check if token is expired (24 hours validation)
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      return expirationTime - bufferTime <= currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  // Get token expiration time
  static getTokenExpiration(token) {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Check if token needs refresh (within 1 hour of expiration)
  static needsRefresh(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const refreshThreshold = 60 * 60 * 1000; // 1 hour before expiration
      
      return expirationTime - currentTime <= refreshThreshold;
    } catch (error) {
      console.error('Error checking token refresh:', error);
      return true;
    }
  }

  // Validate current tokens
  static validateTokens() {
    const facultyToken = this.getFacultyAccessToken();
    const adminToken = this.getAdminAccessToken();
    
    if (facultyToken && this.isTokenExpired(facultyToken)) {
      this.clearFacultyTokens();
      return false;
    }
    
    if (adminToken && this.isTokenExpired(adminToken)) {
      this.clearAdminTokens();
      return false;
    }
    
    return true;
  }

  // Auto-refresh tokens if needed
  static async autoRefreshTokens() {
    const userType = this.getCurrentUserType();
    
    if (userType === 'faculty') {
      const accessToken = this.getFacultyAccessToken();
      if (accessToken && this.needsRefresh(accessToken)) {
        await this.refreshFacultyToken();
      }
    } else if (userType === 'admin') {
      const accessToken = this.getAdminAccessToken();
      if (accessToken && this.needsRefresh(accessToken)) {
        await this.refreshAdminToken();
      }
    }
  }

  // Refresh faculty token
  static async refreshFacultyToken() {
    try {
      const refreshToken = this.getFacultyRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${API_BASE_URL}/api/faculty/refresh-token`, {
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
      this.setFacultyAccessToken(data.accessToken);
      this.setFacultyRefreshToken(data.refreshToken);
      
      console.log('Faculty token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing faculty token:', error);
      this.clearFacultyTokens();
      window.location.href = '/auth/login';
      return false;
    }
  }

  // Refresh admin token
  static async refreshAdminToken() {
    try {
      const refreshToken = this.getAdminRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-refresh-token`, {
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
      this.setAdminAccessToken(data.accessToken);
      this.setAdminRefreshToken(data.refreshToken);
      
      console.log('Admin token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing admin token:', error);
      this.clearAdminTokens();
      window.location.href = '/auth/admin-login';
      return false;
    }
  }

  // Enhanced fetch with auto token refresh
  static async authFetch(url, options = {}) {
    // Auto-refresh tokens before making API call if needed
    await this.autoRefreshTokens();

    const userType = this.getCurrentUserType();
    const accessToken = userType === 'faculty' 
      ? this.getFacultyAccessToken()
      : this.getAdminAccessToken();

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
        // Token expired, try to refresh and retry
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = userType === 'faculty' 
          ? await this.refreshFacultyToken()
          : await this.refreshAdminToken();

        if (refreshSuccess) {
          // Get new token and retry request
          const newAccessToken = userType === 'faculty'
            ? this.getFacultyAccessToken()
            : this.getAdminAccessToken();
          
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          return await fetch(url, config);
        } else {
          throw new Error('Token refresh failed');
        }
      }

      return response;
    } catch (error) {
      console.error('Auth fetch failed:', error);
      throw error;
    }
  }
}

export default tokenService;