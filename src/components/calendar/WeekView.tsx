import React from 'react';
import { Clock, User } from 'lucide-react';
import {
  HOURS,
  STATUS_COLORS,
  formatTime,
  formatHour,
  isLight,
  darkenColor,
  isToday,
  getWeekDays
} from '../../utils/calendarHelpers';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface WeekViewProps {
  appointments: Appointment[];
  startDate: string;
}

export default function WeekView({ appointments, startDate }: WeekViewProps) {
  const days = getWeekDays(startDate);

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
    const height = (durationMinutes / 60) * 50;
    const topOffset = (minutes / 60) * 50;

    const backgroundColor = STATUS_COLORS[appointment.status.toLowerCase()] || '#6b7280';
    const textColor = isLight(backgroundColor) ? '#000000' : '#ffffff';

    return {
      height: `${Math.max(height, 25)}px`,
      top: `${topOffset}px`,
      backgroundColor,
      color: textColor,
      borderLeft: `3px solid ${darkenColor(backgroundColor)}`,
    };
  };

  const formatDayHeader = (date: Date) => {
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: date.getDate(),
    };
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
      <div className="flex border-b border-gray-200">
        <div className="w-12 flex-shrink-0 bg-gray-50"></div>
        {days.map((date, index) => {
          const header = formatDayHeader(date);
          return (
            <div
              key={index}
              className={`flex-1 text-center py-2 border-r border-gray-200 ${
                isToday(date) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="text-xs text-gray-500">{header.weekday}</div>
              <div
                className={`text-lg font-semibold mt-1 ${
                  isToday(date) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {header.day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex overflow-y-auto overflow-x-auto" style={{ height: 'calc(100% - 70px)' }}>
        <div className="w-12 flex-shrink-0 border-r border-gray-200 bg-gray-50">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-[50px] border-b border-gray-200 px-1 py-1 flex items-start"
            >
              <span className="text-xs font-medium text-gray-600">{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {days.map((date, dayIndex) => (
          <div key={dayIndex} className="flex-1 min-w-[80px] border-r border-gray-200">
            {HOURS.map((hour) => {
              const hourAppointments = getAppointmentsForDayAndHour(date, hour);
              return (
                <div
                  key={hour}
                  className={`h-[50px] border-b border-gray-200 relative transition-colors ${
                    isToday(date) ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {hourAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      style={getAppointmentStyle(appointment)}
                      title={`${appointment.patient_name} - ${appointment.reason} at ${formatTime(appointment.appointment_date)}`}
                    >
                      <div className="font-semibold truncate text-xs">
                        {appointment.patient_name}
                      </div>
                      {appointment.duration_minutes >= 60 && (
                        <div className="text-xs opacity-80 truncate">
                          {formatTime(appointment.appointment_date)}
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
