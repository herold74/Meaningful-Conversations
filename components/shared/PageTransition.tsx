import React from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

interface PageTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0 },
};

const pageTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

const PageTransition: React.FC<PageTransitionProps> = ({ viewKey, children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={viewKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default PageTransition;
