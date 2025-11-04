import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Event {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING';
  user_id: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEvents(response.data.events);
    } catch (error: any) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (eventId: number, newStatus: string) => {
    try {
      await axios.put(
        `${API_URL}/api/events/${eventId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success(`Event status updated to ${newStatus}`);
      fetchEvents(); // Refresh events list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      toast.error('Failed to delete event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUSY':
        return '#f44336';
      case 'SWAPPABLE':
        return '#4CAF50';
      case 'SWAP_PENDING':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
{/* Header with Navigation */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  marginBottom: '30px',
  borderBottom: '2px solid #4CAF50',
  paddingBottom: '15px'
}}>
  <h1>SlotSwapper Dashboard</h1>
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <button
      onClick={() => navigate('/marketplace')}
      style={{
        padding: '10px 20px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Marketplace
    </button>
    <button
      onClick={() => navigate('/requests')}
      style={{
        padding: '10px 20px',
        backgroundColor: '#FF9800',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Requests
    </button>
    <button
      onClick={handleLogout}
      style={{
        padding: '10px 20px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Logout
    </button>
  </div>
</div>

      {/* User Info */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Welcome, {user?.name}!</h2>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      {/* Create Event Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/create-event')}
          style={{
            padding: '12px 30px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          + Create New Event
        </button>
      </div>

      {/* Events List */}
      <div>
        <h3 style={{ marginBottom: '15px' }}>My Events ({events.length})</h3>
        
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p>No events yet. Create your first event!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                      {event.title}
                    </h4>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Start:</strong> {format(new Date(event.start_time), 'PPpp')}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>End:</strong> {format(new Date(event.end_time), 'PPpp')}
                    </p>
                    <p style={{ margin: '10px 0' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: getStatusColor(event.status),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {event.status}
                      </span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {event.status === 'BUSY' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'SWAPPABLE')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Make Swappable
                      </button>
                    )}
                    {event.status === 'SWAPPABLE' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'BUSY')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Mark as Busy
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
