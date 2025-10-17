import React from 'react';
import {
  STATUS_COLORS,
  formatTime,
  isToday,
  isSameDay,
  getMonthDays,
  formatDateString
} from '../../utils/calendarHelpers';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  reason: string;
  status: string;
  patient_name: string;
}

interface MonthViewProps {
  appointments: Appointment[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function MonthView({ appointments, selectedDate, onDateSelect }: MonthViewProps) {
  const days = getMonthDays(selectedDate);
  const selected = new Date(selectedDate);

  const getAppointmentsForDay = (date: Date | null) => {
    if (!date) return [];

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return isSameDay(aptDate, date);
    });
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return isSameDay(date, selected);
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status.toLowerCase()] || '#6b7280';
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg overflow-hidden p-4" style={{ height: '600px' }}>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 auto-rows-fr" style={{ height: 'calc(100% - 50px)' }}>
        {days.map((date, index) => {
          const dayAppointments = getAppointmentsForDay(date);
          const isTodayDate = date ? isToday(date) : false;
          const isSelected = isSelectedDate(date);

          return (
            <div
              key={index}
              onClick={() => date && onDateSelect(formatDateString(date))}
              className={`border rounded-lg p-2 overflow-hidden transition-all ${
                date ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : 'bg-gray-50'
              } ${isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
                isSelected ? 'ring-2 ring-blue-400 border-blue-400' : ''
              }`}
            >
              {date && (
                <div className="h-full flex flex-col">
                  <div className={`text-center font-semibold mb-1 ${
                    isTodayDate ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs rounded px-1.5 py-1 truncate shadow-sm"
                          style={{
                            backgroundColor: getStatusColor(apt.status),
                            color: '#ffffff',
                          }}
                          title={`${apt.patient_name} - ${apt.reason} at ${formatTime(apt.appointment_date)}`}
                        >
                          <div className="font-medium truncate">{formatTime(apt.appointment_date)}</div>
                          <div className="truncate opacity-90">{apt.patient_name}</div>
                        </div>
                      ))
                    ) : null}

                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-center text-gray-600 font-medium py-1">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
