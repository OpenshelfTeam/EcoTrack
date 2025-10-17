import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Briefcase, MapPin, Calendar, Shield, Edit2, Save, X, Camera, Loader2 } from 'lucide-react';
import { userService } from '../services/user.service';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    province: user?.address?.province || user?.address?.state || '',
    postalCode: user?.address?.postalCode || user?.address?.zipCode || '',
    fullAddress: ''
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(user!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      refreshUser && refreshUser();
      setIsEditing(false);
      alert('Profile updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error updating profile: ${error.response?.data?.message || error.message}`);
    }
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData({ 
              ...formData, 
              fullAddress: data.display_name,
              street: data.address?.road || data.address?.suburb || '',
              city: data.address?.city || data.address?.town || data.address?.village || '',
              province: data.address?.state || data.address?.province || '',
              postalCode: data.address?.postcode || ''
            });
          }
        } catch (error) {
          console.error('Error getting address:', error);
          setFormData({ 
            ...formData, 
            fullAddress: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          });
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please ensure location permissions are enabled.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSave = () => {
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
      }
    };

    // Add coordinates if available
    if (coordinates) {
      updateData.address.coordinates = [coordinates.lng, coordinates.lat];
    }

    updateProfileMutation.mutate(updateData);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                <User className="h-16 w-16 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 group">
                <Camera className="h-4 w-4 text-emerald-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                {user?.firstName} {user?.lastName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Verified</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Member since 2024</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Edit2 className="h-5 w-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-white text-emerald-600 px-5 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to user's current data
                    setFormData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      street: user?.address?.street || '',
                      city: user?.address?.city || '',
                      province: user?.address?.province || user?.address?.state || '',
                      postalCode: user?.address?.postalCode || user?.address?.zipCode || '',
                      fullAddress: ''
                    });
                    setCoordinates(null);
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="h-6 w-6 text-emerald-600" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-900">
                      {user?.firstName}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-900">
                      {user?.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-900">
                    {user?.email}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-900">
                    {user?.phone}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Get Current Location Button */}
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation || updateProfileMutation.isPending}
                      className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {gettingLocation ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-5 h-5" />
                          Use Current Location
                        </>
                      )}
                    </button>
                    
                    {/* Address Fields */}
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Street Address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        placeholder="Province"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    {coordinates && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location captured: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-900">
                    {user?.address ? (
                      typeof user.address === 'string' ? (
                        user.address
                      ) : (
                        <div className="space-y-1">
                          {user.address.street && <div>{user.address.street}</div>}
                          {(user.address.city || user.address.state || user.address.province || user.address.zipCode || user.address.postalCode) && (
                            <div>
                              {(user.address.city) && `${user.address.city}`}
                              {(user.address.state || user.address.province) && `, ${user.address.state || user.address.province}`}
                              {(user.address.zipCode || user.address.postalCode) && ` ${user.address.zipCode || user.address.postalCode}`}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      'No address provided'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Account Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Collections</span>
                  <span className="text-2xl font-bold">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Active Bins</span>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Resolved Tickets</span>
                  <span className="text-2xl font-bold">8</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Membership</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
