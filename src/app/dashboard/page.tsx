'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface Reservation {
  _id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  massageShop: {
    _id: string;
    name: string;
    address: string;
    tel: string;
    openTime: string;
    closeTime: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For editing reservations
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';

  useEffect(() => {
    if (user && token) {
        console.log(user);
      fetchReservations();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReservations(data.data);
      } else {
        throw new Error(data.error || 'Failed to load reservations');
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load your reservations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingId(reservation._id);
    setEditDate(new Date(reservation.reservationDate).toISOString().split('T')[0]);
    setEditStartTime(reservation.startTime);
    setEditEndTime(reservation.endTime);
    setUpdateError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`${API_URL}/reservations/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationDate: editDate,
          startTime: editStartTime,
          endTime: editEndTime
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reservation');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update the local state with the updated reservation
        setReservations(reservations.map(res => 
          res._id === editingId ? { ...res, 
            reservationDate: data.data.reservationDate,
            startTime: data.data.startTime,
            endTime: data.data.endTime
          } : res
        ));
        setEditingId(null);
      } else {
        throw new Error(data.error || 'Failed to update reservation');
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update reservation. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setUpdateError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel reservation');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted reservation from the local state
        setReservations(reservations.filter(res => res._id !== id));
      } else {
        throw new Error(data.error || 'Failed to cancel reservation');
      }
    } catch (err) {
      console.error('Error deleting reservation:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel reservation. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Your Account</h2>
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">Name</span>
                  <span className="block mt-1 text-gray-900">{user?.name}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-700">Email</span>
                  <span className="block mt-1 text-gray-900">{user?.email}</span>
                </div>
                {user?.tel && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Phone</span>
                    <span className="block mt-1 text-gray-900">{user.tel}</span>
                  </div>
                )}
                <div>
                  <span className="block text-sm font-medium text-gray-700">Role</span>
                  <span className="block mt-1 text-gray-900 capitalize">{user?.role || 'User'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Reservations</h2>
                <Link 
                  href="/"
                  className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
                >
                  Book New
                </Link>
              </div>
              
              {loading ? (
                <p className="text-center py-4">Loading your reservations...</p>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  {error}
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">You don`&apos;`t have any reservations yet.</p>
                  <Link 
                    href="/"
                    className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
                  >
                    Book a Massage
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {reservations.map(reservation => (
                    <div key={reservation._id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      {editingId === reservation._id ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div>
                            <span className="block text-sm font-medium text-gray-700">Shop</span>
                            <span className="block mt-1 text-gray-900">{reservation.massageShop.name}</span>
                          </div>
                          
                          {updateError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                              {updateError}
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="editDate" className="block text-sm font-medium text-gray-700">
                              Date
                            </label>
                            <input
                              type="date"
                              id="editDate"
                              required
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="editStartTime" className="block text-sm font-medium text-gray-700">
                              Start Time
                            </label>
                            <input
                              type="time"
                              id="editStartTime"
                              required
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                              min={reservation.massageShop.openTime}
                              max={reservation.massageShop.closeTime}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="editEndTime" className="block text-sm font-medium text-gray-700">
                              End Time
                            </label>
                            <input
                              type="time"
                              id="editEndTime"
                              required
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                              min={editStartTime || reservation.massageShop.openTime}
                              max={reservation.massageShop.closeTime}
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              disabled={updateLoading}
                              className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400"
                            >
                              {updateLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold">{reservation.massageShop.name}</h3>
                            {/* <span className={`text-sm px-2 py-1 rounded ${
                              reservation.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </span> */}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            <div>
                              <span className="block text-sm font-medium text-gray-700">Date</span>
                              <span className="block text-gray-900">{formatDate(reservation.reservationDate)}</span>
                            </div>
                            <div>
                              <span className="block text-sm font-medium text-gray-700">Time</span>
                              <span className="block text-gray-900">{reservation.startTime} - {reservation.endTime}</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-3 mt-4">
                            <button
                              onClick={() => handleEdit(reservation)}
                              className="py-1 px-3 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(reservation._id)}
                              className="py-1 px-3 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 transition"
                            >
                              Cancel Reservation
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Link - Only show for admin users */}
        {user?.role === 'admin' && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Admin Controls</h3>
            <Link 
              href="/dashboard/admin/massage-shops"
              className="block w-full py-2 px-4 bg-gray-800 text-white text-center rounded hover:bg-gray-900 transition"
            >
              Manage Massage Shops
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 