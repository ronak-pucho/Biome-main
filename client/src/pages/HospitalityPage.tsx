import { motion } from 'framer-motion';
import { MapPin, Star, Wifi, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';

export default function HospitalityPage() {
  const mockHotels = [
    {
      id: '1',
      name: 'Beachfront Resort',
      location: 'Goa',
      price: 2499,
      originalPrice: 4999,
      rating: 4.7,
      reviews: 1203,
      image: '🏨',
      amenities: ['WiFi', 'Pool', 'Breakfast'],
    },
    {
      id: '2',
      name: 'Mountain Retreat',
      location: 'Himachal Pradesh',
      price: 1999,
      originalPrice: 3499,
      rating: 4.8,
      reviews: 892,
      image: '🏔️',
      amenities: ['WiFi', 'Parking', 'Restaurant'],
    },
    {
      id: '3',
      name: 'City Center Hotel',
      location: 'Mumbai',
      price: 3499,
      originalPrice: 5999,
      rating: 4.5,
      reviews: 2341,
      image: '🏙️',
      amenities: ['WiFi', 'Gym', 'Spa'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-purple-400 to-pink-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.3),transparent)]" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🏨 Find Perfect Stays, Save Big
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Compare hotel deals across OYO, Booking.com, Airbnb, and more
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Where do you want to stay?"
                onSearch={(q) => console.log('Search:', q)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Instant Comparison',
                description: 'Compare prices across all hotel platforms',
              },
              {
                icon: '⭐',
                title: 'Guest Reviews',
                description: 'Read summarized reviews from real guests',
              },
              {
                icon: '🎟️',
                title: 'Best Deals',
                description: 'Get the lowest prices with automatic coupons',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-purple-50 border border-purple-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hotels */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Featured Hotels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockHotels.map((hotel, idx) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-purple-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center">
                  <div className="text-6xl mb-4">{hotel.image}</div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-1">{hotel.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4" />
                    {hotel.location}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-purple-400 text-purple-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {hotel.rating} ({hotel.reviews})
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{hotel.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-through">
                      ₹{hotel.originalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.map((amenity, i) => (
                      <span
                        key={i}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Book Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
