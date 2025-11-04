import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocket } from '../contexts/SocketContext';

interface SwapRequest {
  id: number;
  status: string;
  created_at: string;
  requester_name?: string;
  target_user_name?: string;
  their_slot_id: number;
  their_slot_title: string;
  their_slot_start: string;
  their_slot_end: string;
  my_slot_id: number;
  my_slot_title: string;
  my_slot_start: string;
  my_slot_end: string;
}

const Requests: React.FC = () => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch requests function
  const fetchRequests = async () => {
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        axios.get(`${API_URL}/api/swap/incoming`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/swap/outgoing`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setIncomingRequests(incomingRes.data.requests);
      setOutgoingRequests(outgoingRes.data.requests);
    } catch (error: any) {
      toast.error('Failed to load swap requests');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  // Listen for socket notifications and auto-refresh
  useEffect(() => {
    if (!socket) return;

    const handleNotification = () => {
      console.log('🔄 Notification received, refreshing requests...');
      fetchRequests();
    };

    socket.on('new_swap_request', handleNotification);
    socket.on('swap_accepted', handleNotification);
    socket.on('swap_rejected', handleNotification);

    // Cleanup function
    return () => {
      socket.off('new_swap_request', handleNotification);
      socket.off('swap_accepted', handleNotification);
      socket.off('swap_rejected', handleNotification);
    };
  }, [socket]);

  const handleRespond = async (requestId: number, accept: boolean) => {
    try {
      await axios.post(
        `${API_URL}/api/swap/respond/${requestId}`,
        { accept },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      toast.success(accept ? 'Swap accepted! Events have been swapped.' : 'Swap rejected.');
      fetchRequests(); // Refresh lists
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to respond to swap request');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>Swap Requests</h1>

      {/* Incoming Requests */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ 
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #4CAF50'
        }}>
          Incoming Requests ({incomingRequests.filter(r => r.status === 'PENDING').length})
        </h2>

        {loading ? (
          <p>Loading requests...</p>
        ) : incomingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p>No incoming swap requests.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {incomingRequests.filter(r => r.status === 'PENDING').map((request) => (
              <div
                key={request.id}
                style={{
                  border: '2px solid #4CAF50',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#f0fff0'
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>{request.requester_name}</strong> wants to swap:
                  </p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '15px',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  {/* Their Slot */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#2196F3' }}>
                      They Offer:
                    </p>
                    <h4 style={{ margin: '0 0 8px 0' }}>{request.their_slot_title}</h4>
                    <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                      {format(new Date(request.their_slot_start), 'PPp')}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div style={{ fontSize: '24px' }}>⟷</div>

                  {/* Your Slot */}
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#4CAF50' }}>
                      Your Slot:
                    </p>
                    <h4 style={{ margin: '0 0 8px 0' }}>{request.my_slot_title}</h4>
                    <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                      {format(new Date(request.my_slot_start), 'PPp')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleRespond(request.id, true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ✓ Accept Swap
                  </button>
                  <button
                    onClick={() => handleRespond(request.id, false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing Requests */}
      <section>
        <h2 style={{ 
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '2px solid #2196F3'
        }}>
          Outgoing Requests ({outgoingRequests.filter(r => r.status === 'PENDING').length})
        </h2>

        {loading ? (
          <p>Loading requests...</p>
        ) : outgoingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p>No outgoing swap requests.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {outgoingRequests.filter(r => r.status === 'PENDING').map((request) => (
              <div
                key={request.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: '#fff9e6'
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ⏳ PENDING
                  </span>
                </div>

                <p style={{ margin: '10px 0' }}>
                  Waiting for <strong>{request.target_user_name}</strong> to respond...
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '12px', color: '#666' }}>
                      YOU OFFER:
                    </p>
                    <h4 style={{ margin: '0 0 5px 0' }}>{request.my_slot_title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      {format(new Date(request.my_slot_start), 'PPp')}
                    </p>
                  </div>

                  <div style={{ fontSize: '24px' }}>→</div>

                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '12px', color: '#666' }}>
                      YOU WANT:
                    </p>
                    <h4 style={{ margin: '0 0 5px 0' }}>{request.their_slot_title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                      {format(new Date(request.their_slot_start), 'PPp')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Requests;
