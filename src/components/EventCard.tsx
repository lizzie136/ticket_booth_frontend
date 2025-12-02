import { Link } from 'react-router-dom';
import type { EventDateSummary } from '../api/types';

interface EventCardProps {
  slug: string;
  title: string;
  description: string;
  dates: EventDateSummary[];
}

export const EventCard = ({ title, description, dates }: EventCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Upcoming Dates
        </h3>
        <div className="space-y-2">
          {dates.map((date) => (
            <Link
              key={date.id}
              to={`/event-dates/${date.id}`}
              className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(date.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{date.venueName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      date.seatingMode === 'GA'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {date.seatingMode === 'GA' ? 'General Admission' : 'Seated'}
                  </span>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
