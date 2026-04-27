import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.event);
      setParticipants(data.participants);
      
      if (token && user) {
        const myParticipation = data.participants.find(p => p.user_id === user.id);
        setUserStatus(myParticipation?.status);
      }
    } catch (err) {
      toast.error('Не удалось загрузить событие');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await api.post(`/events/${id}/join`);
      toast.success('Заявка подана');
      fetchEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.post(`/events/${id}/participants/${userId}/status`, { status });
      toast.success('Статус обновлен');
      fetchEvent();
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить событие?')) {
      try {
        await api.delete(`/events/${id}`);
        toast.success('Событие удалено');
        navigate('/');
      } catch (err) {
        toast.error('Ошибка');
      }
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post(`/events/${id}/checkin`);
      toast.success('Вы отмечены на событии!');
      fetchEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) return <div className="text-center py-12">Загрузка...</div>;
  if (!event) return <div className="text-center py-12">Событие не найдено</div>;

  const acceptedCount = participants.filter(p => p.status === 'accepted').length;
  const isFull = acceptedCount >= event.max_participants;
  const isOrganizer = token && user && event.organizer_id === user.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
          {isOrganizer && (
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Удалить
            </button>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{event.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">📍 {event.city}, {event.address}</p>
            <p className="text-sm text-gray-500">
              📅 {format(new Date(event.event_date), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </p>
            <p className="text-sm text-gray-500">👥 {acceptedCount}/{event.max_participants} участников</p>
            <p className="text-sm text-blue-600">👤 Организатор: {event.organizer_name}</p>
          </div>
          
          <div>
            {token && !isOrganizer && userStatus === null && !isFull && (
              <button
                onClick={handleJoin}
                className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Подать заявку
              </button>
            )}
            
            {userStatus === 'pending' && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center">
                ⏳ Заявка на рассмотрении
              </div>
            )}
            
            {userStatus === 'accepted' && (
              <div className="space-y-2">
                <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                  ✅ Вы приняты
                </div>
                <button
                  onClick={() => navigate(`/events/${id}/chat`)}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  💬 Перейти в чат
                </button>
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  📱 Отметиться (QR)
                </button>
              </div>
            )}
          </div>
        </div>
        
        {event.latitude && event.longitude && (
          <div className="h-64 rounded-lg overflow-hidden mb-6">
            <MapContainer
              center={[event.latitude, event.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[event.latitude, event.longitude]}>
                <Popup>{event.title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Участники</h2>
        
        {isOrganizer && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Заявки</h3>
            {participants.filter(p => p.status === 'pending').length === 0 ? (
              <p className="text-gray-500">Нет заявок</p>
            ) : (
              <div className="space-y-2">
                {participants.filter(p => p.status === 'pending').map(p => (
                  <div key={p.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{p.name}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(p.user_id, 'accepted')}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Принять
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(p.user_id, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Отказать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">Принятые участники</h3>
        <div className="space-y-2">
          {participants.filter(p => p.status === 'accepted').map(p => (
            <div key={p.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {p.name[0]}
              </div>
              <div>
                <p className="font-medium">{p.name}</p>
                {p.checked_in && <p className="text-xs text-green-600">✓ Отмечен</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
export default EventDetails;
