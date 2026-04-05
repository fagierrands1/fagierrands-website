// src/utils/adminUtils.js

/**
 * Utility functions for admin-only features
 */

/**
 * Component wrapper that only renders content for admin users
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render for admins
 * @param {boolean} props.isAdmin - Whether current user is admin
 * @param {React.ReactNode} props.fallback - Optional fallback content for non-admins
 * @returns {React.ReactNode} - Rendered content or null
 */
export const AdminOnly = ({ children, isAdmin, fallback = null }) => {
  if (!isAdmin) {
    return fallback;
  }
  return children;
};

/**
 * Higher-order component that wraps a component with admin-only access
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @param {React.ReactNode} options.fallback - Fallback content for non-admins
 * @returns {React.Component} - Wrapped component with admin check
 */
export const withAdminOnly = (WrappedComponent, options = {}) => {
  return (props) => {
    const { isAdmin } = props;
    
    if (!isAdmin) {
      return options.fallback || (
        <div className="text-center p-4">
          <p className="text-gray-500">This feature is only available to administrators.</p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

/**
 * Check if commission information should be visible
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {boolean} forceShow - Force show regardless of admin status (for demos)
 * @returns {boolean} - Whether to show commission info
 */
export const shouldShowCommission = (isAdmin, forceShow = false) => {
  return forceShow || isAdmin;
};

/**
 * Get user role display name
 * @param {Object} user - User object with role information
 * @returns {string} - Display name for user role
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return 'Guest';
  
  // Check various possible role fields
  const role = user.role || user.user_type || user.userType;
  
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Administrator';
    case 'assistant':
      return 'Assistant';
    case 'client':
      return 'Client';
    case 'handler':
      return 'Handler';
    default:
      return 'User';
  }
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  const role = user.role || user.user_type || user.userType;
  
  // Admin has all permissions
  if (role?.toLowerCase() === 'admin') {
    return true;
  }
  
  // Define role-based permissions
  const permissions = {
    assistant: ['view_orders', 'update_order_status', 'view_earnings'],
    client: ['create_orders', 'view_own_orders', 'cancel_orders'],
    handler: ['view_orders', 'assign_orders', 'view_reports']
  };
  
  const userPermissions = permissions[role?.toLowerCase()] || [];
  return userPermissions.includes(permission);
};

export default {
  AdminOnly,
  withAdminOnly,
  shouldShowCommission,
  getUserRoleDisplay,
  hasPermission
};