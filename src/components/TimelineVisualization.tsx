import React from 'react';
import { Calendar, AlertCircle, Heart, Flame, Droplets, User, Pill, FlaskConical, Activity, FileText, Cable as Capsule, Stethoscope } from 'lucide-react';

interface TimelineEvent {
  id: string;
  event_date: string;
  event_age?: number;
  event_type: string;
  category?: string;
  title: string;
  description?: string;
  severity?: string;
  impact_on_health?: string;
  related_symptoms?: string[];
  triggers_identified?: string[];
}

interface TimelineVisualizationProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onAddEvent?: () => void;
}

const eventTypeConfig: Record<string, { color: string; icon: any; label: string }> = {
  Appointment: { color: 'bg-blue-100 border-blue-500 text-blue-800', icon: Calendar, label: 'Appointment' },
  Treatment: { color: 'bg-green-100 border-green-500 text-green-800', icon: Activity, label: 'Treatment' },
  'Clinical Notes': { color: 'bg-amber-100 border-amber-500 text-amber-800', icon: FileText, label: 'Clinical Notes' },
  'Lab Work': { color: 'bg-teal-100 border-teal-500 text-teal-800', icon: FlaskConical, label: 'Lab Work' },
  Medication: { color: 'bg-rose-100 border-rose-500 text-rose-800', icon: Pill, label: 'Medication' },
  Supplement: { color: 'bg-lime-100 border-lime-500 text-lime-800', icon: Capsule, label: 'Supplement' },
  Symptom: { color: 'bg-red-100 border-red-500 text-red-800', icon: AlertCircle, label: 'Symptom' },
  'Lifestyle Change': { color: 'bg-cyan-100 border-cyan-500 text-cyan-800', icon: Heart, label: 'Lifestyle Change' },
  trauma: { color: 'bg-red-100 border-red-500 text-red-800', icon: AlertCircle, label: 'Trauma' },
  illness: { color: 'bg-orange-100 border-orange-500 text-orange-800', icon: Heart, label: 'Illness' },
  exposure: { color: 'bg-yellow-100 border-yellow-500 text-yellow-800', icon: Droplets, label: 'Exposure' },
  stress: { color: 'bg-purple-100 border-purple-500 text-purple-800', icon: Flame, label: 'Stress' },
  life_event: { color: 'bg-indigo-100 border-indigo-500 text-indigo-800', icon: User, label: 'Life Event' },
  symptom_onset: { color: 'bg-pink-100 border-pink-500 text-pink-800', icon: AlertCircle, label: 'Symptom Onset' },
  treatment: { color: 'bg-green-100 border-green-500 text-green-800', icon: Stethoscope, label: 'Treatment (FM)' },
  other: { color: 'bg-gray-100 border-gray-500 text-gray-800', icon: Calendar, label: 'Other' },
  Other: { color: 'bg-gray-100 border-gray-500 text-gray-800', icon: Calendar, label: 'Other' },
};

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-50 border-yellow-300',
  moderate: 'bg-orange-50 border-orange-300',
  severe: 'bg-red-50 border-red-300',
  life_threatening: 'bg-red-100 border-red-500',
};

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  events,
  onEventClick,
  onAddEvent,
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
        <p className="text-gray-600 mb-4">Start building the patient's functional medicine timeline</p>
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Event
          </button>
        )}
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Functional Medicine Timeline</h3>
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Add Event
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const config = eventTypeConfig[event.event_type] || eventTypeConfig.other;
            const Icon = config.icon;
            const severityColor = event.severity ? severityColors[event.severity] : '';

            return (
              <div key={event.id} className="relative pl-20">
                <div className="absolute left-0 top-0 flex items-center">
                  <div className={`w-16 h-16 rounded-full ${config.color} border-4 flex items-center justify-center shadow-lg z-10`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>

                <div
                  className={`bg-white rounded-lg shadow-md border-l-4 ${config.color.split(' ')[1]} p-4 hover:shadow-lg transition-shadow cursor-pointer ${severityColor}`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${config.color}`}>
                          {config.label}
                        </span>
                        {event.severity && (
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {event.severity.replace('_', ' ')}
                          </span>
                        )}
                        {event.category && (
                          <span className="text-xs text-gray-500 capitalize">{event.category}</span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      {event.event_age !== undefined && (
                        <div className="text-xs text-gray-600">Age {event.event_age}</div>
                      )}
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                  )}

                  {event.impact_on_health && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Impact on Health:</p>
                      <p className="text-sm text-blue-800">{event.impact_on_health}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs">
                    {event.related_symptoms && event.related_symptoms.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-700 mb-1">Related Symptoms:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.related_symptoms.map((symptom, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.triggers_identified && event.triggers_identified.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-700 mb-1">Triggers:</p>
                        <div className="flex flex-wrap gap-1">
                          {event.triggers_identified.map((trigger, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full"
                            >
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-8 top-16 h-6 w-0.5 bg-gray-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;
