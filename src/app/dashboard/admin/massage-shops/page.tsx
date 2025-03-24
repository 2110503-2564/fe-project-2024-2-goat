'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

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

export default function MassageShopsManagementPage() {
  const { user, token } = useAuth();
  const [massageShops, setMassageShops] = useState<MassageShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For editing massage shops
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  
  // For image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form fields
  const [form, setForm] = useState({
    name: '',
    address: '',
    tel: '',
    openTime: '',
    closeTime: '',
    numMasseurs: 3
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';
  const BASE_URL = API_URL.replace('/api/v1', '');

  // Get full image URL - handle both absolute and relative paths
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${BASE_URL}${url}`;
  };

  useEffect(() => {
    if (user && token) {
      fetchMassageShops();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchMassageShops = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/massageshops`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch massage shops');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMassageShops(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load massage shops');
      }
    } catch (err) {
      console.error('Error fetching massage shops:', err);
      setError('Failed to load massage shops. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'numMasseurs' ? parseInt(value) || 0 : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      tel: '',
      openTime: '',
      closeTime: '',
      numMasseurs: 3
    });
    setSelectedImage(null);
    setImagePreview(null);
    setFormError(null);
  };

  const handleCreateClick = () => {
    setCreateMode(true);
    setEditingId(null);
    resetForm();
  };

  const handleEditClick = (shop: MassageShop) => {
    setEditingId(shop._id);
    setCreateMode(false);
    setForm({
      name: shop.name,
      address: shop.address,
      tel: shop.tel,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
      numMasseurs: shop.numMasseurs
    });
    // Set image preview if available
    setImagePreview(shop.imageUrl ? getFullImageUrl(shop.imageUrl) : null);
    setSelectedImage(null);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCreateMode(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormError(null);
    setActionLoading(true);
    
    // Form validation
    if (!form.name || !form.address || !form.tel || !form.openTime || !form.closeTime) {
      setFormError('All fields are required');
      setActionLoading(false);
      return;
    }
    
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      let response;
      
      if (createMode) {
        // Create a new massage shop
        response = await fetch(`${API_URL}/massageshops`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else if (editingId) {
        // Update existing massage shop
        response = await fetch(`${API_URL}/massageshops/${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        throw new Error('Invalid operation');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (createMode) {
          // Add new shop to list
          setMassageShops([...massageShops, data.data]);
        } else {
          // Update shop in list
          setMassageShops(
            massageShops.map(shop => 
              shop._id === editingId ? data.data : shop
            )
          );
        }
        
        // Reset form state
        setCreateMode(false);
        setEditingId(null);
        resetForm();
      } else {
        throw new Error(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error('Error during operation:', err);
      setFormError(err instanceof Error ? err.message : 'Operation failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this massage shop? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/massageshops/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete massage shop');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted shop from the local state
        setMassageShops(massageShops.filter(shop => shop._id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete massage shop');
      }
    } catch (err) {
      console.error('Error deleting massage shop:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete massage shop. Please try again.');
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Massage Shop Management</h1>
            <p className="text-gray-600">Create, edit and manage massage shops</p>
          </div>
          <Link 
            href="/dashboard"
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {/* Create New / Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {createMode ? 'Create New Massage Shop' : editingId ? 'Edit Massage Shop' : 'Massage Shop Actions'}
            </h2>
            {!createMode && !editingId && (
              <button
                onClick={handleCreateClick}
                className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Create New Shop
              </button>
            )}
          </div>
          
          {(createMode || editingId) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter shop name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telephone
                  </label>
                  <input
                    type="text"
                    name="tel"
                    value={form.tel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="10-digit telephone number"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter full address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    name="openTime"
                    value={form.openTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={form.closeTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Masseurs
                  </label>
                  <input
                    type="number"
                    name="numMasseurs"
                    value={form.numMasseurs}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    
                    {imagePreview && (
                      <div className="relative h-24 w-24 border rounded overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Recommended: square image, at least 500x500px</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {actionLoading ? 'Processing...' : createMode ? 'Create Shop' : 'Update Shop'}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Shop List Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Massage Shops List</h2>
          
          {loading ? (
            <p className="text-center py-4">Loading massage shops...</p>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          ) : massageShops.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">No massage shops found.</p>
              <button
                onClick={handleCreateClick}
                className="py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Create First Shop
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Masseurs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {massageShops.map(shop => (
                    <tr key={shop._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                          {shop.imageUrl ? (
                            <img 
                              src={getFullImageUrl(shop.imageUrl)} 
                              alt={shop.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{shop.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-500">{shop.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{shop.tel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{shop.openTime} - {shop.closeTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{shop.numMasseurs}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEditClick(shop)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(shop._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 