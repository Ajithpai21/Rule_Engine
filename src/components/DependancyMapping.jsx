import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

const DependancyMapping = ({
  setDependencyMapping,
  attribute,
  isLoading,
  isError,
  data,
  theme,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setDependencyMapping(null), 300);
  };

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-[70%] h-full flex items-center justify-center"
        onClick={handleClose}
      ></div>

      <div
        className={`w-[30%] h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        <div className="text-xl font-bold p-6">Dependency Mapping</div>
        <hr
          className={`border w-full mb-2 ${
            theme === "dark" ? "border-white" : "border-black"
          }`}
        />

        <div className="py-3 w-full h-screen px-6">
          <p className="text-sm mb-3">
            See where this global variable is used.
          </p>

          {isLoading && (
            <div className="flex items-center justify-center mt-6">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {isError && (
            <p className="text-red-500 text-center mt-4">
              Failed to load data.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold">{attribute.name}</h2>
              <div className="mt-2 space-y-2">
                {data?.data?.length > 0 ? (
                  data.data.map((row, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-black"
                      }`}
                    >
                      {row.name} ({row?.rule_type})
                    </div>
                  ))
                ) : (
                  <div className="h-[30%] flex items-center justify-center">
                    <div
                      className={`flex flex-col items-center justify-center rounded-2xl w-full py-10 px-5 ${
                        theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-black"
                      }`}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <Info
                          size={60}
                          strokeWidth={1.5}
                          className={
                            theme === "dark" ? "text-blue-400" : "text-blue-600"
                          }
                        />
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-sm font-medium mt-3 text-center"
                      >
                        Not being used anywhere
                      </motion.p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DependancyMapping;
