import React from 'react';
import { Clock, User } from 'lucide-react';
import {
  HOURS,
  STATUS_COLORS,
  formatTime,
  formatHour,
  isLight,
  darkenColor
} from '../../utils/calendarHelpers';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface DayViewProps {
  appointments: Appointment[];
  selectedDate: string;
}

export default function DayView({ appointments, selectedDate }: DayViewProps) {
  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getHours() === hour;
    });
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    const startTime = new Date(appointment.appointment_date);
    const minutes = startTime.getMinutes();
    const durationMinutes = appointment.duration_minutes || 60;
    const height = (durationMinutes / 60) * 60;
    const topOffset = (minutes / 60) * 60;

    const backgroundColor = STATUS_COLORS[appointment.status.toLowerCase()] || '#6b7280';
    const textColor = isLight(backgroundColor) ? '#000000' : '#ffffff';

    return {
      height: `${Math.max(height, 30)}px`,
      top: `${topOffset}px`,
      backgroundColor,
      color: textColor,
      borderLeft: `4px solid ${darkenColor(backgroundColor)}`,
    };
  };

  return (
    <div className="flex bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
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
                  <div className="text-xs font-medium mt-1 opacity-90 capitalize">
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
