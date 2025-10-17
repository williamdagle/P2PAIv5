import React from 'react';
import { Clock, User } from 'lucide-react';
import {
  HOURS,
  STATUS_COLORS,
  formatTime,
  formatHour,
  isLight,
  darkenColor,
  isToday
} from '../../utils/calendarHelpers';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface ThreeDayViewProps {
  appointments: Appointment[];
  startDate: string;
}

export default function ThreeDayView({ appointments, startDate }: ThreeDayViewProps) {
  const getDays = () => {
    const start = new Date(startDate);
    return [0, 1, 2].map(offset => {
      const date = new Date(start);
      date.setDate(date.getDate() + offset);
      return date;
    });
  };

  const days = getDays();

  const getAppointmentsForDayAndHour = (date: Date, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        aptDate.getHours() === hour
      );
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

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
      <div className="flex border-b border-gray-200">
        <div className="w-16 flex-shrink-0 bg-gray-50"></div>
        {days.map((date, index) => (
          <div
            key={index}
            className={`flex-1 text-center py-3 font-medium border-r border-gray-200 ${
              isToday(date) ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            <div className="text-sm">{formatDayHeader(date)}</div>
          </div>
        ))}
      </div>

      <div className="flex overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b border-gray-200 px-1 py-1 flex items-start"
            >
              <span className="text-xs font-medium text-gray-600">{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {days.map((date, dayIndex) => (
          <div key={dayIndex} className="flex-1 border-r border-gray-200">
            {HOURS.map((hour) => {
              const hourAppointments = getAppointmentsForDayAndHour(date, hour);
              return (
                <div
                  key={hour}
                  className={`h-[60px] border-b border-gray-200 relative transition-colors ${
                    isToday(date) ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {hourAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-1 text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      style={getAppointmentStyle(appointment)}
                      title={`${appointment.patient_name} - ${appointment.reason}`}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{appointment.patient_name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 mt-0.5">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatTime(appointment.appointment_date)}</span>
                      </div>
                      {appointment.duration_minutes > 30 && (
                        <div className="text-xs opacity-80 mt-0.5 truncate">
                          {appointment.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
