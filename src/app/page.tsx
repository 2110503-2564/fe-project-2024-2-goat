'use client';

import { useState, useEffect } from 'react';
import MassageShopCard from '@/components/MassageShopCard';
import Banner from '../components/Banner';

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

export default function Home() {
  const [massageShops, setMassageShops] = useState<MassageShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';

  useEffect(() => {
    const fetchMassageShops = async () => {
      try {
        const response = await fetch(`${API_URL}/massageshops`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch massage shops');
        }

        const data = await response.json();
        setMassageShops(data.data || []);
      } catch (err) {
        console.error('Error fetching massage shops:', err);
        setError('Failed to load massage shops. Please try again later.');
        
        // For demo purposes, add mock data when API fails
        setMassageShops([
          {
            _id: '1',
            name: 'Thai Massage Spa',
            address: '123 Massage St, Bangkok',
            tel: '0987654321',
            openTime: '09:00',
            closeTime: '18:00',
            numMasseurs: 3,
            imageUrl: null
          },
          {
            _id: '2',
            name: 'Relax Spa',
            address: '456 Relax St, Phuket',
            tel: '0123456789',
            openTime: '10:00',
            closeTime: '20:00',
            numMasseurs: 5,
            imageUrl: null
          },
          {
            _id: '3',
            name: 'Wellness Massage Center',
            address: '789 Wellness Ave, Chiang Mai',
            tel: '0555555555',
            openTime: '08:00',
            closeTime: '22:00',
            numMasseurs: 4,
            imageUrl: null
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMassageShops();
  }, [API_URL]);

  return (
    <div>
      {/* <img src="https://placeholder.com/1200x150/png" 
        alt="Banner" 
        className="w-full h-auto mb-6" 
        style={{ display: 'block', width: '100%', height: 'auto' }} 
      /> */}

    <main>
      <Banner />
    </main>
      <div className="container mx-auto px-4 py-8">
        
        <h1 className="text-3xl font-bold mb-6 text-center">Massage Shops</h1>
        
        {loading && (
          <div className="text-center py-8">
            <p>Loading massage shops...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {massageShops.map((shop) => (
            <MassageShopCard
              key={shop._id}
              id={shop._id}
              name={shop.name}
              address={shop.address}
              tel={shop.tel}
              openTime={shop.openTime}
              closeTime={shop.closeTime}
              numMasseurs={shop.numMasseurs}
              imageUrl={shop.imageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
