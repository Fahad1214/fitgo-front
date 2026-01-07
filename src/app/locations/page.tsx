import { getAllLocations } from "@/lib/locationdata";
import LocationSearch from "@/components/Locations/LocationSearch";

export default async function Gyms() {
  const locations = await getAllLocations();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Gym</h1>
          <p className="text-xl text-gray-300">Discover premium fitness facilities near you</p>
        </div>
      </section>

      {/* Search Bar and Results */}
      <LocationSearch locations={locations} />

      {/* Map Section Placeholder */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Find Us on the Map</h2>
          <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-lg">Interactive Map Coming Soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

