"use client";

import { useState } from "react";
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

interface VeterinarianAppointmentListProps {
  appointments: Appointment[];
  onAppointmentUpdated: (appointment: Appointment) => void;
  onRefresh: () => void;
}

export default function VeterinarianAppointmentList({
  appointments,
  onAppointmentUpdated,
  onRefresh,
}: VeterinarianAppointmentListProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "rescheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (date: string | Date, time: string) => {
    try {
      // Handle different date formats - date might be YYYY-MM-DD or a full timestamp
      let dateStr: string = "";

      // If date is a Date object, extract components using UTC methods to avoid timezone shifts
      if (date instanceof Date) {
        // Use UTC methods to get the exact date without timezone conversion
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        dateStr = `${year}-${month}-${day}`;
      } else if (typeof date === "string") {
        // Handle ISO date strings (e.g., "2024-12-20T00:00:00.000Z" or "2024-12-20")
        if (date.includes("T")) {
          // Extract just the date part before T
          dateStr = date.split("T")[0];
        } else if (date.includes(" ")) {
          // Handle space-separated dates
          dateStr = date.split(" ")[0];
        } else {
          dateStr = date;
        }
      } else {
        return `${date} ${time}`;
      }

      // Parse date components directly to avoid timezone issues
      const dateParts = dateStr.split("-");
      if (dateParts.length !== 3) {
        return `${date} ${time}`;
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10); // 1-12
      const day = parseInt(dateParts[2], 10);

      // Validate parsed values
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return `${date} ${time}`;
      }

      // Parse time components
      let hour = 0;
      let minute = 0;
      if (time && typeof time === "string" && time.includes(":")) {
        const timeParts = time.split(":");
        hour = parseInt(timeParts[0], 10) || 0;
        minute = parseInt(timeParts[1], 10) || 0;
      }

      // Format date and time directly from parsed values (no Date object conversion for formatting)
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      // Get weekday using a Date object (only for weekday calculation, using local time constructor)
      const dateForWeekday = new Date(year, month - 1, day);
      const weekday = weekdayNames[dateForWeekday.getDay()];
      const monthName = monthNames[month - 1];

      // Format time directly from parsed values
      const hour12 = hour % 12 || 12;
      const ampm = hour >= 12 ? "PM" : "AM";
      const minuteStr = String(minute).padStart(2, "0");
      const formattedTime = `${hour12}:${minuteStr} ${ampm}`;

      return `${weekday}, ${monthName} ${day}, ${year} at ${formattedTime}`;
    } catch (error) {
      // Fallback to simple display
      return `${date} ${time}`;
    }
  };

  const canAccept = (appointment: Appointment) => {
    return appointment.status === "pending";
  };

  const canReject = (appointment: Appointment) => {
    return (
      appointment.status === "pending" || appointment.status === "accepted"
    );
  };

  const canComplete = (appointment: Appointment) => {
    return appointment.status === "accepted";
  };

  const handleAccept = async (appointmentId: number) => {
    try {
      setLoading(appointmentId);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "accepted",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Appointment accepted successfully");
        onAppointmentUpdated(data.appointment);
      } else {
        setError(data.error || "Failed to accept appointment");
      }
    } catch (err) {
      setError("Failed to accept appointment");
      console.error("Error accepting appointment:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (appointmentId: number) => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(appointmentId);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          reschedule_reason: rejectReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Appointment rejected successfully");
        onAppointmentUpdated(data.appointment);
        setShowRejectModal(null);
        setRejectReason("");
      } else {
        setError(data.error || "Failed to reject appointment");
      }
    } catch (err) {
      setError("Failed to reject appointment");
      console.error("Error rejecting appointment:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleComplete = async (appointmentId: number) => {
    try {
      setLoading(appointmentId);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Appointment marked as completed");
        onAppointmentUpdated(data.appointment);
      } else {
        setError(data.error || "Failed to complete appointment");
      }
    } catch (err) {
      setError("Failed to complete appointment");
      console.error("Error completing appointment:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleRefresh = () => {
    onRefresh();
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No appointments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No appointments found for the selected filter.
          </p>
          <div className="mt-6">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Appointments ({appointments.length})
          </h2>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {success && (
        <div className="px-6 py-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Appointment #{appointment.id}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(appointment.payment_status)}`}
                  >
                    {appointment.payment_status.charAt(0).toUpperCase() +
                      appointment.payment_status.slice(1)}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pet Owner:</span>{" "}
                    {appointment.user_name} ({appointment.user_email})
                  </p>
                  {appointment.user_contact && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span>{" "}
                      {appointment.user_contact}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date & Time:</span>{" "}
                    {formatDateTime(
                      appointment.appointment_date,
                      appointment.appointment_time,
                    )}
                  </p>
                  {appointment.reason && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span>{" "}
                      {appointment.reason}
                    </p>
                  )}
                  {appointment.reschedule_reason && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>{" "}
                      {appointment.reschedule_reason}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(appointment.created_at).toLocaleString()}
                  </p>
                  {appointment.confirmed_at && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Confirmed:</span>{" "}
                      {new Date(appointment.confirmed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {canAccept(appointment) && (
                  <button
                    onClick={() => handleAccept(appointment.id)}
                    disabled={loading === appointment.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === appointment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Accepting...
                      </>
                    ) : (
                      "Accept"
                    )}
                  </button>
                )}

                {canReject(appointment) && (
                  <button
                    onClick={() => setShowRejectModal(appointment.id)}
                    disabled={loading === appointment.id}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                )}

                {canComplete(appointment) && (
                  <button
                    onClick={() => handleComplete(appointment.id)}
                    disabled={loading === appointment.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === appointment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      "Complete"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Appointment
              </h3>
              <div className="mb-4">
                <label
                  htmlFor="rejectReason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reason for rejection *
                </label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Please provide a reason for rejecting this appointment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={loading === showRejectModal || !rejectReason.trim()}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === showRejectModal ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
