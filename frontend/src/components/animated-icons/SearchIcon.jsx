import { motion } from "motion/react";
import { Search } from "lucide-react";

const SearchIcon = ({ size = 20, className = "" }) => {
  return (
    <motion.div
      className={className}
      animate={{
        rotate: [0, 20, -20, 0],
        scale: [1, 1.08, 1.08, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Search size={size} />
    </motion.div>
  );
};

export default SearchIcon;