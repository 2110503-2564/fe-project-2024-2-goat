import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MassageShopProps {
  id: string;
  name: string;
  address: string;
  tel: string;
  openTime: string;
  closeTime: string;
  numMasseurs: number;
  imageUrl?: string | null;
}

export default function MassageShopCard({ id, name, address, tel, openTime, closeTime, numMasseurs, imageUrl }: MassageShopProps) {
  const [imgError, setImgError] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Get the API URL from environment or use default
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
  
  // Use the database image URL if available, otherwise use placeholder
  const imageSrc = getFullImageUrl(imageUrl);

  // Determine the link destination based on authentication status
  const bookingLink = isAuthenticated 
    ? `/booking/${id}`
    : `/auth/login?redirectTo=/booking/${id}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-100 w-full bg-gray-200">
        {!imgError ? (
          <Image 
            src={imageSrc} 
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <span>{name}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-gray-600 mb-2">{address}</p>
        <p className="text-gray-600 mb-2">Tel: {tel}</p>
        <p className="text-gray-600 mb-2">Hours: {openTime} - {closeTime}</p>
        <p className="text-gray-600 mb-4">Masseurs available: {numMasseurs}</p>
        
        <Link 
          href={bookingLink} 
          className="block w-full py-2 px-4 bg-black text-white text-center rounded hover:bg-gray-800 transition"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
} 