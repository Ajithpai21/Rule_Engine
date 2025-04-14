import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hammer } from "lucide-react";
import { useSelector } from "react-redux";

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useSelector((state) => state.theme.mode);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[88.8vh] px-6 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Glassmorphic Card */}
      <div
        className="relative p-8 rounded-xl bg-opacity-20 backdrop-blur-lg shadow-xl border border-opacity-30 max-w-md text-center transition-all duration-500"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(240, 240, 240, 0.5))",
          borderColor:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.1)",
          boxShadow:
            theme === "dark"
              ? "0px 10px 30px rgba(0, 255, 255, 0.1)"
              : "0px 10px 30px rgba(0, 0, 255, 0.05)",
        }}
      >
        {/* Floating Icon */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: [0, -5, 0], opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="mb-4 flex justify-center"
        >
          <Hammer
            size={80}
            className={`drop-shadow-lg ${
              theme === "dark"
                ? "text-blue-400"
                : "text-blue-500 border-2 border-blue-300 p-2 rounded-full shadow-md"
            }`}
          />
        </motion.div>

        {/* Under Development Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className={`text-lg md:text-xl font-semibold ${
            theme === "dark" ? "text-gray-300" : "text-gray-800"
          }`}
        >
          🚧 This page is under development. Stay tuned! 🚀
        </motion.p>

        {/* Animated Button */}
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`mt-6 px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer ${
            theme === "dark"
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              : "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
          }`}
        >
          Go Home
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
