'use client';

import { useState, useEffect } from 'react';
import Alert from '@/components/ui/Alert';

interface Veterinarian {
  id: number;
  username: string;
  email: string;
  contact_number?: string;
  created_at: string;
  total_appointments: number;
  pending_appointments: number;
  accepted_appointments: number;
}

interface TimeSlot {
  time: string;
  display_time: string;
  available: boolean;
}

interface AppointmentSchedulerProps {
  onAppointmentCreated: (appointment: any) => void;
}

export default function AppointmentScheduler({ onAppointmentCreated }: AppointmentSchedulerProps) {
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [selectedVet, setSelectedVet] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchVeterinarians();
  }, []);

  useEffect(() => {
    if (selectedVet && selectedDate) {
      fetchAvailability();
    } else {
      setTimeSlots([]);
      setSelectedTime('');
    }
  }, [selectedVet, selectedDate]);

  const fetchVeterinarians = async () => {
    try {
      const response = await fetch('/api/veterinarians');
      const data = await response.json();

      if (data.success) {
        setVeterinarians(data.veterinarians);
      } else {
        setError(data.error || 'Failed to fetch veterinarians');
      }
    } catch (err) {
      setError('Failed to fetch veterinarians');
      console.error('Error fetching veterinarians:', err);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedVet || !selectedDate) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/veterinarians/${selectedVet}/availability?date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success) {
        setTimeSlots(data.available_slots);
      } else {
        setError(data.error || 'Failed to fetch availability');
        setTimeSlots([]);
      }
    } catch (err) {
      setError('Failed to fetch availability');
      setTimeSlots([]);
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVet || !selectedDate || !selectedTime) {
      setError('Please select a veterinarian, date, and time');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          veterinarian_id: selectedVet,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          reason: reason.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Appointment scheduled successfully!');
        onAppointmentCreated(data.appointment);
        
        // Reset form
        setSelectedVet(null);
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        setTimeSlots([]);
      } else {
        setError(data.error || 'Failed to schedule appointment');
      }
    } catch (err) {
      setError('Failed to schedule appointment');
      console.error('Error scheduling appointment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Schedule New Appointment
      </h2>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" className="mb-4">
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Veterinarian Selection */}
        <div>
          <label htmlFor="veterinarian" className="block text-sm font-medium text-gray-700 mb-2">
            Select Veterinarian *
          </label>
          <select
            id="veterinarian"
            value={selectedVet || ''}
            onChange={(e) => setSelectedVet(parseInt(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Choose a veterinarian...</option>
            {veterinarians.map((vet) => (
              <option key={vet.id} value={vet.id}>
                Dr. {vet.username} - {vet.email}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date *
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Time Selection */}
        {selectedVet && selectedDate && (
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              Select Time *
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading available times...</span>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      selectedTime === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : slot.available
                        ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {slot.display_time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No available time slots for this date.</p>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Visit
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Please describe the reason for your pet's visit..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedVet || !selectedDate || !selectedTime}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
