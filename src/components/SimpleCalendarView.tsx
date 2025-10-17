import React from 'react';
import { Clock, User } from 'lucide-react';

interface SimpleAppointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface SimpleCalendarViewProps {
  appointments: SimpleAppointment[];
  selectedDate: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

// Default color mapping for statuses
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3b82f6', // Blue
  completed: '#22c55e', // Green
  cancelled: '#ef4444', // Red
  pending: '#f59e0b', // Amber
  confirmed: '#8b5cf6', // Purple
};

export default function SimpleCalendarView({ appointments, selectedDate }: SimpleCalendarViewProps) {
  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getHours() === hour;
    });
  };

  const getAppointmentStyle = (appointment: SimpleAppointment) => {
    const startTime = new Date(appointment.appointment_date);
    const minutes = startTime.getMinutes();
    const durationMinutes = appointment.duration_minutes || 60;
    const height = (durationMinutes / 60) * 60; // 60px per hour
    const topOffset = (minutes / 60) * 60;

    const backgroundColor = STATUS_COLORS[appointment.status.toLowerCase()] || '#6b7280';
    const isLightColor = isLight(backgroundColor);

    return {
      height: `${Math.max(height, 30)}px`,
      top: `${topOffset}px`,
      backgroundColor,
      color: isLightColor ? '#000000' : '#ffffff',
      borderLeft: `4px solid ${darkenColor(backgroundColor)}`,
    };
  };

  const isLight = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  const darkenColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    if (hour === 0) return '12 AM';
    return `${hour} AM`;
  };

  return (
    <div className="flex bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="h-[60px] border-b border-gray-200 px-2 py-1 flex items-start"
          >
            <span className="text-xs font-medium text-gray-600">{formatHour(hour)}</span>
          </div>
        ))}
      </div>

      {/* Appointments column */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourAppointments = getAppointmentsForHour(hour);
          return (
            <div
              key={hour}
              className="h-[60px] border-b border-gray-200 relative hover:bg-gray-50 transition-colors"
            >
              {hourAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={getAppointmentStyle(appointment)}
                  title={`${appointment.patient_name} - ${appointment.reason}`}
                >
                  <div className="font-semibold truncate flex items-center gap-1">
                    <User className="h-3 w-3 flex-shrink-0" />
                    {appointment.patient_name}
                  </div>
                  <div className="flex items-center gap-1 opacity-90 mt-0.5">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {formatTime(appointment.appointment_date)}
                  </div>
                  {appointment.duration_minutes > 30 && (
                    <div className="text-xs opacity-80 mt-1 truncate">
                      {appointment.reason}
                    </div>
                  )}
                  <div className="text-xs font-medium mt-1 opacity-90">
                    {appointment.status}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
