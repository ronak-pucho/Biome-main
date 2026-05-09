import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, SortAsc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import AISearchInput from '@/components/ai/AISearchInput';
import AIRecommendationCard from '@/components/ai/AIRecommendationCard';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const mockResults = [
    {
      id: '1',
      title: 'Gaming Laptop',
      description: 'RTX 4060 • 16GB RAM • 512GB SSD • FHD Display',
      savings: 5200,
      confidence: 0.95,
      platform: 'Flipkart',
      icon: '💻',
    },
    {
      id: '2',
      title: 'Wireless Earbuds',
      description: 'Active Noise Cancellation • 48hr Battery • Premium Sound',
      savings: 1800,
      confidence: 0.88,
      platform: 'Amazon',
      icon: '🎧',
    },
    {
      id: '3',
      title: 'Smart Watch',
      description: 'AMOLED Display • 7 Day Battery • Health Tracking',
      savings: 2500,
      confidence: 0.92,
      platform: 'Croma',
      icon: '⌚',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-amber-50/30 to-white">
      <Header />

      {/* Search Section */}
      <section className="py-12 bg-white border-b border-amber-100">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              Find Your Perfect Deal
            </h1>
            <AISearchInput
              onSearch={handleSearch}
              placeholder="Search for products, food, rides, flights, hotels..."
              showVoice={true}
              showSuggestions={true}
            />
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container">
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Search Results</h2>
                  <p className="text-muted-foreground">
                    Showing AI-optimized recommendations for "{searchQuery}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-sm'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white shadow-sm'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sort Button */}
                  <Button variant="outline" size="sm" className="gap-2">
                    <SortAsc className="w-4 h-4" />
                    Sort
                  </Button>

                  {/* Filter Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>
              </div>

              {/* Results Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}
              >
                {mockResults.map((result, idx) => (
                  <AIRecommendationCard
                    key={result.id}
                    title={result.title}
                    description={result.description}
                    savings={result.savings}
                    confidence={result.confidence}
                    platform={result.platform}
                    icon={result.icon}
                    delay={idx * 0.1}
                  />
                ))}
              </div>

              {/* Total Savings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-center"
              >
                <p className="text-muted-foreground mb-2">Total Savings Potential</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  ₹{mockResults.reduce((sum, r) => sum + r.savings, 0).toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-2">
                  across all recommendations
                </p>
              </motion.div>
            </motion.div>
          )}

          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold mb-2">Start Searching</h2>
              <p className="text-muted-foreground">
                Use the search bar above to find the best deals across all platforms
              </p>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
