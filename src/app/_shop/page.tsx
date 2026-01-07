import Link from 'next/link';

const products = [
  {
    id: 1,
    name: 'Premium Dumbbell Set',
    price: '$149.99',
    image: '🏋️',
    description: 'Professional grade adjustable dumbbells'
  },
  {
    id: 2,
    name: 'Resistance Bands Kit',
    price: '$39.99',
    image: '💪',
    description: 'Complete set of 5 resistance bands'
  },
  {
    id: 3,
    name: 'Yoga Mat Pro',
    price: '$49.99',
    image: '🧘',
    description: 'Non-slip premium yoga mat'
  },
  {
    id: 4,
    name: 'Protein Powder',
    price: '$59.99',
    image: '🥤',
    description: 'Whey protein isolate 5lbs'
  },
  {
    id: 5,
    name: 'Kettlebell Set',
    price: '$199.99',
    image: '⚖️',
    description: '3-piece cast iron kettlebell set'
  },
  {
    id: 6,
    name: 'Foam Roller',
    price: '$29.99',
    image: '🔄',
    description: 'High-density foam roller for recovery'
  },
  {
    id: 7,
    name: 'Jump Rope Pro',
    price: '$24.99',
    image: '🪢',
    description: 'Weighted speed jump rope'
  },
  {
    id: 8,
    name: 'Workout Gloves',
    price: '$19.99',
    image: '🧤',
    description: 'Premium leather workout gloves'
  }
];

export default function Shop() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Fitness Shop</h1>
          <p className="text-xl text-gray-300">Everything you need for your fitness journey</p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
              >
                <div className="bg-gray-100 h-48 flex items-center justify-center text-6xl">
                  {product.image}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-500">{product.price}</span>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition font-medium">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 hover:bg-orange-500 hover:text-white rounded-lg p-6 text-center transition cursor-pointer">
              <div className="text-4xl mb-2">🏋️</div>
              <div className="font-semibold">Weights</div>
            </div>
            <div className="bg-gray-100 hover:bg-orange-500 hover:text-white rounded-lg p-6 text-center transition cursor-pointer">
              <div className="text-4xl mb-2">🧘</div>
              <div className="font-semibold">Yoga</div>
            </div>
            <div className="bg-gray-100 hover:bg-orange-500 hover:text-white rounded-lg p-6 text-center transition cursor-pointer">
              <div className="text-4xl mb-2">🥤</div>
              <div className="font-semibold">Supplements</div>
            </div>
            <div className="bg-gray-100 hover:bg-orange-500 hover:text-white rounded-lg p-6 text-center transition cursor-pointer">
              <div className="text-4xl mb-2">👕</div>
              <div className="font-semibold">Apparel</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

