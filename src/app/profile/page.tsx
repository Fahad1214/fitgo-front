'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  google_id: string | null;
  auth_provider: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  shopify_customer_id: number | null;
}

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Always fetch from database to get latest data (don't skip if profile exists)
    setLoading(true);
    fetch(`/api/users/profile?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          console.log('Profile loaded from DB:', {
            full_name: data.user.full_name,
            profile_picture: data.user.profile_picture ? 'Image exists (' + data.user.profile_picture.substring(0, 50) + '...)' : 'No image'
          });
          setProfile(data.user);
          setEditedName(data.user.full_name || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        setLoading(false);
      });
  }, [user?.id, router, authLoading]); // Only depend on user.id to avoid unnecessary refetches

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditedName(profile?.full_name || '');
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName(profile?.full_name || '');
  };

  const handleSaveName = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/users/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fullName: editedName.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setProfile(data.user);
        setIsEditingName(false);
        setError(null);
        // Trigger a custom event to update navbar without reloading
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        setError(data.error || 'Failed to update name');
      }
    } catch (err) {
      console.error('Error updating name:', err);
      setError('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleImageClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (fileInputRef.current && !saving) {
      console.log('Opening file picker...');
      fileInputRef.current.click();
    } else {
      console.log('File input ref:', fileInputRef.current, 'Saving:', saving);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage (or convert to base64 for now)
    // For now, we'll use base64. In production, you'd upload to Supabase Storage
    setIsEditingImage(true);
    setSaving(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/users/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profilePicture: base64,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        console.log('Image updated successfully:', data.user.profile_picture ? 'Image saved' : 'No image');
        setProfile(data.user);
        setIsEditingImage(false);
        setError(null);
        setImagePreview(null);
        // Trigger a custom event to update navbar without reloading
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        console.error('Failed to update image:', data.error);
        setError(data.error || 'Failed to update image');
        setImagePreview(null);
      }
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Failed to update image');
      setImagePreview(null);
    } finally {
      setSaving(false);
      setIsEditingImage(false);
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const getAvatarUrl = () => {
    // Always prioritize database data over auth metadata
    if (imagePreview) {
      return imagePreview;
    }
    if (profile?.profile_picture) {
      return profile.profile_picture;
    }
    // Only use auth metadata as fallback if database doesn't have it
    if (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) {
      return user.user_metadata.avatar_url || user.user_metadata.picture;
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-orange-500 hover:text-orange-600">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div 
                className="flex items-center justify-center w-24 h-24 rounded-full bg-orange-500 overflow-hidden cursor-pointer hover:opacity-80 transition relative"
                title="Click to change profile picture"
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={profile?.full_name || user?.email || 'Profile'}
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const initials = getInitials(profile?.full_name || null, profile?.email || user?.email || null);
                        parent.innerHTML = `<span class="text-white font-bold text-3xl">${initials}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-3xl pointer-events-none">
                    {getInitials(profile?.full_name || null, profile?.email || user?.email || null)}
                  </span>
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 cursor-pointer hover:bg-orange-600 transition z-20 shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImageClick(e);
                }}
                title="Change profile picture"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-24 h-24 rounded-full opacity-0 cursor-pointer z-30"
                disabled={saving}
                style={{ fontSize: 0 }}
                aria-label="Upload profile picture"
                onClick={(e) => {
                  // Ensure click works
                  e.stopPropagation();
                }}
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {profile?.full_name || profile?.email || user?.email || 'User Profile'}
              </h1>
              <p className="text-gray-300">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Email */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-lg text-gray-900">{profile?.email || user?.email}</p>
              </div>

              {/* Full Name - Editable */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  {!isEditingName ? (
                    <button
                      onClick={handleEditName}
                      className="text-orange-500 cursor-pointer hover:text-orange-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveName}
                        disabled={saving}
                        className="text-green-600 cursor-pointer hover:text-green-700 text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={saving}
                        className="text-gray-600 cursor-pointer hover:text-gray-700 text-sm font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {isEditingName ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
                    placeholder="Enter your full name"
                    disabled={saving}
                  />
                ) : (
                  <p className="text-lg text-gray-900">
                    {profile?.full_name || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                )}
              </div>

              {/* First Name */}
              {profile?.first_name && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                  <p className="text-lg text-gray-900">{profile.first_name}</p>
                </div>
              )}

              {/* Last Name */}
              {profile?.last_name && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                  <p className="text-lg text-gray-900">{profile.last_name}</p>
                </div>
              )}

              {/* Auth Provider */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Sign In Method</label>
                <p className="text-lg text-gray-900 capitalize">
                  {profile?.auth_provider === 'google' ? 'Google' : 'Email (Magic Link)'}
                </p>
              </div>

              {/* Email Verified */}
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Verified</label>
                <div className="flex items-center">
                  {profile?.email_verified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Not Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Account Created */}
              {profile?.created_at && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                  <p className="text-lg text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Google ID (if applicable) */}
              {profile?.google_id && (
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Google ID</label>
                  <p className="text-sm text-gray-600 font-mono">{profile.google_id}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
              >
                Sign Out
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
