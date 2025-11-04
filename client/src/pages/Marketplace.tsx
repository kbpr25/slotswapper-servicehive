import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface SwappableSlot {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  user_id: number;
  user_name: string;
  user_email: string;
}

interface MySlot {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
}

const Marketplace: React.FC = () => {
  const [slots, setSlots] = useState<SwappableSlot[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<MySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SwappableSlot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMarketplace();
    fetchMySwappableSlots();
  }, []);

  const fetchMarketplace = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/swap/marketplace`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSlots(response.data.slots);
    } catch (error: any) {
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySwappableSlots = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/swap/my-swappable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMySwappableSlots(response.data.slots);
    } catch (error: any) {
      console.error('Failed to load my swappable slots');
    }
  };

  const handleRequestSwap = (slot: SwappableSlot) => {
    if (mySwappableSlots.length === 0) {
      toast.error('You need at least one SWAPPABLE slot to offer in exchange');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleSwapRequest = async (mySlotId: number) => {
    if (!selectedSlot) return;

    try {
      await axios.post(
        `${API_URL}/api/swap/request`,
        {
          mySlotId: mySlotId,
          theirSlotId: selectedSlot.id
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      toast.success('Swap request sent successfully!');
      setShowModal(false);
      setSelectedSlot(null);
      fetchMarketplace(); // Refresh marketplace
      fetchMySwappableSlots(); // Refresh my slots
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create swap request');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>Swap Marketplace</h1>
      
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p style={{ margin: 0 }}>
          Browse available slots from other users. Click "Request Swap" to offer one of your swappable slots in exchange.
        </p>
      </div>

      {loading ? (
        <p>Loading marketplace...</p>
      ) : slots.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <p>No swappable slots available at the moment. Check back later!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
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
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{slot.title}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Owner:</strong> {slot.user_name}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Start:</strong> {format(new Date(slot.start_time), 'PPpp')}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>End:</strong> {format(new Date(slot.end_time), 'PPpp')}
                  </p>
                </div>

                <button
                  onClick={() => handleRequestSwap(slot)}
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
                  Request Swap
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for selecting which slot to offer */}
      {showModal && selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Select Your Slot to Offer</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Choose one of your swappable slots to offer in exchange for:
              <br />
              <strong>{selectedSlot.title}</strong>
            </p>

            {mySwappableSlots.length === 0 ? (
              <p style={{ color: '#f44336' }}>
                You have no swappable slots. Mark an event as swappable first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {mySwappableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => handleSwapRequest(slot.id)}
                    style={{
                      border: '1px solid #2196F3',
                      borderRadius: '4px',
                      padding: '15px',
                      cursor: 'pointer',
                      backgroundColor: '#f0f8ff'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>{slot.title}</h4>
                    <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                      {format(new Date(slot.start_time), 'PPpp')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowModal(false);
                setSelectedSlot(null);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
