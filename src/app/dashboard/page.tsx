"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalPets: number;
  activeAppointments: number;
  registeredPetOwners: number;
  aiAnalyses: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    activeAppointments: 0,
    registeredPetOwners: 0,
    aiAnalyses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentPets, setRecentPets] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch("/api/dashboard/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        // Fetch upcoming appointments for all roles
        const userRole = (session?.user as any)?.userRole || 'USER';
        if (session) {
          const appointmentsResponse = await fetch("/api/appointments");
          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            if (appointmentsData.success) {
              // Filter and sort upcoming appointments (only future dates, pending or accepted status)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const upcoming = appointmentsData.appointments
                .filter((apt: any) => {
                  // Parse date string directly to avoid timezone issues
                  const dateStr = apt.appointment_date instanceof Date 
                    ? apt.appointment_date.toISOString().split('T')[0]
                    : typeof apt.appointment_date === 'string' && apt.appointment_date.includes('T')
                    ? apt.appointment_date.split('T')[0]
                    : apt.appointment_date;
                  
                  const dateParts = dateStr.split('-');
                  if (dateParts.length !== 3) return false;
                  
                  const year = parseInt(dateParts[0], 10);
                  const month = parseInt(dateParts[1], 10) - 1;
                  const day = parseInt(dateParts[2], 10);
                  const aptDate = new Date(year, month, day);
                  aptDate.setHours(0, 0, 0, 0);
                  
                  return aptDate >= today && (apt.status === 'pending' || apt.status === 'accepted');
                })
                .sort((a: any, b: any) => {
                  // Sort by date and time
                  const dateStrA = a.appointment_date instanceof Date 
                    ? a.appointment_date.toISOString().split('T')[0]
                    : typeof a.appointment_date === 'string' && a.appointment_date.includes('T')
                    ? a.appointment_date.split('T')[0]
                    : a.appointment_date;
                  const dateStrB = b.appointment_date instanceof Date 
                    ? b.appointment_date.toISOString().split('T')[0]
                    : typeof b.appointment_date === 'string' && b.appointment_date.includes('T')
                    ? b.appointment_date.split('T')[0]
                    : b.appointment_date;
                  
                  const dateA = new Date(`${dateStrA}T${a.appointment_time}`);
                  const dateB = new Date(`${dateStrB}T${b.appointment_time}`);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 5); // Show only top 5 upcoming
              
              setUpcomingAppointments(upcoming);
            }
          }

          // Fetch recent pets
          const petsResponse = await fetch("/api/pets");
          if (petsResponse.ok) {
            const petsData = await petsResponse.json();
            if (petsData.pets) {
              // Get the most recent 4 pets
              const recent = petsData.pets.slice(0, 4).map((pet: any) => {
                // Format age
                const ageText = pet.ageYears 
                  ? `${pet.ageYears} ${pet.ageYears === 1 ? 'year' : 'years'}`
                  : 'Unknown age';
                
                // Format last visit (using updated_at as proxy)
                let lastVisitText = 'Never';
                if (pet.updatedAt) {
                  const updatedDate = new Date(pet.updatedAt);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 0) {
                    lastVisitText = 'Today';
                  } else if (diffDays === 1) {
                    lastVisitText = '1 day ago';
                  } else if (diffDays < 7) {
                    lastVisitText = `${diffDays} days ago`;
                  } else if (diffDays < 30) {
                    const weeks = Math.floor(diffDays / 7);
                    lastVisitText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
                  } else {
                    const months = Math.floor(diffDays / 30);
                    lastVisitText = `${months} ${months === 1 ? 'month' : 'months'} ago`;
                  }
                }
                
                // Determine status based on health notes or vaccination status
                const status = pet.healthNotes && pet.healthNotes.toLowerCase().includes('attention')
                  ? 'needs_attention'
                  : 'healthy';
                
                // Get avatar emoji based on type
                const avatar = pet.type === 'dog' ? '🐕' : pet.type === 'cat' ? '🐱' : '🐾';
                
                return {
                  id: pet.id,
                  name: pet.name,
                  breed: pet.breed || 'Unknown breed',
                  age: ageText,
                  lastVisit: lastVisitText,
                  status: status,
                  avatar: avatar,
                };
              });
              setRecentPets(recent);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session) {
      fetchData();
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.userRole || 'USER';
  const showRegisteredPetOwners = userRole === 'SUPER_ADMIN' || userRole === 'VETERINARIAN';
  const isUserRole = userRole === 'USER';

  // Stats configuration
  const statsConfig = [
    {
      title: isUserRole ? 'My Pets' : 'Total Pets',
      value: stats.totalPets.toString(),
      change: '',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      title: 'Active Appointments',
      value: stats.activeAppointments.toString(),
      change: '',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    ...(showRegisteredPetOwners ? [{
      title: 'Registered Pet Owners',
      value: stats.registeredPetOwners.toString(),
      change: '',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    }] : []),
    {
      title: 'AI Analyses',
      value: stats.aiAnalyses.toString(),
      change: '',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];


  // Format appointment date for display
  const formatAppointmentDate = (dateString: string | Date) => {
    try {
      // Handle different date formats
      let dateStr = '';
      if (dateString instanceof Date) {
        const year = dateString.getUTCFullYear();
        const month = String(dateString.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateString.getUTCDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
          dateStr = dateString.split('T')[0];
        } else {
          dateStr = dateString;
        }
      } else {
        return '';
      }
      
      // Parse date components directly
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) {
        return dateStr;
      }
      
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return dateStr;
      }
      
      // Create date objects for comparison (using local time constructor)
      const appointmentDate = new Date(year, month, day);
      appointmentDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (appointmentDate.getTime() === today.getTime()) {
        return 'Today';
      } else if (appointmentDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        return appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      if (typeof dateString === 'string') {
        return dateString;
      }
      if (dateString instanceof Date) {
        return dateString.toISOString().split('T')[0];
      }
      return '';
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {session.user.username}! Here's what's happening with your pet health management.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <div
            key={stat.title}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Pets */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Pets
            </h3>
            <div className="space-y-4">
              {recentPets.length > 0 ? (
                recentPets.map((pet) => (
                  <div key={pet.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                        {pet.avatar}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pet.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {pet.breed} • {pet.age}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-gray-500">{pet.lastVisit}</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          pet.status === 'healthy'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {pet.status === 'healthy' ? 'Healthy' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No pets found
                </p>
              )}
            </div>
            <div className="mt-4">
              <a
                href="/dashboard/pets"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all pets →
              </a>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Upcoming Appointments
            </h3>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.appointment_title || appointment.reason || 'Appointment'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userRole === 'USER' 
                            ? `Dr. ${appointment.veterinarian_name || 'Veterinarian'}`
                            : userRole === 'VETERINARIAN'
                            ? `${appointment.user_name || 'Pet Owner'}`
                            : `${appointment.user_name || 'Pet Owner'} - Dr. ${appointment.veterinarian_name || 'Veterinarian'}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(appointment.appointment_time)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatAppointmentDate(appointment.appointment_date)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          appointment.status === 'accepted' || appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming appointments
                </p>
              )}
            </div>
            <div className="mt-4">
              <a
                href={
                  userRole === 'USER' 
                    ? "/dashboard/appointment-schedule"
                    : userRole === 'VETERINARIAN'
                    ? "/dashboard/veterinarian-appointments"
                    : "/dashboard/appointments"
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all appointments →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Only visible for USER role */}
      {isUserRole && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/dashboard/pets/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Add New Pet
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Register a new pet in the system
                </p>
              </div>
            </a>

            <a
              href="/dashboard/appointment-schedule"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Schedule Appointment
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Book a new appointment
                </p>
              </div>
            </a>

            <a
              href="/dashboard/ai-analysis"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  AI Analysis
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Run AI-powered health analysis
                </p>
              </div>
            </a>

            <a
              href="/dashboard/health-records"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Health Records
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage health records
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
