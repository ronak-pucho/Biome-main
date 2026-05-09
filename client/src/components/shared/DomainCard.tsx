import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

interface DomainCardProps {
  icon: string;
  label: string;
  description: string;
  href: string;
  color: string;
  delay?: number;
}

export default function DomainCard({
  icon,
  label,
  description,
  href,
  color,
  delay = 0,
}: DomainCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link href={href}>
        <a className="block h-full">
          <div
            className={`relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${color} shadow-lg transition-all duration-300 group-hover:shadow-2xl h-full`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.3),transparent)]" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="text-5xl mb-4 group-group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{label}</h3>
              <p className="text-white/90 mb-6 text-sm">{description}</p>

              <div className="flex items-center gap-2 text-white font-semibold">
                <span>Explore</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </div>
            </div>

            {/* Hover Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/10 rounded-2xl"
            />
          </div>
        </a>
      </Link>
    </motion.div>
  );
}
