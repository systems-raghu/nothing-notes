import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { NothingButton } from './NothingButton';

interface FocusableParagraphProps {
  children: React.ReactNode;
}

export const FocusableParagraph: React.FC<FocusableParagraphProps> = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isDisabled) return;
    timerRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150); // Small delay to prevent flashing
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setIsHovered(false);
  };

  const handleDisable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDisabled(true);
    setIsHovered(false);
  };

  return (
    <div 
      className="relative my-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base paragraph */}
      <p className="p-2 -mx-2 transition-opacity duration-300">
        {children}
      </p>

      {/* Hover Card Overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 5 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute -inset-x-4 -inset-y-6 z-40 bg-ntg-black/85 backdrop-blur-xl border border-ntg-gray/30 p-6 shadow-2xl overflow-hidden rounded-lg cursor-default"
          >
            {/* Minimalist Gradients for Glassmorphism effect */}
            <motion.div 
              animate={{ 
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.2, 1, 1.2, 1]
              }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-3/4 h-3/4 bg-ntg-gray/10 rounded-full mix-blend-screen filter blur-[60px] pointer-events-none"
            />
            
            <NothingButton
              variant="icon"
              onClick={handleDisable}
              className="absolute top-2 right-2 text-ntg-gray hover:text-ntg-white z-50 p-1"
              title="Disable hover effect for this paragraph"
            >
              <X size={16} />
            </NothingButton>

            <div className="relative font-serif text-xl sm:text-2xl text-ntg-light leading-relaxed z-10 pointer-events-auto select-text">
              {children}
            </div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-ntg-white/20 pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-ntg-white/20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-ntg-white/20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-ntg-white/20 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
