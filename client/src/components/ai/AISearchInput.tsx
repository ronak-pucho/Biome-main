import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Mic, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AISearchInputProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  showVoice?: boolean;
  showSuggestions?: boolean;
}

const SUGGESTIONS = [
  'Laptop under ₹70,000 with RTX graphics',
  'Biryani delivery under ₹300',
  'Cab to airport at lowest price',
  'Flight to Delhi next week',
  'Hotel in Goa with beach view',
];

export default function AISearchInput({
  onSearch,
  placeholder = 'What are you looking for?',
  showVoice = true,
  showSuggestions = true,
}: AISearchInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query);
      setQuery('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch?.(suggestion);
    setShowSuggestionsList(false);
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Main Search Input */}
        <div
          className={`relative rounded-2xl transition-all duration-300 ${
            isFocused
              ? 'ring-2 ring-amber-500 shadow-lg'
              : 'shadow-md hover:shadow-lg'
          }`}
        >
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl">
            {/* AI Icon */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
            </motion.div>

            {/* Input Field */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestionsList(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-lg font-medium"
            />

            {/* Voice Button */}
            {showVoice && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                title="Voice search"
              >
                <Mic className="w-5 h-5 text-muted-foreground hover:text-amber-500" />
              </motion.button>
            )}

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 font-semibold rounded-lg"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && showSuggestionsList && !query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden z-50"
            >
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  Try searching for
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-amber-50 transition-colors text-sm text-foreground flex items-center gap-2 group"
                    >
                      <Search className="w-4 h-4 text-muted-foreground group-hover:text-amber-500" />
                      <span>{suggestion}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          🤖 Powered by AI • Search across all platforms • Get instant recommendations
        </p>
      </motion.div>
    </div>
  );
}
