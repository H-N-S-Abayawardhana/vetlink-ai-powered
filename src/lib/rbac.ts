import { UserRole } from '@/types/next-auth';

// Define access permissions for each role
export const rolePermissions = {
  SUPER_ADMIN: {
    // Super admin has access to all routes
    allowedPaths: ['*'], // '*' means all paths
    description: 'Full system access'
  },
  VETERINARIAN: {
    allowedPaths: [
      '/',
      '/dashboard',
      '/dashboard/profile',
      '/dashboard/skin-disease',
      '/dashboard/pets',
      '/dashboard/veterinarian-appointments'
    ],
    description: 'Veterinarian access to core features and appointment management'
  },
  USER: {
    allowedPaths: [
      '/',
      '/dashboard',
      '/dashboard/pets',
      '/dashboard/appointment-schedule'
    ],
    description: 'Basic user access with appointment scheduling'
  }
};

// Check if a user role has access to a specific path
export function hasAccess(userRole: UserRole, path: string): boolean {
  const permissions = rolePermissions[userRole];
  
  // Super admin has access to everything
  if (permissions.allowedPaths.includes('*')) {
    return true;
  }
  
  // Check if the path is in the allowed paths
  return permissions.allowedPaths.some(allowedPath => {
    // Exact match
    if (allowedPath === path) {
      return true;
    }
    
    // Check if path starts with allowed path (for nested routes)
    if (path.startsWith(allowedPath + '/')) {
      return true;
    }
    
    return false;
  });
}

// Get allowed navigation items for a user role
export function getAllowedNavigationItems(userRole: UserRole) {
  const allNavigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'HomeIcon',
      roles: ['SUPER_ADMIN', 'VETERINARIAN', 'USER']
    },
    {
      name: 'Pets',
      href: '/dashboard/pets',
      icon: 'HeartIcon',
      roles: ['SUPER_ADMIN', 'VETERINARIAN', 'USER']
    },
    {
      name: 'BCS Calculator',
      href: '/dashboard/pets/bcs',
      icon: 'LightBulbIcon',
      roles: ['SUPER_ADMIN', 'VETERINARIAN', 'USER']
    },
    {
      name: 'Diet Recommendations',
      href: '/dashboard/pets/diet',
      icon: 'DocumentTextIcon',
      roles: ['SUPER_ADMIN', 'VETERINARIAN', 'USER']
    },
    {
      name: 'Health Records',
      href: '/dashboard/health-records',
      icon: 'DocumentTextIcon',
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: 'CalendarIcon',
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'Schedule Appointment',
      href: '/dashboard/appointment-schedule',
      icon: 'CalendarIcon',
      roles: ['USER']
    },
    {
      name: 'Manage Appointments',
      href: '/dashboard/veterinarian-appointments',
      icon: 'CalendarIcon',
      roles: ['VETERINARIAN']
    },
    {
      name: 'Medications',
      href: '/dashboard/medications',
      icon: 'BeakerIcon',
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'AI Analysis',
      href: '/dashboard/ai-analysis',
      icon: 'LightBulbIcon',
      roles: ['SUPER_ADMIN']
    },
    {
      name: 'Skin Disease Detection',
      href: '/dashboard/skin-disease',
      icon: 'EyeIcon',
      roles: ['SUPER_ADMIN', 'VETERINARIAN']
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: 'CogIcon',
      roles: ['SUPER_ADMIN']
    }
  ];

  return allNavigationItems.filter(item => 
    item.roles.includes(userRole)
  );
}

// Middleware function to check access
export function checkAccess(userRole: UserRole, path: string): { allowed: boolean; reason?: string } {
  if (!userRole) {
    return { allowed: false, reason: 'No user role provided' };
  }

  if (!hasAccess(userRole, path)) {
    return { 
      allowed: false, 
      reason: `Access denied. Role '${userRole}' does not have permission to access '${path}'` 
    };
  }

  return { allowed: true };
}
