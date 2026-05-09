import { motion } from 'framer-motion';
import { Star, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';

export default function EcommercePage() {
  const mockProducts = [
    {
      id: '1',
      name: 'Gaming Laptop',
      price: 64999,
      originalPrice: 89999,
      rating: 4.8,
      reviews: 2341,
      platform: 'Flipkart',
      image: '💻',
      discount: 28,
    },
    {
      id: '2',
      name: 'Wireless Earbuds',
      price: 2999,
      originalPrice: 4999,
      rating: 4.6,
      reviews: 1203,
      platform: 'Amazon',
      image: '🎧',
      discount: 40,
    },
    {
      id: '3',
      name: 'Smart Watch',
      price: 9999,
      originalPrice: 14999,
      rating: 4.5,
      reviews: 892,
      platform: 'Croma',
      image: '⌚',
      discount: 33,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-amber-500 to-orange-500 relative overflow-hidden">
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
              🛍️ Shop Smart, Save More
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find the best products at the lowest prices across Amazon, Flipkart, Myntra, and more
            </p>
            <div className="max-w-xl">
              <AISearchInput
                placeholder="Search for products..."
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
                description: 'Compare prices across all platforms in seconds',
              },
              {
                icon: '🎟️',
                title: 'Auto Coupon Apply',
                description: 'We apply the best coupons automatically',
              },
              {
                icon: '📉',
                title: 'Price Tracking',
                description: 'Get notified when prices drop',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-amber-50 border border-amber-100 text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8">Trending Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border border-amber-100 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center relative">
                  <div className="text-6xl mb-4">{product.image}</div>
                  {product.discount > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{product.discount}%
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{product.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    Available on {product.platform}
                  </p>

                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Deal
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
