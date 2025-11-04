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
    return !!this.getFacultyAccessToken();
  }

  static isAdminAuthenticated() {
    return !!this.getAdminAccessToken();
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

  // Check if token is expired
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
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
}

export default tokenService;