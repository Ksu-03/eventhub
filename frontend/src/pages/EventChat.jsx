import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

function EventChat() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatId = async () => {
      try {
        const { data } = await api.get(`/events/${id}`);
        const chatResult = await api.get(`/events/${id}/chat`);
        setChatId(chatResult.data.chatId);
      } catch (err) {
        toast.error('Не удалось загрузить чат');
      }
    };
    
    fetchChatId();
  }, [id]);

  useEffect(() => {
    if (!chatId || !token) return;
    
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to chat');
      newSocket.emit('join:chat', { chatId });
    });
    
    newSocket.on('chat:history', (history) => {
      setMessages(history);
    });
    
    newSocket.on('new:message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('error', (err) => {
      toast.error(err.message);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [chatId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send:message', { chatId, message: newMessage });
    setNewMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-bold">Чат события</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.userId === user?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-xs font-semibold mb-1">{msg.name}</p>
              <p>{msg.message}</p>
              <p className="text-xs mt-1 opacity-75">
                {new Date(msg.sentAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Отправить
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventChat;
