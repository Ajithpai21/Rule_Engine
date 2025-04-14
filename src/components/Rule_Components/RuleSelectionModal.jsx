import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { X, Search, Loader2 } from "lucide-react";
import getUserDetails from "@/utils/getUserDetails";

const RuleSelectionModal = ({
  isOpen,
  onClose,
  onAddRules,
  existingRuleIds = [],
}) => {
  const userDetails = getUserDetails();
  const theme = useSelector((state) => state.theme.mode);
  const [availableRules, setAvailableRules] = useState([]);
  const [modalSelectedRules, setModalSelectedRules] = useState([]); // Rule objects selected in the modal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Theme styles
  const modalBgClass = theme === "dark" ? "bg-gray-800" : "bg-white";
  const textClass = theme === "dark" ? "text-gray-200" : "text-gray-900";
  const secondaryTextClass =
    theme === "dark" ? "text-gray-400" : "text-gray-500";
  const inputClass =
    theme === "dark"
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500";
  const itemHoverClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100";
  const buttonPrimaryClass =
    theme === "dark"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-blue-500 hover:bg-blue-600 text-white";
  const buttonSecondaryClass =
    theme === "dark"
      ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
      : "bg-gray-200 hover:bg-gray-300 text-gray-700";
  const checkboxClass =
    theme === "dark" ? "accent-blue-500" : "accent-blue-600";

  // Border styles
  const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";

  // Fetch rules when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchRules = async () => {
        setLoading(true);
        setError(null);
        setAvailableRules([]); // Clear previous results
        setModalSelectedRules([]); // Reset modal selection
        try {
          const user = userDetails;
          const workspace = sessionStorage.getItem("workspace");
          const workspace_id = sessionStorage.getItem("workspace_id");
          const api_key = sessionStorage.getItem("api_key");

          if (!user || !workspace || !workspace_id || !api_key) {
            throw new Error("Missing user credentials in session storage.");
          }

          const payload = { user, workspace, workspace_id, api_key };
          const response = await axios.post(
            "https://micro-solution-ruleengineprod.mfilterit.net/filterRules_RuleSet",
            payload
          );

          if (response.data && response.data.data) {
            // Filter out rules that are already in the parent component's list
            const rulesNotInSet = response.data.data.filter(
              (rule) => !existingRuleIds.includes(rule.rule_id)
            );
            setAvailableRules(rulesNotInSet);
          } else {
            setError("No rules found or invalid response format.");
          }
        } catch (err) {
          console.error("Error fetching rules:", err);
          setError(err.message || "Failed to fetch rules. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      fetchRules();
    }
  }, [isOpen, existingRuleIds]); // Re-fetch if modal opens or existing rules change

  // Filter rules based on search query
  const filteredRules = availableRules.filter((rule) =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle checkbox change
  const handleSelectRule = (rule, isChecked) => {
    if (isChecked) {
      setModalSelectedRules([...modalSelectedRules, rule]);
    } else {
      setModalSelectedRules(
        modalSelectedRules.filter((r) => r.rule_id !== rule.rule_id)
      );
    }
  };

  // Handle submitting selected rules
  const handleSubmit = () => {
    onAddRules(modalSelectedRules); // Pass the array of selected rule objects
    onClose(); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl rounded-lg shadow-xl ${modalBgClass}`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${borderClass}`}
        >
          <h3 className={`text-lg font-semibold ${textClass}`}>
            Select Rules to Add
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${itemHoverClass}`}
          >
            <X size={20} className={secondaryTextClass} />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-4 border-b ${borderClass}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className={secondaryTextClass} />
            </div>
            <input
              type="text"
              placeholder="Search rules by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full p-2 pl-10 text-sm rounded-md border ${inputClass}`}
            />
          </div>
        </div>

        {/* Rules List */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2
                size={24}
                className={`animate-spin ${secondaryTextClass}`}
              />
              <span className={`ml-2 ${secondaryTextClass}`}>
                Loading rules...
              </span>
            </div>
          ) : error ? (
            <div className={`text-center py-10 text-red-500`}>{error}</div>
          ) : filteredRules.length > 0 ? (
            filteredRules.map((rule) => (
              <div
                key={rule.rule_id}
                className={`flex items-center justify-between p-3 rounded-md ${itemHoverClass}`}
              >
                <div className="flex items-center flex-grow mr-4">
                  <input
                    type="checkbox"
                    id={`rule-${rule.rule_id}`}
                    checked={modalSelectedRules.some(
                      (r) => r.rule_id === rule.rule_id
                    )}
                    onChange={(e) => handleSelectRule(rule, e.target.checked)}
                    className={`mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${checkboxClass}`}
                  />
                  <label
                    htmlFor={`rule-${rule.rule_id}`}
                    className="cursor-pointer"
                  >
                    <div className={`font-medium ${textClass}`}>
                      {rule.name}
                    </div>
                    <div className={`text-xs ${secondaryTextClass}`}>
                      {rule.type} • Created by {rule.created_by}
                    </div>
                  </label>
                </div>
                {/* Optionally add more info or actions here */}
              </div>
            ))
          ) : (
            <div className={`text-center py-10 ${secondaryTextClass}`}>
              No available rules found
              {searchQuery ? " matching your search" : ""}.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-end p-4 border-t ${borderClass} space-x-3`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-md ${buttonSecondaryClass}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={modalSelectedRules.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md ${buttonPrimaryClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Add {modalSelectedRules.length > 0 ? modalSelectedRules.length : ""}{" "}
            Selected Rule{modalSelectedRules.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleSelectionModal;
