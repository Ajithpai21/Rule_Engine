import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Check,
  ChevronDown,
  Plus,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ViewSimpleRule from "@/pages/ViewSimpleRule";
import getUserDetails from "@/utils/getUserDetails";

// Dropdown Menu Component using Portal
const DropdownPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(children, document.body);
};

const RuleSetBuilder = ({
  currentRules = [],
  onChange,
  isReadOnly = false,
}) => {
  const userDetails = getUserDetails();
  const theme = useSelector((state) => state.theme.mode);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRules, setSelectedRules] = useState(currentRules || []);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null); // Track which row has the menu open
  const [viewSimpleRule, setViewSimpleRule] = useState(false);
  const [selectedRuleForView, setSelectedRuleForView] = useState(null);

  // Theme-based styles
  const textClass = theme === "dark" ? "text-white" : "text-gray-900";
  const bgClass = theme === "dark" ? "bg-gray-800" : "bg-white";
  const borderClass = theme === "dark" ? "border-gray-700" : "border-gray-200";
  const secondaryTextClass =
    theme === "dark" ? "text-gray-400" : "text-gray-600";
  const toggleEnabledClass = theme === "dark" ? "bg-blue-600" : "bg-blue-500";
  const toggleDisabledClass = theme === "dark" ? "bg-gray-700" : "bg-gray-300";
  const addRuleButtonClass =
    theme === "dark"
      ? "text-blue-400 hover:text-blue-300"
      : "text-blue-600 hover:text-blue-800";
  const dropdownBgClass = theme === "dark" ? "bg-gray-700" : "bg-white";
  const dropdownHoverClass =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-100";
  const menuBgClass = theme === "dark" ? "bg-gray-700" : "bg-white";

  // Add refs to track dropdown button positions
  const dropdownRefs = useRef([]);
  const menuRefs = useRef([]);

  // Update selectedRules when currentRules prop changes
  useEffect(() => {
    console.log("currentRules changed:", currentRules);
    if (currentRules && currentRules.length > 0) {
      setSelectedRules(currentRules);
    }
  }, [currentRules]);

  // Fetch all rules from API
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        setError(null);

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
          setRules(response.data.data);
        } else {
          setError("Could not fetch rule details");
        }
      } catch (err) {
        console.error("Error fetching rules:", err);
        toast.error("Failed to fetch rules. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  // Handle adding a new empty rule row
  const handleAddRule = () => {
    if (isReadOnly) return; // Don't add rules in read-only mode
    const newRule = { rule_id: "", enabled: true };
    const updatedRules = [...selectedRules, newRule];
    setSelectedRules(updatedRules);
    onChange(updatedRules);
  };

  // Handle adding a new row above a specific index
  const handleAddRowAbove = (index) => {
    if (isReadOnly) return; // Don't add rows in read-only mode
    const newSelectedRules = [...selectedRules];
    newSelectedRules.splice(index, 0, { rule_id: "", enabled: true });
    setSelectedRules(newSelectedRules);

    if (onChange) {
      onChange(newSelectedRules);
    }
    setOpenMenuIndex(null); // Close the menu
  };

  // Handle adding a new row below a specific index
  const handleAddRowBelow = (index) => {
    if (isReadOnly) return; // Don't add rows in read-only mode
    const newSelectedRules = [...selectedRules];
    newSelectedRules.splice(index + 1, 0, { rule_id: "", enabled: true });
    setSelectedRules(newSelectedRules);

    if (onChange) {
      onChange(newSelectedRules);
    }
    setOpenMenuIndex(null); // Close the menu
  };

  // Handle removing a rule
  const handleRemoveRule = (index) => {
    if (isReadOnly) return; // Don't remove rules in read-only mode
    const newSelectedRules = [...selectedRules];
    newSelectedRules.splice(index, 1);
    setSelectedRules(newSelectedRules);

    if (onChange) {
      onChange(newSelectedRules);
    }
  };

  // Handle toggling rule enabled status
  const handleToggleEnabled = (index) => {
    if (isReadOnly) return; // Don't toggle enabled in read-only mode
    const newSelectedRules = [...selectedRules];
    newSelectedRules[index] = {
      ...newSelectedRules[index],
      enabled: !newSelectedRules[index].enabled,
    };
    setSelectedRules(newSelectedRules);

    if (onChange) {
      onChange(newSelectedRules);
    }
  };

  // Toggle the options menu
  const toggleMenu = (index) => {
    if (openMenuIndex === index) {
      setOpenMenuIndex(null);
    } else {
      setOpenMenuIndex(index);
    }
  };

  // Handle clicking outside menus
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuIndex(null);
      setOpenDropdownIndex(null); // Also close any open dropdown
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Handle rule selection change
  const handleRuleChange = (index, rule_id) => {
    if (isReadOnly) return; // Don't change rules in read-only mode

    // Check if this rule_id already exists in another row
    const isDuplicate = selectedRules.some(
      (rule, idx) => idx !== index && rule.rule_id === rule_id && rule_id !== ""
    );

    if (isDuplicate) {
      // Show warning toast
      toast.warning(
        "Duplicate rules cannot be selected. Please choose another rule."
      );
      return; // Stop further processing
    }

    // Find the full rule info
    let ruleName = "Unknown Rule";
    const ruleDetails = rules.find((rule) => rule.rule_id === rule_id);
    if (ruleDetails) {
      ruleName = ruleDetails.name;
    }

    // Update the selected rules array
    const newSelectedRules = [...selectedRules];
    newSelectedRules[index] = {
      ...newSelectedRules[index],
      rule_id,
      ruleName, // Store name for display purposes
    };
    setSelectedRules(newSelectedRules);
    setOpenDropdownIndex(null);

    // Notify parent of change
    if (onChange) {
      onChange(newSelectedRules);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (index, e) => {
    if (isReadOnly) return; // Don't toggle dropdown in read-only mode
    e.stopPropagation();
    if (openDropdownIndex === index) {
      setOpenDropdownIndex(null);
    } else {
      setOpenDropdownIndex(index);
    }
  };

  // Find rule details by ID
  const getRuleDetails = (ruleId) => {
    return rules.find((rule) => rule.rule_id === ruleId) || null;
  };

  // Get display name for dropdown
  const getDropdownDisplay = (ruleId) => {
    if (!ruleId) return "Select Rule";
    const rule = getRuleDetails(ruleId);
    return rule ? rule.name : "Select Rule";
  };

  // Render dropdown for rule selection
  const renderDropdown = (index, selectedRule) => {
    if (openDropdownIndex !== index) return null;
    if (isReadOnly) return null; // Don't show dropdown in read-only mode

    const dropdownButton = dropdownRefs.current[index];
    if (!dropdownButton) return null;

    const rect = dropdownButton.getBoundingClientRect();
    const style = {
      position: "fixed",
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
      maxHeight: "240px",
      overflowY: "auto",
      zIndex: 9999,
    };

    return (
      <DropdownPortal isOpen={openDropdownIndex === index}>
        <div
          className={`border ${borderClass} rounded-md shadow-lg ${dropdownBgClass}`}
          style={style}
        >
          {rules.map((rule) => (
            <div
              key={rule.rule_id}
              onClick={() => handleRuleChange(index, rule.rule_id)}
              className={`px-3 py-2 cursor-pointer ${dropdownHoverClass} ${
                selectedRule.rule_id === rule.rule_id
                  ? theme === "dark"
                    ? "bg-gray-600"
                    : "bg-gray-100"
                  : ""
              }`}
            >
              <div className={textClass}>{rule.name}</div>
            </div>
          ))}
        </div>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenDropdownIndex(null)}
          style={{ background: "transparent" }}
        />
      </DropdownPortal>
    );
  };

  // Render row action menu
  const renderMenu = (index) => {
    if (openMenuIndex !== index) return null;
    if (isReadOnly) return null; // Don't show menu in read-only mode

    const menuButton = menuRefs.current[index];
    if (!menuButton) return null;

    const rect = menuButton.getBoundingClientRect();
    const style = {
      position: "fixed",
      top: `${rect.bottom + window.scrollY}px`,
      right: `${window.innerWidth - rect.right - window.scrollX}px`,
      width: "144px", // 36 rem
      zIndex: 9999,
    };

    return (
      <DropdownPortal isOpen={openMenuIndex === index}>
        <div
          className={`py-1 border ${borderClass} rounded-md shadow-lg ${menuBgClass}`}
          style={style}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleAddRowAbove(index)}
            className={`w-full text-left px-4 py-2 text-sm ${textClass} ${dropdownHoverClass}`}
          >
            Add row above
          </button>
          <button
            onClick={() => handleAddRowBelow(index)}
            className={`w-full text-left px-4 py-2 text-sm ${textClass} ${dropdownHoverClass}`}
          >
            Add row below
          </button>
        </div>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenuIndex(null)}
          style={{ background: "transparent" }}
        />
      </DropdownPortal>
    );
  };

  // Ensure refs arrays match the length of rules
  useEffect(() => {
    dropdownRefs.current = dropdownRefs.current.slice(0, selectedRules.length);
    menuRefs.current = menuRefs.current.slice(0, selectedRules.length);
  }, [selectedRules.length]);

  // Handle view rule click
  const handleViewRule = (rule_id) => {
    // Find the complete rule info
    const ruleToView = rules.find((rule) => rule.rule_id === rule_id);

    if (ruleToView) {
      // Save the current rule set session storage data
      const originalRuleType = sessionStorage.getItem("rule_type");
      const originalTypeId = sessionStorage.getItem("type_id");
      const originalName = sessionStorage.getItem("name");
      const originalDesc = sessionStorage.getItem("description");

      // Store backup of rule set data
      sessionStorage.setItem("rs_original_rule_type", originalRuleType);
      sessionStorage.setItem("rs_original_type_id", originalTypeId);
      sessionStorage.setItem("rs_original_name", originalName);
      sessionStorage.setItem("rs_original_desc", originalDesc);

      // Set simple rule data for viewing
      sessionStorage.setItem("name", ruleToView.name || "");
      sessionStorage.setItem("description", ruleToView.description || "");
      sessionStorage.setItem("type_id", rule_id);
      sessionStorage.setItem("rule_type", "Simple Rule");

      // Show the view component
      setViewSimpleRule(true);
    } else {
      toast.error("Rule details not found");
    }
  };

  // Handle closing the view and restoring original session storage
  const handleCloseView = () => {
    // Restore original rule set data
    const originalRuleType = sessionStorage.getItem("rs_original_rule_type");
    const originalTypeId = sessionStorage.getItem("rs_original_type_id");
    const originalName = sessionStorage.getItem("rs_original_name");
    const originalDesc = sessionStorage.getItem("rs_original_desc");

    // Restore the session storage
    sessionStorage.setItem("rule_type", originalRuleType || "");
    sessionStorage.setItem("type_id", originalTypeId || "");
    sessionStorage.setItem("name", originalName || "");
    sessionStorage.setItem("description", originalDesc || "");

    // Clean up backup
    sessionStorage.removeItem("rs_original_rule_type");
    sessionStorage.removeItem("rs_original_type_id");
    sessionStorage.removeItem("rs_original_name");
    sessionStorage.removeItem("rs_original_desc");

    setViewSimpleRule(false);
  };

  return (
    <div className="space-y-4">
      {viewSimpleRule && <ViewSimpleRule setOnClose={handleCloseView} />}
      <div
        className={`rule-set-builder border rounded-md ${bgClass} border-${borderClass} ${
          isReadOnly ? "opacity-75" : ""
        }`}
      >
        {/* Table Headers */}
        <div
          className={`flex px-4 py-2 border-b ${borderClass} text-xs uppercase font-medium ${secondaryTextClass}`}
        >
          <div className="w-2/5">Rules</div>
          <div className="w-1/5 text-center">View</div>
          <div className="w-1/5 text-center">Status</div>
          <div className="w-1/5 text-right">Actions</div>
        </div>

        {/* Rules List */}
        <div className="rule-list max-h-80 overflow-y-auto">
          {loading && (
            <div className={`px-4 py-6 text-center ${secondaryTextClass}`}>
              Loading rules...
            </div>
          )}

          {error && !loading && (
            <div className="px-4 py-6 text-center text-red-500">{error}</div>
          )}

          {!loading && !error && selectedRules.length === 0 && (
            <div className={`px-4 py-6 text-center ${secondaryTextClass}`}>
              No rules added. Click the "+ Add Rule" button below to add rules.
            </div>
          )}

          {!loading &&
            !error &&
            selectedRules.map((selectedRule, index) => (
              <div
                key={index}
                className={`flex items-center px-4 py-3 border-b last:border-b-0 ${borderClass}`}
              >
                {/* Rule Dropdown */}
                <div className="w-2/5 pr-4">
                  <div
                    ref={(el) => (dropdownRefs.current[index] = el)}
                    onClick={(e) => toggleDropdown(index, e)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border ${borderClass} cursor-pointer ${bgClass}`}
                  >
                    <span className={textClass}>
                      {getDropdownDisplay(selectedRule.rule_id)}
                    </span>
                    <ChevronDown size={16} className={secondaryTextClass} />
                  </div>

                  {renderDropdown(index, selectedRule)}
                </div>

                {/* View Rule Button */}
                <div className="w-1/5 flex justify-center">
                  <button
                    onClick={() =>
                      selectedRule.rule_id
                        ? handleViewRule(selectedRule.rule_id)
                        : null
                    }
                    disabled={!selectedRule.rule_id}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                      selectedRule.rule_id
                        ? theme === "dark"
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-800"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                    title={
                      selectedRule.rule_id ? "View Rule" : "Select a rule first"
                    }
                  >
                    <Eye size={16} />
                    <span>View Rule</span>
                  </button>
                </div>

                {/* Status Toggle */}
                <div className="w-1/5 flex justify-center">
                  <button
                    onClick={() => handleToggleEnabled(index)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                      selectedRule.enabled
                        ? toggleEnabledClass
                        : toggleDisabledClass
                    }`}
                    disabled={!selectedRule.rule_id}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        selectedRule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Actions Button */}
                <div className="w-1/5 flex justify-end space-x-1 items-center">
                  {/* 3-Dot Menu */}
                  <div>
                    <button
                      ref={(el) => (menuRefs.current[index] = el)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(index);
                      }}
                      className={`p-1 rounded-full ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      }`}
                      title="More Options"
                    >
                      <MoreVertical size={16} className={secondaryTextClass} />
                    </button>

                    {renderMenu(index)}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveRule(index)}
                    className={`p-1 rounded-full ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    }`}
                    title="Remove Rule"
                  >
                    <Trash2
                      size={16}
                      className={
                        theme === "dark" ? "text-red-400" : "text-red-500"
                      }
                    />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Add Rule Button */}
        <div className="px-4 py-3 border-t border-dashed border-gray-300 dark:border-gray-700">
          <button
            onClick={handleAddRule}
            disabled={isReadOnly}
            className={`flex items-center font-medium text-sm ${
              isReadOnly
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : addRuleButtonClass
            }`}
          >
            <Plus size={16} className="mr-1" />
            Add Rule
          </button>
        </div>
      </div>

      {/* JSON Debugger */}
      {/* <div className="mt-4">
        <button
          onClick={() => setShowDebugger(!showDebugger)}
          className={`text-sm ${addRuleButtonClass} mb-2 flex items-center`}
        >
          {showDebugger ? "Hide" : "Show"} JSON Debugger
        </button>
        
        {showDebugger && (
          <pre
            className={`p-4 rounded-md border ${borderClass} ${bgClass} ${textClass} overflow-auto max-h-80`}
          >
            {JSON.stringify(
              {
                "rules enabled": selectedRules,
              },
              null,
              2
            )}
          </pre>
        )}
      </div> */}
    </div>
  );
};

export default RuleSetBuilder;
