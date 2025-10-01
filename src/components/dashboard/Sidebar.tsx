'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  HomeIcon,
  HeartIcon,
  DocumentTextIcon,
  CalendarIcon,
  BeakerIcon,
  LightBulbIcon,
  EyeIcon,
  UserIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
  },
  {
    name: 'Pets',
    href: '/dashboard/pets',
    icon: <HeartIcon className="w-5 h-5" />,
  },
  {
    name: 'Health Records',
    href: '/dashboard/health-records',
    icon: <DocumentTextIcon className="w-5 h-5" />,
  },
  {
    name: 'Appointments',
    href: '/dashboard/appointments',
    icon: <CalendarIcon className="w-5 h-5" />,
  },
  {
    name: 'Medications',
    href: '/dashboard/medications',
    icon: <BeakerIcon className="w-5 h-5" />,
  },
  {
    name: 'AI Analysis',
    href: '/dashboard/ai-analysis',
    icon: <LightBulbIcon className="w-5 h-5" />,
  },
  {
    name: 'Skin Disease Detection',
    href: '/dashboard/skin-disease',
    icon: <EyeIcon className="w-5 h-5" />,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: <UserIcon className="w-5 h-5" />,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <CogIcon className="w-5 h-5" />,
  },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
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
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`mr-3 flex-shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {(session?.user as any)?.username?.charAt(0).toUpperCase() || 
                   session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {(session?.user as any)?.username || session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">VetLink User</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
