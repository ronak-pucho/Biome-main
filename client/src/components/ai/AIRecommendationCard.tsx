import { motion } from 'framer-motion';
import { Sparkles, TrendingDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIRecommendationCardProps {
  title: string;
  description: string;
  savings: number;
  confidence: number;
  platform: string;
  icon?: string;
  onViewDetails?: () => void;
  delay?: number;
}

export default function AIRecommendationCard({
  title,
  description,
  savings,
  confidence,
  platform,
  icon = '⭐',
  onViewDetails,
  delay = 0,
}: AIRecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="ai-card group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{platform}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
        </motion.div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-muted-foreground">You Save</span>
          </div>
          <p className="text-lg font-bold text-orange-600">₹{savings.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">AI Confidence</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{(confidence * 100).toFixed(0)}%</p>
        </div>
      </div>

      <Button
        onClick={onViewDetails}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-200"
      >
        View Details
      </Button>
    </motion.div>
  );
}
