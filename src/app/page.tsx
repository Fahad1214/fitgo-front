'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

// Stats Counter Component
function StatCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let startTime: number | null = null;
            const startValue = 0;

            const animate = (currentTime: number) => {
              if (startTime === null) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              
              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const current = Math.floor(startValue + (end - startValue) * easeOutQuart);
              
              setCount(current);
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(end);
              }
            };
            
            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [end, hasAnimated, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
      {count}{suffix}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20 md:py-32 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="/Videos/HeroSection.webm"
            type="video/webm"
          />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        </video>
        {/* Overlay Layer for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-800/75 to-gray-900/80" />
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Transform Your <span className="text-orange-500">Body</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Join thousands of fitness enthusiasts on their journey to a stronger, healthier you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/gyms" 
                className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105"
              >
                Find a Gym
              </Link>
              <Link 
                href="/shop" 
                className="bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                Shop Equipment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose <span className="text-orange-500">FitGo</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Expert Trainers</h3>
              <p className="text-gray-600">
                Work with certified fitness professionals who will guide you every step of the way
              </p>
            </div>
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Premium Facilities</h3>
              <p className="text-gray-600">
                State-of-the-art equipment and clean, modern facilities designed for your success
              </p>
            </div>
            <div className="text-center p-6 rounded-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Flexible Hours</h3>
              <p className="text-gray-600">
                Train on your schedule with 24/7 access to most locations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <StatCounter end={50} suffix="K+" />
              <div className="text-gray-400">Active Members</div>
            </div>
            <div>
              <StatCounter end={200} suffix="+" />
              <div className="text-gray-400">Gym Locations</div>
            </div>
            <div>
              <StatCounter end={500} suffix="+" />
              <div className="text-gray-400">Expert Trainers</div>
            </div>
            <div>
              <StatCounter end={15} suffix="+" />
              <div className="text-gray-400">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 md:py-40 text-white overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="/Videos/GymVideo.webm"
            type="video/webm"
          />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600" />
        </video>
        {/* Overlay Layer for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-grey-900/70 to-black-900/70" />
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Join FitGo today and get your first month free!
          </p>
          <Link 
            href="/login" 
            className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition transform hover:scale-105 inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
