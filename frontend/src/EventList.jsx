import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../services/api';
import toast from 'react-hot-toast';

function EventList() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ city: '', date_from: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.date_from) params.append('date_from', filters.date_from);
      
      const { data } = await api.get(`/events?${params}`);
      setEvents(data);
    } catch (err) {
      toast.error('Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">События</h1>
        <Link
          to="/events/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Создать событие
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Город"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border rounded-lg px-4 py-2"
          />
          <input
            type="datetime-local"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="border rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Нет событий</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2">{event.city}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(event.event_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Участников: {parseInt(event.current_participants)}/{event.max_participants}
                </p>
                <p className="text-sm text-blue-600 mt-2">Организатор: {event.organizer_name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;
