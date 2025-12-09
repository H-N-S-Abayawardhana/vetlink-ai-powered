'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppointmentScheduler from '@/components/dashboard/appointment-schedule/AppointmentScheduler';
import AppointmentList from '@/components/dashboard/appointment-schedule/AppointmentList';
import Alert from '@/components/ui/Alert';

interface Appointment {
  id: number;
  user_id: number;
  veterinarian_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'rescheduled' | 'completed';
  reschedule_reason?: string;
  rescheduled_from?: string;
  payment_status: 'unpaid' | 'paid';
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  user_name: string;
  user_email: string;
  user_contact?: string;
  veterinarian_name: string;
  veterinarian_email: string;
  veterinarian_contact?: string;
}

export default function AppointmentSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'list'>('schedule');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/signin');
      return;
    }

    // Only USER role can access appointment scheduling
    if (session.user.userRole !== 'USER') {
      router.push('/dashboard');
      return;
    }

    fetchAppointments();
  }, [session, status, router]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentCreated = (newAppointment: Appointment) => {
    setAppointments(prev => [newAppointment, ...prev]);
    setActiveTab('list');
  };

  const handleAppointmentUpdated = (updatedAppointment: Appointment) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
  };

  const handleAppointmentCancelled = (appointmentId: number) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const }
          : apt
      )
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.userRole !== 'USER') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Appointment Scheduling
        </h1>
        <p className="text-gray-600">
          Schedule appointments with our veterinarians for your pet's health needs.
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Schedule New Appointment
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Appointments ({appointments.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <AppointmentScheduler onAppointmentCreated={handleAppointmentCreated} />
      )}

      {activeTab === 'list' && (
        <AppointmentList
          appointments={appointments}
          onAppointmentUpdated={handleAppointmentUpdated}
          onAppointmentCancelled={handleAppointmentCancelled}
          onRefresh={fetchAppointments}
        />
      )}
    </div>
  );
}
