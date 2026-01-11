/**
 * Authentication Debug Utilities
 * Helps track token verification process and authentication flow
 */

export const logAuthFlow = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] AUTH FLOW: ${step}`, data);
};

export const checkTokenStatus = () => {
  const token = localStorage.getItem('adminToken');
  const sessionId = localStorage.getItem('adminSessionId');
  
  const status = {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    hasSessionId: !!sessionId,
    timestamp: new Date().toISOString()
  };
  
  logAuthFlow('TOKEN STATUS CHECK', status);
  return status;
};

export const simulateRefresh = () => {
  logAuthFlow('SIMULATING PAGE REFRESH', {
    currentUrl: window.location.pathname,
    hasToken: !!localStorage.getItem('adminToken'),
    userAgent: navigator.userAgent.substring(0, 50)
  });
};

export default {
  logAuthFlow,
  checkTokenStatus,
  simulateRefresh
};
