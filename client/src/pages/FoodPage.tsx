import { motion } from 'framer-motion';
import { Clock, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';

export default function FoodPage() {
  const mockRestaurants = [
    {
      id: '1',
      name: 'Biryani House',
      cuisine: 'Hyderabadi',
      rating: 4.7,
      reviews: 1523,
      deliveryTime: 25,
      deliveryFee: 0,
      image: '🍛',
      offer: '30% off',
    },
    {
      id: '2',
      name: 'Pizza Palace',
      cuisine: 'Italian',
      rating: 4.5,
      reviews: 892,
      deliveryTime: 20,
      deliveryFee: 30,
      image: '🍕',
      offer: 'Free delivery',
    },
    {
      id: '3',
      name: 'Sushi Master',
      cuisine: 'Japanese',
      rating: 4.8,
      reviews: 634,
      deliveryTime: 35,
      deliveryFee: 50,
      image: '🍣',
      offer: '₹150 off',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-red-400 relative overflow-hidden">
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
              🍔 Order Food, Save More
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find the best restaurants and food deals from Swiggy, Zomato, and ONDC
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Search for food or restaurants..."
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
                title: 'Real-time Offers',
                description: 'Get the latest discounts and promos',
              },
              {
                icon: '🚚',
                title: 'Fast Delivery',
                description: 'Compare delivery times across platforms',
              },
              {
                icon: '⭐',
                title: 'Quality Reviews',
                description: 'Read summarized reviews from real customers',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-orange-50 border border-orange-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Popular Restaurants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRestaurants.map((restaurant, idx) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-orange-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 text-center relative">
                  <div className="text-6xl mb-4">{restaurant.image}</div>
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {restaurant.offer}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{restaurant.cuisine}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-orange-400 text-orange-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {restaurant.rating} ({restaurant.reviews})
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTime} min
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {restaurant.deliveryFee === 0 ? 'Free' : `₹${restaurant.deliveryFee}`}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                    Order Now
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
