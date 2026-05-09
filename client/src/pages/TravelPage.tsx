import { motion } from 'framer-motion';
import { Plane, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';

export default function TravelPage() {
  const mockFlights = [
    {
      id: '1',
      airline: 'IndiGo',
      from: 'BLR',
      to: 'DEL',
      departure: '10:30 AM',
      arrival: '01:15 PM',
      duration: '2h 45m',
      price: 4299,
      originalPrice: 6999,
      stops: 0,
      image: '✈️',
    },
    {
      id: '2',
      airline: 'Air India',
      from: 'BLR',
      to: 'DEL',
      departure: '02:00 PM',
      arrival: '05:30 PM',
      duration: '2h 30m',
      price: 5499,
      originalPrice: 7999,
      stops: 0,
      image: '✈️',
    },
    {
      id: '3',
      airline: 'SpiceJet',
      from: 'BLR',
      to: 'DEL',
      departure: '06:15 PM',
      arrival: '09:45 PM',
      duration: '2h 30m',
      price: 3799,
      originalPrice: 5999,
      stops: 1,
      image: '✈️',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-blue-400 to-cyan-400 relative overflow-hidden">
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
              ✈️ Travel Smart, Save More
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find the best flight, train, and bus deals across all platforms
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Where are you traveling?"
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
                title: 'Multi-Modal Search',
                description: 'Compare flights, trains, and buses together',
              },
              {
                icon: '📅',
                title: 'Fare Alerts',
                description: 'Get notified about price drops and best deals',
              },
              {
                icon: '🎟️',
                title: 'Coupon Integration',
                description: 'Apply bank offers and loyalty discounts',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flights */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Available Flights</h2>
          <div className="space-y-4">
            {mockFlights.map((flight, idx) => (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-blue-100 p-6 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Flight Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl">{flight.image}</div>
                      <div>
                        <p className="font-bold text-lg">{flight.airline}</p>
                        <p className="text-sm text-muted-foreground">
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-2xl font-bold">{flight.departure}</p>
                        <p className="text-sm text-muted-foreground">{flight.from}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-muted-foreground mb-1">{flight.duration}</p>
                        <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{flight.arrival}</p>
                        <p className="text-sm text-muted-foreground">{flight.to}</p>
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{flight.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-through mb-4">
                      ₹{flight.originalPrice.toLocaleString()}
                    </p>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                      Book Flight
                    </Button>
                  </div>
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
