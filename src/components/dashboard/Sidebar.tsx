"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentType, SVGProps } from "react";
import type { UserRole } from "@/types/next-auth";
import {
  HomeIcon,
  HeartIcon,
  DocumentTextIcon,
  CalendarIcon,
  LightBulbIcon,
  EyeIcon,
  CogIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  UserPlusIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { ScanFace } from "lucide-react";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type SidebarNavPlacement = "top" | "bottom";

export interface SidebarNavItem {
  name: string;
  href?: string;
  icon: SidebarIcon;
  roles: UserRole[];
  placement?: SidebarNavPlacement;
  children?: SidebarNavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ============================================================================
// Navigation Items Configuration
// ============================================================================

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"],
  },
  {
    name: "My Pets",
    href: "/dashboard/pets",
    icon: HeartIcon,
    roles: ["USER"],
  },
  {
    name: "All Pets",
    href: "/dashboard/pets",
    icon: HeartIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN"],
  },
  {
    name: "BCS Calculator",
    href: "/dashboard/pets/bcs",
    icon: LightBulbIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
  },
  {
    name: "Disease Prediction",
    href: "/dashboard/pets/disease-prediction",
    icon: LightBulbIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
  },
  {
    name: "Diet Recommendations",
    href: "/dashboard/pets/diet",
    icon: DocumentTextIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
  },
  {
    name: "Schedule Appointment",
    href: "/dashboard/appointment-schedule",
    icon: CalendarIcon,
    roles: ["USER"],
  },
  {
    name: "Appointments",
    href: "/dashboard/appointment-schedule",
    icon: CalendarIcon,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Manage Appointments",
    href: "/dashboard/veterinarian-appointments",
    icon: CalendarIcon,
    roles: ["VETERINARIAN"],
  },
  {
    name: "Skin Disease Detection",
    href: "/dashboard/skin-disease",
    icon: ScanFace,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
  },
  {
    name: "Limping Detection",
    href: "/dashboard/Limping",
    icon: EyeIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
  },
  {
    name: "Pharmacy",
    icon: BuildingStorefrontIcon,
    roles: ["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"],
    children: [
      {
        name: "Dashboard",
        href: "/dashboard/pharmacy",
        icon: BuildingStorefrontIcon,
        roles: ["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"],
      },
      {
        name: "Register",
        href: "/dashboard/pharmacy/register",
        icon: BuildingStorefrontIcon,
        roles: ["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"],
      },
      {
        name: "Inventory",
        href: "/dashboard/pharmacy/inventory",
        icon: CubeIcon,
        roles: ["SUPER_ADMIN", "VETERINARIAN", "USER"],
      },
      {
        name: "Shopping",
        href: "/dashboard/pharmacy/shopping",
        icon: ShoppingCartIcon,
        roles: ["SUPER_ADMIN", "VETERINARIAN", "USER", "PHARMACIST"],
      },
      {
        name: "Owner Dashboard",
        href: "/dashboard/pharmacy/owner",
        icon: BuildingStorefrontIcon,
        roles: ["SUPER_ADMIN", "VETERINARIAN"],
      },
    ],
  },
  {
    name: "User Management",
    icon: UsersIcon,
    roles: ["SUPER_ADMIN"],
    children: [
      {
        name: "All Users",
        href: "/dashboard/user-management",
        icon: UsersIcon,
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "Add User",
        href: "/dashboard/user-management/create",
        icon: UserPlusIcon,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: CogIcon,
    roles: ["SUPER_ADMIN"],
    placement: "bottom",
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Filters navigation items based on user role and returns top and bottom items
 */
function getSidebarNavItems(userRole: UserRole): {
  top: SidebarNavItem[];
  bottom: SidebarNavItem[];
} {
  const allowed = SIDEBAR_NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  ).map((item) => {
    // Filter children based on user role
    if (item.children) {
      return {
        ...item,
        children: item.children.filter((child) =>
          child.roles.includes(userRole),
        ),
      };
    }
    return item;
  });

  return {
    top: allowed.filter((item) => (item.placement ?? "top") === "top"),
    bottom: allowed.filter((item) => item.placement === "bottom"),
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // Get user role from session
  const userRole = ((session?.user as any)?.userRole as UserRole) || "USER";

  // Memoize navigation items to prevent infinite loops
  const { top: navigationItems, bottom: bottomNavigationItems } = useMemo(
    () => getSidebarNavItems(userRole),
    [userRole],
  );

  // Auto-open dropdown if current path matches a child
  useEffect(() => {
    const { top: navItems, bottom: bottomNavItems } =
      getSidebarNavItems(userRole);
    const newOpenDropdowns = new Set<string>();

    navItems.forEach((item: SidebarNavItem) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child: SidebarNavItem) => child.href && pathname === child.href,
        );
        if (hasActiveChild) {
          newOpenDropdowns.add(item.name);
        }
      }
    });

    bottomNavItems.forEach((item: SidebarNavItem) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child: SidebarNavItem) => child.href && pathname === child.href,
        );
        if (hasActiveChild) {
          newOpenDropdowns.add(item.name);
        }
      }
    });

    setOpenDropdowns(newOpenDropdowns);
  }, [pathname, userRole]);

  /**
   * Toggles the dropdown state for a navigation item
   */
  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  /**
   * Checks if a navigation item is active based on current pathname
   */
  const isItemActive = (item: SidebarNavItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some(
        (child: SidebarNavItem) => child.href && pathname === child.href,
      );
    }
    return false;
  };

  /**
   * Renders a navigation item (with or without children)
   */
  const renderNavItem = (item: SidebarNavItem, isBottom = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.name);
    const isActive = isItemActive(item);
    const IconComponent = item.icon;

    // Item with children (dropdown)
    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleDropdown(item.name)}
            className={`group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center">
              <span
                className={`mr-3 flex-shrink-0 ${
                  isActive
                    ? "text-blue-700"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </span>
              {item.name}
            </div>
            {isOpen ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children!.map((child: SidebarNavItem) => {
                const isChildActive = child.href && pathname === child.href;
                const ChildIconComponent = child.icon;
                return (
                  <Link
                    key={child.name}
                    href={child.href || "#"}
                    onClick={onToggle}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
                      isChildActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`mr-3 flex-shrink-0 ${
                        isChildActive
                          ? "text-blue-700"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    >
                      <ChildIconComponent className="w-4 h-4" />
                    </span>
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular item without children
    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        onClick={onToggle}
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
          isActive
            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <span
          className={`mr-3 flex-shrink-0 ${
            isActive
              ? "text-blue-700"
              : "text-gray-400 group-hover:text-gray-500"
          }`}
        >
          <IconComponent className="w-5 h-5" />
        </span>
        {item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                src="/vetlink_logo.png"
                alt="VetLink Logo"
                width={100}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 flex flex-col flex-1 overflow-y-auto">
          <div className="space-y-3">
            {navigationItems.map((item: SidebarNavItem) => renderNavItem(item))}
          </div>

          {bottomNavigationItems.length > 0 && (
            <div className="mt-auto pt-4 pb-4 border-t border-gray-200 space-y-3">
              {bottomNavigationItems.map((item: SidebarNavItem) =>
                renderNavItem(item, true),
              )}
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
