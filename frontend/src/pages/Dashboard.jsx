import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/users/me/events');
      setEvents(data);
    } catch (err) {
      toast.error('Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  const organizedEvents = events.filter(e => e.is_organizer);
  const participatedEvents = events.filter(e => !e.is_organizer);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Мой профиль</h1>
        <p className="text-gray-600">{user?.name}</p>
        <p className="text-gray-600">{user?.email}</p>
        <p className="text-gray-600">Город: {user?.city}</p>
        <p className="text-blue-600 font-semibold">Карма: {user?.karma}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Мои события (организатор)</h2>
        {organizedEvents.length === 0 ? (
          <p className="text-gray-500">Нет созданных событий</p>
        ) : (
          <div className="space-y-3">
            {organizedEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="block">
                <div className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.event_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Статус: {event.status === 'active' ? 'Активно' : 'Завершено'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Мои участия</h2>
        {participatedEvents.length === 0 ? (
          <p className="text-gray-500">Нет заявок</p>
        ) : (
          <div className="space-y-3">
            {participatedEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`} className="block">
                <div className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.event_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    Статус: {
                      event.participant_status === 'pending' ? '⏳ На рассмотрении' :
                      event.participant_status === 'accepted' ? '✅ Принят' : '❌ Отказано'
                    }
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

export default Dashboard;
