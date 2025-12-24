"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import VeterinarianAppointmentList from "@/components/dashboard/veterinarian-appointments/VeterinarianAppointmentList";
import AppointmentStats from "@/components/dashboard/veterinarian-appointments/AppointmentStats";
import Alert from "@/components/ui/Alert";

interface Appointment {
  id: number;
  user_id: number;
  veterinarian_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "rescheduled"
    | "completed";
  reschedule_reason?: string;
  rescheduled_from?: string;
  payment_status: "unpaid" | "paid";
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

interface AppointmentStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  rescheduled: number;
  completed: number;
}

export default function VeterinarianAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0,
    rescheduled: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "accepted" | "completed"
  >("pending");

  const calculateStats = useCallback((appointments: Appointment[]) => {
    const stats = {
      total: appointments.length,
      pending: appointments.filter((apt) => apt.status === "pending").length,
      accepted: appointments.filter((apt) => apt.status === "accepted").length,
      rejected: appointments.filter((apt) => apt.status === "rejected").length,
      cancelled: appointments.filter((apt) => apt.status === "cancelled")
        .length,
      rescheduled: appointments.filter((apt) => apt.status === "rescheduled")
        .length,
      completed: appointments.filter((apt) => apt.status === "completed")
        .length,
    };
    setStats(stats);
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments");
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        calculateStats(data.appointments);
      } else {
        setError(data.error || "Failed to fetch appointments");
      }
    } catch (err) {
      setError("Failed to fetch appointments");
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/signin");
      return;
    }

    // Only VETERINARIAN role can access this page
    if (session.user.userRole !== "VETERINARIAN") {
      router.push("/dashboard");
      return;
    }

    fetchAppointments();
  }, [session, status, router, fetchAppointments]);

  const handleAppointmentUpdated = (updatedAppointment: Appointment) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt,
      ),
    );
    calculateStats(
      appointments.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt,
      ),
    );
  };

  const getFilteredAppointments = () => {
    switch (activeTab) {
      case "pending":
        return appointments.filter((apt) => apt.status === "pending");
      case "accepted":
        return appointments.filter((apt) => apt.status === "accepted");
      case "completed":
        return appointments.filter((apt) => apt.status === "completed");
      default:
        return appointments;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.userRole !== "VETERINARIAN") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Appointments
        </h1>
        <p className="text-gray-600">
          Review and manage appointment requests from pet owners.
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Appointment Statistics */}
      <AppointmentStats stats={stats} />

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "accepted"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Accepted ({stats.accepted})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "completed"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Completed ({stats.completed})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Appointments ({stats.total})
          </button>
        </nav>
      </div>

      {/* Appointment List */}
      <VeterinarianAppointmentList
        appointments={getFilteredAppointments()}
        onAppointmentUpdated={handleAppointmentUpdated}
        onRefresh={fetchAppointments}
      />
    </div>
  );
}
