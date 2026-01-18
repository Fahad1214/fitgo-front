'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface UserProfile {
  full_name: string | null;
  profile_picture: string | null;
}

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserProfile = () => {
    if (user) {
      // Fetch user profile data
      fetch(`/api/users/profile?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserProfile(data.user);
          }
        })
        .catch(err => console.error('Error fetching user profile:', err));
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [user]);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getAvatarUrl = () => {
    // Always prioritize database data over auth metadata
    if (userProfile?.profile_picture) {
      return userProfile.profile_picture;
    }
    // Only use auth metadata as fallback if database doesn't have it
    if (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) {
      return user.user_metadata.avatar_url || user.user_metadata.picture;
    }
    return null;
  };

  return (
    <nav className={`bg-gray-900 text-white sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'shadow-2xl backdrop-blur-md bg-white' : 'shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-orange-500 hover:text-orange-400 transition">
                <Image src="/Logo.png" height={40} width={40} alt="FitGo Logo" className="object-contain"/>
                FitGo
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* <Link 
              href="/shop" 
              className={`transition font-semibold ${
                pathname === '/shop' 
                  ? 'text-orange-500' 
                  : isScrolled 
                    ? 'text-black hover:text-orange-500' 
                    : 'text-white hover:text-orange-500'
              }`}
            >
              Shop
            </Link> */}
            <Link 
              href="/blog" 
              className={`transition font-semibold ${
                pathname === '/locations' 
                  ? 'text-orange-500' 
                  : isScrolled 
                    ? 'text-black hover:text-orange-500' 
                    : 'text-white hover:text-orange-500'
              }`}
            >
             Blog
            </Link>
            {/* <Link 
              href="/locations" 
              className={`transition font-semibold ${
                pathname === '/gyms' 
                  ? 'text-orange-500' 
                  : isScrolled 
                    ? 'text-black hover:text-orange-500' 
                    : 'text-white hover:text-orange-500'
              }`}
            >
             Locations
            </Link> */}
            <Link 
              href="/contact-us" 
              className={`transition font-semibold ${
                pathname === '/gyms' 
                  ? 'text-orange-500' 
                  : isScrolled 
                    ? 'text-black hover:text-orange-500' 
                    : 'text-white hover:text-orange-500'
              }`}
            >
            Contact Us
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 transition overflow-hidden"
                title={userProfile?.full_name || user.email || 'Profile'}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={userProfile?.full_name || user.email || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {getInitials(userProfile?.full_name || null, user.email || '')}
                  </span>
                )}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-orange-500 transition font-medium">
                  Login
                </Link>
                <Link 
                  href="/login" 
                  className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 hover:text-orange-500 transition">
              Home
            </Link>
            <Link href="/shop" className="block py-2 hover:text-orange-500 transition">
              Shop
            </Link>
            <Link href="/gyms" className="block py-2 hover:text-orange-500 transition">
              Gyms
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 transition overflow-hidden mx-auto"
                title={userProfile?.full_name || user.email || 'Profile'}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt={userProfile?.full_name || user.email || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {getInitials(userProfile?.full_name || null, user.email || '')}
                  </span>
                )}
              </Link>
            ) : (
              <>
                <Link href="/login" className="block py-2 hover:text-orange-500 transition">
                  Login
                </Link>
                <Link 
                  href="/login" 
                  className="block bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

