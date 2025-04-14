import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
const RulePolicyDropdown = ({ value, onChange, isReadOnly }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rulePolicies, setRulePolicies] = useState({});
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const dropdownRef = useRef(null);
  const theme = useSelector((state) => state.theme.mode);
  const [initialApiComplete, setInitialApiComplete] = useState(false);

  // Add debug logging to track value changes
  console.log("RulePolicyDropdown rendered with value:", value);

  // Fetch Rule Policies
  useEffect(() => {
    const fetchRulePolicies = async () => {
      setLoadingPolicies(true);
      try {
        const response = await fetch(
          "https://micro-solution-ruleengineprod.mfilterit.net/getRulesetPolicy",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ doc_id: "rule_policy_list" }),
          }
        );
        const result = await response.json();
        if (result && result.status === "Success" && result.data) {
          setRulePolicies(result.data);
          // If no value is provided initially, set default selection to the first policy key
          if (!value && Object.keys(result.data).length > 0) {
            const firstPolicyKey = Object.keys(result.data)[0];
            onChange(firstPolicyKey); // Update parent state
          }
        } else {
          console.error("Failed to fetch or parse rule policies:", result);
          setRulePolicies({});
        }
      } catch (error) {
        console.error("Error fetching rule policies:", error);
        setRulePolicies({});
      } finally {
        setLoadingPolicies(false);
        setInitialApiComplete(true);
      }
    };

    fetchRulePolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (key) => {
    onChange(key);
    setIsOpen(false);
  };

  const currentDescription = rulePolicies[value] || "Select a policy";

  return (
    <div className="relative inline-block text-left w-64" ref={dropdownRef}>
      {/* Button to toggle dropdown */}
      <button
        type="button"
        className={`inline-flex justify-between w-full rounded-md border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          theme === "dark"
            ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 focus:ring-blue-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 disabled:bg-gray-200"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingPolicies || isReadOnly}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {loadingPolicies ? "Loading..." : value || "Select Policy"}
        {/* Dropdown Icon */}
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg ring-1 ring-opacity-5 focus:outline-none z-10 max-h-60 overflow-y-auto ${
            theme === "dark"
              ? "bg-gray-800 ring-gray-700"
              : "bg-white ring-black"
          }`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {Object.entries(rulePolicies).map(([key, description]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  theme === "dark"
                    ? value === key
                      ? "bg-gray-700 text-white"
                      : "text-gray-200 hover:bg-gray-700 hover:text-white"
                    : value === key
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                role="menuitem"
              >
                <strong className="block font-medium">{key}</strong>
                <span
                  className={`block text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RulePolicyDropdown;
