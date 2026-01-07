'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 justify-items-center md:justify-items-start">
          <div className="text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <Image src="/Logo.png" height={40} width={40} alt="FitGo Logo" className="object-contain"/>
              <span className="text-2xl font-bold text-orange-500">FitGo</span>
            </Link>
            <p className="text-gray-400">
              Your ultimate fitness destination. Transform your body, transform your life.
            </p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              {/* <li><Link href="/shop" className="hover:text-orange-500 transition">Shop</Link></li> */}
              <li><Link href="/locations" className="hover:text-orange-500 transition">Locations</Link></li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              {!user && (
                <li><Link href="/login" className="hover:text-orange-500 transition">Login</Link></li>
              )}
              <li><a href="#" className="hover:text-orange-500 transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-orange-500 transition">FAQ</a></li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex flex-col space-y-2 justify-center md:justify-start">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition">Twitter</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 FitGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

