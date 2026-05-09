import { DomainType } from '@/types';

/* Domain Configuration */
export const DOMAINS: Record<DomainType, { label: string; icon: string; description: string; color: string }> = {
  ecommerce: {
    label: 'E-commerce',
    icon: '🛍️',
    description: 'Find the best deals on products',
    color: 'from-amber-400 to-orange-400',
  },
  food: {
    label: 'Food Delivery',
    icon: '🍔',
    description: 'Order food at the best price',
    color: 'from-orange-400 to-red-400',
  },
  rides: {
    label: 'Rides & Transport',
    icon: '🚗',
    description: 'Book affordable rides',
    color: 'from-yellow-400 to-amber-400',
  },
  travel: {
    label: 'Travel',
    icon: '✈️',
    description: 'Book flights, trains & buses',
    color: 'from-blue-400 to-cyan-400',
  },
  hospitality: {
    label: 'Hospitality',
    icon: '🏨',
    description: 'Find the best hotel deals',
    color: 'from-purple-400 to-pink-400',
  },
};

/* Platform Integrations */
export const ECOMMERCE_PLATFORMS = [
  { name: 'Amazon', logo: '🔵', color: '#FF9900' },
  { name: 'Flipkart', logo: '🟦', color: '#1F40FB' },
  { name: 'Myntra', logo: '🔴', color: '#FF6B35' },
  { name: 'Croma', logo: '🟦', color: '#0052CC' },
  { name: 'TataCliq', logo: '🟦', color: '#004687' },
];

export const FOOD_PLATFORMS = [
  { name: 'Swiggy', logo: '🟠', color: '#FF6B35' },
  { name: 'Zomato', logo: '🔴', color: '#EF4F5B' },
  { name: 'Domino\'s', logo: '🔴', color: '#C41E3A' },
  { name: 'ONDC', logo: '🟦', color: '#1F40FB' },
];

export const RIDE_PLATFORMS = [
  { name: 'Uber', logo: '⚫', color: '#000000' },
  { name: 'Ola', logo: '🟡', color: '#FFD700' },
  { name: 'Rapido', logo: '🔴', color: '#FF4444' },
  { name: 'ONDC', logo: '🟦', color: '#1F40FB' },
];

export const TRAVEL_PLATFORMS = [
  { name: 'MakeMyTrip', logo: '🟦', color: '#003580' },
  { name: 'IRCTC', logo: '🔴', color: '#C41E3A' },
  { name: 'Yatra', logo: '🔵', color: '#0052CC' },
  { name: 'Skyscanner', logo: '🟦', color: '#003580' },
];

export const HOSPITALITY_PLATFORMS = [
  { name: 'OYO', logo: '🟠', color: '#FF6B35' },
  { name: 'Booking.com', logo: '🟦', color: '#003580' },
  { name: 'Airbnb', logo: '🔴', color: '#FF5A5F' },
  { name: 'Trivago', logo: '🟦', color: '#005EB8' },
];

/* Navigation Items */
export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Search', href: '/search' },
  { label: 'Deals', href: '/deals' },
  { label: 'Dashboard', href: '/dashboard' },
];

/* Feature Highlights */
export const FEATURES = [
  {
    title: 'AI-Powered Search',
    description: 'Understand your intent and find exactly what you need across multiple platforms',
    icon: '🤖',
  },
  {
    title: 'Automatic Coupon Stacking',
    description: 'We apply the best coupons and offers automatically for maximum savings',
    icon: '🎟️',
  },
  {
    title: 'Price Drop Prediction',
    description: 'Get notified when prices drop and book at the perfect time',
    icon: '📉',
  },
  {
    title: 'Review Summarization',
    description: 'Quick insights from thousands of reviews to help you decide',
    icon: '⭐',
  },
  {
    title: 'One-Click Checkout',
    description: 'Seamless checkout with all offers pre-applied',
    icon: '✅',
  },
  {
    title: 'Cashback & Rewards',
    description: 'Earn cashback on every purchase and unlock exclusive rewards',
    icon: '💰',
  },
];

/* Testimonials */
export const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Student',
    image: '👩‍🎓',
    quote: 'Biome saved me ₹5,000 on my laptop purchase. The AI recommendations are spot-on!',
    rating: 5,
  },
  {
    name: 'Rajesh Kumar',
    role: 'Professional',
    image: '👨‍💼',
    quote: 'I use it for every purchase now. The price predictions actually work!',
    rating: 5,
  },
  {
    name: 'Anjali Patel',
    role: 'Frequent Traveler',
    image: '👩‍🚀',
    quote: 'Found the best flight deals across all platforms in seconds. Highly recommend!',
    rating: 5,
  },
];

/* Mock Savings Data */
export const MOCK_SAVINGS = [
  { month: 'Jan', savings: 2400 },
  { month: 'Feb', savings: 1398 },
  { month: 'Mar', savings: 9800 },
  { month: 'Apr', savings: 3908 },
  { month: 'May', savings: 4800 },
  { month: 'Jun', savings: 3800 },
];

/* Price Ranges */
export const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: 0, max: 1000 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹20,000', min: 5000, max: 20000 },
  { label: '₹20,000 - ₹50,000', min: 20000, max: 50000 },
  { label: 'Above ₹50,000', min: 50000, max: Infinity },
];

/* Delivery Preferences */
export const DELIVERY_PREFERENCES = [
  { value: 'fastest', label: 'Fastest Delivery', icon: '⚡' },
  { value: 'cheapest', label: 'Cheapest Option', icon: '💰' },
  { value: 'balanced', label: 'Balanced', icon: '⚖️' },
];
