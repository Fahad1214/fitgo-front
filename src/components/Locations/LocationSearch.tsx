"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Location } from "@/lib/locationdata";

interface LocationSearchProps {
  locations: Location[];
}

export default function LocationSearch({ locations }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) {
      return locations;
    }

    const query = searchQuery.toLowerCase().trim();
    return locations.filter((location) => {
      const nameMatch = location.name.toLowerCase().includes(query);
      const addressMatch = location.address.toLowerCase().includes(query);
      const featuresMatch = location.features.some((feature) =>
        feature.toLowerCase().includes(query)
      );
      const ownerMatch = location.ownerName?.toLowerCase().includes(query);

      return nameMatch || addressMatch || featuresMatch || ownerMatch;
    });
  }, [locations, searchQuery]);

  // Function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return text;
    }

    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <span key={index} className="bg-yellow-300">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Search Bar */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by location, name, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Found {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Gyms Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <div className="relative h-48 bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden">
                    {location.image ? (
                      <Image
                        src={location.image}
                        alt={location.imageAlt || location.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-8xl">
                        🏋️
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {highlightText(location.name, searchQuery)}
                      </h3>
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="ml-1 font-semibold text-gray-700">
                          {location.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {highlightText(location.address, searchQuery)}
                    </p>
                    <p className="text-gray-600 mb-4 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {location.hours}
                    </p>
                    {location.features.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {location.features.map((feature, index) => (
                            <span
                              key={index}
                              className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
                            >
                              {highlightText(feature, searchQuery)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Link
                      href={`/locations/${location.slug}`}
                      className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition font-medium text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchQuery
                  ? `No locations found matching "${searchQuery}"`
                  : "No locations found."}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

