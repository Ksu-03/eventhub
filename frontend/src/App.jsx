import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import Dashboard from './pages/Dashboard';
import EventForm from './pages/EventForm';
import EventChat from './pages/EventChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<EventList />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/events/create" element={
              <ProtectedRoute><EventForm /></ProtectedRoute>
            } />
            <Route path="/events/:id/chat" element={
              <ProtectedRoute><EventChat /></ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
