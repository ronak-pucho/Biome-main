import { motion } from 'framer-motion';
import { TrendingUp, Gift, Zap, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

export default function DashboardPage() {
  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Savings',
      value: '₹24,580',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Gift,
      label: 'Cashback Earned',
      value: '₹3,240',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      label: 'Deals Used',
      value: '47',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: History,
      label: 'Orders',
      value: '32',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const recentPurchases = [
    {
      id: '1',
      item: 'Gaming Laptop',
      date: 'May 5, 2026',
      amount: 64999,
      savings: 5200,
      cashback: 650,
      platform: 'Flipkart',
    },
    {
      id: '2',
      item: 'Biryani Delivery',
      date: 'May 4, 2026',
      amount: 299,
      savings: 150,
      cashback: 15,
      platform: 'Swiggy',
    },
    {
      id: '3',
      item: 'Airport Ride',
      date: 'May 3, 2026',
      amount: 320,
      savings: 120,
      cashback: 16,
      platform: 'Uber',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white">
      <Header />

      <div className="container py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-muted-foreground">
            Here's your savings summary and recent activity
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-2xl bg-gradient-to-br ${stat.color} p-6 text-white shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Purchases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl border border-amber-100 p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Purchases</h2>
              <div className="space-y-4">
                {recentPurchases.map((purchase, idx) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="border border-amber-100 rounded-lg p-4 hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {purchase.item}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {purchase.date} • {purchase.platform}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        ₹{purchase.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex-1 bg-green-50 rounded p-2">
                        <p className="text-muted-foreground">You Saved</p>
                        <p className="font-semibold text-green-600">
                          ₹{purchase.savings}
                        </p>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded p-2">
                        <p className="text-muted-foreground">Cashback</p>
                        <p className="font-semibold text-blue-600">
                          ₹{purchase.cashback}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-6">
                View All Purchases
              </Button>
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rewards Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
            >
              <h3 className="font-bold text-lg mb-2">Available Rewards</h3>
              <p className="text-3xl font-bold mb-4">₹3,240</p>
              <Button className="w-full bg-white text-orange-600 hover:bg-gray-100 font-semibold">
                Redeem Now
              </Button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-amber-100 p-6"
            >
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  🔔 Price Alerts
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ❤️ Saved Deals
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  ⚙️ Preferences
                </Button>
              </div>
            </motion.div>

            {/* Tier Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-amber-100 p-6"
            >
              <h3 className="font-bold text-lg mb-4">Member Tier</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Gold</span>
                  <span className="text-sm text-muted-foreground">Level 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full w-3/4" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                ₹500 more to reach Platinum tier
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
