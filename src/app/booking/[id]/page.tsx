'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Image from 'next/image';

interface MassageShop {
  _id: string;
  name: string;
  address: string;
  tel: string;
  openTime: string;
  closeTime: string;
  numMasseurs: number;
  imageUrl?: string | null;
}

export default function BookingPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [shop, setShop] = useState<MassageShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Form state
  const [reservationDate, setReservationDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';
  const BASE_URL = API_URL.replace('/api/v1', '');

  // Get full image URL - handle both absolute and relative paths
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/massage-shop-placeholder.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${BASE_URL}${url}`;
  };

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/massageshops/${id}`);
        
        if (!response.ok) {
          throw new Error('Shop not found');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setShop(data.data);
        } else {
          throw new Error(data.error || 'Failed to load shop details');
        }
      } catch (err) {
        console.error('Error fetching shop details:', err);
        setError('Failed to load massage shop details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopDetails();
  }, [id, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setSubmitError('You must be logged in to make a reservation');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch(`${API_URL}/massageshops/${id}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationDate,
          startTime,
          endTime
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        // Redirect to dashboard after successful booking
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create reservation');
      }
    } catch (err) {
      console.error('Error making reservation:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to make reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'Shop not found'}
        </div>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Use the database image URL if available, otherwise use placeholder
  const imageSrc = shop?.imageUrl ? getFullImageUrl(shop.imageUrl) : '/massage-shop-placeholder.jpg';

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.push('/')}
          className="mb-6 py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Back to Shops
        </button>
        
        <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
        <h2 className="text-xl font-semibold mb-6">{shop.name}</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 md:w-1/2">
            <h3 className="text-lg font-semibold mb-4">Shop Information</h3>
            <div className="relative w-full h-40 mb-4 rounded overflow-hidden bg-gray-200">
              {!imgError ? (
                <Image 
                  src={imageSrc}
                  alt={`${shop.name}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                  onError={() => setImgError(true)}
                  className="rounded"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <span>{shop.name}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-2">{shop.address}</p>
            <p className="text-gray-600 mb-2">Tel: {shop.tel}</p>
            <p className="text-gray-600 mb-2">Hours: {shop.openTime} - {shop.closeTime}</p>
            <p className="text-gray-600">Masseurs available: {shop.numMasseurs}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 md:w-1/2">
            {success ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                Reservation successful! Redirecting to dashboard...
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Make a Reservation</h3>
                
                {submitError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                    {submitError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      min={shop.openTime}
                      max={shop.closeTime}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      min={startTime || shop.openTime}
                      max={shop.closeTime}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400"
                  >
                    {submitting ? 'Processing...' : 'Book Appointment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 