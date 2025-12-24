"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  HomeIcon,
  HeartIcon,
  DocumentTextIcon,
  CalendarIcon,
  LightBulbIcon,
  EyeIcon,
  UserIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getAllowedNavigationItems } from '@/lib/rbac';
import { UserRole } from '@/types/next-auth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Icon mapping for navigation items
const iconMap = {
  HomeIcon: HomeIcon,
  HeartIcon: HeartIcon,
  DocumentTextIcon: DocumentTextIcon,
  CalendarIcon: CalendarIcon,
  LightBulbIcon: LightBulbIcon,
  EyeIcon: EyeIcon,
  UserIcon: UserIcon,
  CogIcon: CogIcon,
};

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

    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.href && pathname === child.href,
        );
        if (hasActiveChild) {
          newOpenDropdowns.add(item.name);
        }
      }
    });
    bottomNavItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.href && pathname === child.href,
        );
        if (hasActiveChild) {
          newOpenDropdowns.add(item.name);
        }
      }
    });

    setOpenDropdowns(newOpenDropdowns);
  }, [pathname, userRole]);

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

  const isItemActive = (item: SidebarNavItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some(
        (child) => child.href && pathname === child.href,
      );
    }
    return false;
  };

  const renderNavItem = (item: SidebarNavItem, isBottom = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.name);
    const isActive = isItemActive(item);
    const IconComponent = item.icon;

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleDropdown(item.name)}
            className={`group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
              {item.children!.map((child) => {
                const isChildActive = child.href && pathname === child.href;
                const ChildIconComponent = child.icon;
                return (
                  <Link
                    key={child.name}
                    href={child.href || "#"}
                    onClick={onToggle}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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

        <nav className="mt-6 px-3 flex flex-col flex-1 overflow-y-auto">
          <div className="space-y-3">
            {navigationItems.map((item) => renderNavItem(item))}
          </div>

          {bottomNavigationItems.length > 0 && (
            <div className="mt-auto pt-4 pb-4 border-t border-gray-200 space-y-3">
              {bottomNavigationItems.map((item) => renderNavItem(item, true))}
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
