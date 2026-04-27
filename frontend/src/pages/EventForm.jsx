import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import api from '../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ setLatLng }) {
  const map = useMapEvents({
    click(e) {
      setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

function EventForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    event_date: '',
    max_participants: 10,
  });
  const [latLng, setLatLng] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latLng) {
      toast.error('Укажите место на карте');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/events', {
        ...formData,
        latitude: latLng.lat,
        longitude: latLng.lng,
      });
      toast.success('Событие создано!');
      navigate('/');
    } catch (err) {
      toast.error('Ошибка при создании');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Создать событие</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Город *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Дата и время *</label>
              <input
                type="datetime-local"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Макс. участников *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Место на карте *</label>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[55.751244, 37.618423]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker setLatLng={setLatLng} />
                {latLng && <Marker position={[latLng.lat, latLng.lng]} />}
              </MapContainer>
            </div>
            {latLng && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Координаты: {latLng.lat.toFixed(6)}, {latLng.lng.toFixed(6)}
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EventForm;
