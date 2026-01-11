// Debug authentication script
// Add this temporarily to AuthContext.tsx to debug the issue

const debugAuth = async () => {
  console.log('🔍 Debug: Starting auth check...');
  
  const token = localStorage.getItem('adminToken');
  const sessionId = localStorage.getItem('adminSessionId');
  const adminData = localStorage.getItem('adminData');
  
  console.log('🔍 Debug: Token exists:', !!token);
  console.log('🔍 Debug: Session ID exists:', !!sessionId);
  console.log('🔍 Debug: Admin data exists:', !!adminData);
  
  if (token) {
    console.log('🔍 Debug: Token preview:', token.substring(0, 20) + '...');
  }
  
  try {
    console.log('🔍 Debug: Making request to /admin/auth/me...');
    const response = await api.get('/admin/auth/me');
    console.log('🔍 Debug: Response status:', response.status);
    console.log('🔍 Debug: Response data:', response.data);
    return response;
  } catch (error) {
    console.log('🔍 Debug: Request failed:', error.response?.status);
    console.log('🔍 Debug: Error message:', error.response?.data);
    console.log('🔍 Debug: Full error:', error);
    throw error;
  }
};

// Use this in checkAuth function:
// const response = await debugAuth();
