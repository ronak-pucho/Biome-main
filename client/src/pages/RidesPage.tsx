import { motion } from 'framer-motion';
import { Clock, Users, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';

export default function RidesPage() {
  const mockRides = [
    {
      id: '1',
      type: 'Auto',
      fare: 280,
      eta: 6,
      driverRating: 4.9,
      platform: 'ONDC',
      image: '🚙',
      savings: 120,
    },
    {
      id: '2',
      type: 'Cab',
      fare: 320,
      eta: 4,
      driverRating: 4.8,
      platform: 'Uber',
      image: '🚗',
      savings: 80,
    },
    {
      id: '3',
      type: 'Bike',
      fare: 150,
      eta: 8,
      driverRating: 4.7,
      platform: 'Rapido',
      image: '🏍️',
      savings: 50,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-yellow-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-amber-400 relative overflow-hidden">
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
              🚗 Book Rides, Save Big
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Compare fares across Uber, Ola, Rapido, and ONDC in real-time
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Where do you want to go?"
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
                description: 'Compare fares from all platforms instantly',
              },
              {
                icon: '📉',
                title: 'Surge Prediction',
                description: 'Get notified about surge pricing patterns',
              },
              {
                icon: '⭐',
                title: 'Driver Ratings',
                description: 'Choose based on ratings and reviews',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-yellow-50 border border-yellow-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rides */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Available Rides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRides.map((ride, idx) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-yellow-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 text-center relative">
                  <div className="text-6xl mb-4">{ride.image}</div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Save ₹{ride.savings}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-4">{ride.type}</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        ETA
                      </span>
                      <span className="font-semibold">{ride.eta} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Rating
                      </span>
                      <span className="font-semibold">{ride.driverRating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platform</span>
                      <span className="font-semibold">{ride.platform}</span>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      ₹{ride.fare}
                    </p>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white">
                    Book Ride
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
