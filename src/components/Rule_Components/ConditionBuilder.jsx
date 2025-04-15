import React, { useState, useEffect } from "react";
import {
  PlusCircle as AddIcon,
  Trash2 as DeleteIcon,
  Layers as GroupIcon,
} from "lucide-react";
import CustomPropertySelect from "./CustomPropertySelect";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

// Theme configurations
const THEMES = {
  light: {
    background: "bg-white",
    groupBackground: "bg-gray-50",
    text: "text-gray-800",
    border: "border-gray-300",
    buttonColors: {
      condition: "text-green-500 hover:text-green-700",
      group: "text-blue-500 hover:text-blue-700",
      remove: "text-red-500 hover:text-red-700",
    },
    inputStyles: "p-2 border rounded bg-white text-gray-800",
    // Group styles per depth level - add right borders to match left borders
    groupStyles: [
      "border-l-4 border-r-4 border-blue-400",
      "border-l-4 border-r-4 border-purple-400",
      "border-l-4 border-r-4 border-green-400",
      "border-l-4 border-r-4 border-amber-400",
      "border-l-4 border-r-4 border-pink-400",
    ],
  },
  dark: {
    background: "bg-gray-900",
    groupBackground: "bg-gray-800",
    text: "text-gray-100",
    border: "border-gray-600",
    buttonColors: {
      condition: "text-green-400 hover:text-green-300",
      group: "text-blue-400 hover:text-blue-300",
      remove: "text-red-400 hover:text-red-300",
    },
    inputStyles:
      "p-2 border rounded bg-gray-700 text-white border-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
    // Group styles per depth level - add right borders to match left borders
    groupStyles: [
      "border-l-4 border-r-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      "border-l-4 border-r-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
      "border-l-4 border-r-4 border-cyan-500 shadow-[0_0_15px_rgba(14,165,233,0.2)]",
      "border-l-4 border-r-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      "border-l-4 border-r-4 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    ],
  },
  colorful: {
    background: "bg-gradient-to-br from-purple-50 to-blue-50",
    groupBackground: "bg-white/70",
    text: "text-purple-900",
    border: "border-purple-200",
    buttonColors: {
      condition: "text-emerald-600 hover:text-emerald-800",
      group: "text-indigo-600 hover:text-indigo-800",
      remove: "text-rose-600 hover:text-rose-800",
    },
    inputStyles:
      "p-2 border rounded bg-white text-purple-900 border-purple-300",
    // Group styles per depth level - add right borders to match left borders
    groupStyles: [
      "border-l-4 border-r-4 border-indigo-400",
      "border-l-4 border-r-4 border-emerald-400",
      "border-l-4 border-r-4 border-amber-400",
      "border-l-4 border-r-4 border-rose-400",
      "border-l-4 border-r-4 border-sky-400",
    ],
  },
};

// Default condition and group structures
const DEFAULT_CONDITION = {
  property: "",
  operator: "",
  value: "",
  data_type: "",
  source_type: "",
};

const DEFAULT_GROUP = {
  type: "group",
  operator: "all",
  rules: [{ ...DEFAULT_CONDITION }],
};

// Define data type to input type mapping
const DATA_TYPE_TO_INPUT_TYPE = {
  String: "text",
  Numeric: "number",
  Boolean: "boolean",
  DateTime: "datetime-local",
  Date: "date",
};

// Define default operators based on data type
const DEFAULT_OPERATORS_BY_TYPE = {
  String: ["=", "!=", "contains", "not_contains", "in", "not in"],
  Numeric: ["=", "!=", ">", "<", ">=", "<=", "between", "in", "not in"],
  Boolean: ["="],
  DateTime: ["=", "!=", "between"],
  Date: ["=", "!=", "between"],
};

// Real API for properties
const fetchProperties = async () => {
  try {
    const payload = {
      user: user,
      workspace: sessionStorage.getItem("workspace"),
      workspace_id: sessionStorage.getItem("workspace_id"),
      rule_type: sessionStorage.getItem("rule_type"),
      rule_id: sessionStorage.getItem("type_id"),
    };

    const response = await fetch(
      "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();

    if (data.status !== "Success") {
      console.error("Failed to fetch attributes:", data);
      return [];
    }

    // Process global attributes
    const globalAttributes = data.data.global_attributes.map((attr) => ({
      id: attr._id,
      name: attr.attribute,
      data_type: attr.data_type,
      default_operators: DEFAULT_OPERATORS_BY_TYPE[attr.data_type] || ["="],
      input_type: DATA_TYPE_TO_INPUT_TYPE[attr.data_type] || "text",
      isGlobal: true,
      test_value: attr.test_value,
      source_type: "global_attributes",
    }));

    // Process input attributes
    const inputAttributes = (data.data.input_attributes || []).map((attr) => ({
      id: attr._id,
      name: attr.attribute,
      data_type: attr.data_type,
      default_operators: DEFAULT_OPERATORS_BY_TYPE[attr.data_type] || ["="],
      input_type: DATA_TYPE_TO_INPUT_TYPE[attr.data_type] || "text",
      isGlobal: false,
      test_value: attr.test_value,
      source_type: "input_attributes",
    }));

    return [...globalAttributes, ...inputAttributes];
  } catch (error) {
    console.error("Error fetching attributes:", error);
    // Fallback to mock data in case of errors
    return [
      {
        name: "Name",
        data_type: "String",
        default_operators: ["=", "!=", "contains"],
        input_type: "text",
        source_type: "fallback",
      },
      {
        name: "Age",
        data_type: "Numeric",
        default_operators: [">", "<", ">=", "<=", "="],
        input_type: "number",
        source_type: "fallback",
      },
      {
        name: "Is Active",
        data_type: "Boolean",
        default_operators: ["="],
        input_type: "boolean",
        source_type: "fallback",
      },
      {
        name: "Registered Date",
        data_type: "Date",
        default_operators: ["=", "between"],
        input_type: "date",
        source_type: "fallback",
      },
    ];
  }
};

// Fetch operators from API based on data type
const fetchOperators = async (dataType) => {
  try {
    const payload = {
      datatype: dataType,
    };

    const response = await fetch(
      "https://micro-solution-ruleengineprod.mfilterit.net/getOperator",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (
      data.status === "Success" &&
      data.data &&
      typeof data.data === "object"
    ) {
      // Format API response (object of key-value pairs) to match expected structure
      return Object.entries(data.data).map(([operator, displayName]) => ({
        value: operator,
        label: displayName,
      }));
    }

    console.error(
      "Failed to fetch operators or invalid response format:",
      data
    );
    return getFallbackOperators(dataType);
  } catch (error) {
    console.error("Error fetching operators:", error);
    return getFallbackOperators(dataType);
  }
};

// Fallback operators if API call fails
const getFallbackOperators = (dataType) => {
  const operatorsMap = {
    String: [
      { value: "=", label: "Equals" },
      { value: "!=", label: "Not Equals" },
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "in", label: "In List" },
      { value: "not in", label: "Not In List" },
    ],
    Numeric: [
      { value: "=", label: "Equals" },
      { value: "!=", label: "Not Equals" },
      { value: ">", label: "Greater Than" },
      { value: "<", label: "Less Than" },
      { value: ">=", label: "Greater Than or Equal" },
      { value: "<=", label: "Less Than or Equal" },
      { value: "between", label: "Between" },
      { value: "in", label: "In List" },
      { value: "not in", label: "Not In List" },
    ],
    Boolean: [{ value: "=", label: "Is" }],
    Date: [
      { value: "=", label: "Equals" },
      { value: "!=", label: "Not Equals" },
      { value: "between", label: "Between" },
    ],
    DateTime: [
      { value: "=", label: "Equals" },
      { value: "!=", label: "Not Equals" },
      { value: "between", label: "Between" },
    ],
  };

  return operatorsMap[dataType] || operatorsMap.String;
};

// Dynamic Value Input Component
const DynamicValueInput = ({
  property,
  value,
  operator,
  onChange,
  theme = "light",
}) => {
  const themeStyles = THEMES[theme] || THEMES.light;

  // Helper to handle "in" operator inputs - converts comma-separated values to typed arrays
  const handleInOperatorChange = (e) => {
    // Just store the raw string while typing to allow comma entry
    onChange(e.target.value);
  };

  // Handle between numeric values to ensure they're numbers
  const handleBetweenNumericChange = (index, e) => {
    const inputValue = e.target.value;
    // Don't convert to number yet to allow partial typing like "-" or "."
    const safeValue = value === undefined || value === null ? ["", ""] : value;
    // Ensure safeValue is always an array for numeric between
    const currentArray = Array.isArray(safeValue) ? [...safeValue] : ["", ""];
    // Ensure array has at least two elements
    while (currentArray.length < 2) {
      currentArray.push("");
    }

    currentArray[index] = inputValue; // Store string value onChange
    onChange(currentArray);
  };

  // Convert 'between' numeric input to number on blur
  const handleBetweenNumericBlur = (index, event) => {
    const inputValue = event.target.value;
    const currentArray = Array.isArray(value) ? [...value] : ["", ""];
    while (currentArray.length < 2) {
      currentArray.push("");
    }

    if (inputValue.trim() === "") {
      // If input is cleared, store empty string or null? Let's use "" for consistency.
      if (currentArray[index] !== "") {
        const newValue = [...currentArray];
        newValue[index] = "";
        onChange(newValue);
      }
      return;
    }

    const num = Number(inputValue);
    // Only update if it's a valid number AND the stored value is different
    // to prevent unnecessary updates or converting already correct numbers.
    if (!isNaN(num) && currentArray[index] !== num) {
      const newValue = [...currentArray];
      newValue[index] = num; // Store the number
      onChange(newValue);
    }
    // If it's not a valid number, do nothing on blur, the string remains from onChange.
  };

  // Handle date or datetime values for 'between' operator
  const handleBetweenDateChange = (index, e) => {
    const inputValue = e.target.value;
    const safeValue = value === undefined || value === null ? ["", ""] : value;
    const newValue = Array.isArray(safeValue) ? [...safeValue] : ["", ""];
    newValue[index] = inputValue;
    onChange(newValue);
  };

  const renderInput = () => {
    // Ensure value is never undefined for controlled inputs
    const safeValue = value === undefined || value === null ? "" : value;

    // Hide input for Any and Exists operators
    if (operator === "Any" || operator === "Exists") {
      return null;
    }

    // Handle "in" operator for all data types
    if (operator === "in" || operator === "not in") {
      // If value is an array, convert to string for display/editing
      const displayValue = Array.isArray(safeValue)
        ? safeValue.join(", ")
        : safeValue || "";

      return (
        <div className="w-full relative">
          <input
            type="text"
            value={displayValue}
            onChange={handleInOperatorChange}
            onBlur={() => {
              // Convert to array on blur if it's a string
              if (typeof safeValue === "string") {
                if (safeValue.trim() === "") {
                  // Empty input should be an empty array
                  onChange([]);
                  return;
                }

                const dataType = property?.data_type || "String";

                if (dataType === "Numeric") {
                  // Convert to array of numbers
                  const numericArray = safeValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item !== "")
                    .map((item) => {
                      const num = Number(item);
                      return isNaN(num) ? null : num;
                    })
                    .filter((item) => item !== null);

                  onChange(numericArray.length > 0 ? numericArray : []);
                } else {
                  // Convert to array of strings
                  const stringArray = safeValue
                    .split(",")
                    .map((item) => item.trim())
                    .filter((item) => item !== "");

                  onChange(stringArray.length > 0 ? stringArray : []);
                }
              }
            }}
            className={`w-full ${themeStyles.inputStyles}`}
            placeholder={
              property?.input_type === "number"
                ? "1, 2, 3"
                : "value1, value2, value3"
            }
          />
          <div className="text-xs text-gray-500 italic absolute -bottom-5 left-0">
            Enter comma-separated {property?.data_type?.toLowerCase()} values
          </div>
        </div>
      );
    }

    // Default to text input for no property or String type
    if (!property || property.input_type === "text") {
      return (
        <input
          type="text"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${themeStyles.inputStyles}`}
          placeholder="Enter value"
        />
      );
    }

    switch (property.input_type) {
      case "boolean":
        // Convert boolean value to string for display in select, default to "" if not explicitly true/false
        const displayValue =
          safeValue === true ? "True" : safeValue === false ? "False" : "";

        return (
          <select
            value={displayValue} // Use the calculated displayValue
            onChange={(e) => {
              // Convert to actual boolean or null when setting the value
              const selected = e.target.value;
              let actualValue;
              if (selected === "True") {
                actualValue = true;
              } else if (selected === "False") {
                actualValue = false;
              } else {
                actualValue = null; // Or undefined, depending on desired unselected state
              }
              onChange(actualValue);
            }}
            className={`w-full ${themeStyles.inputStyles}`}
          >
            {/* Add default "Select Value" option */}
            <option value="">Select Value</option>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        );

      case "datetime-local":
        return operator === "between" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">From:</span>
              <input
                type="datetime-local"
                value={
                  Array.isArray(safeValue) && safeValue[0] !== null
                    ? safeValue[0]
                    : ""
                }
                onChange={(e) => handleBetweenDateChange(0, e)}
                className={`w-full ${themeStyles.inputStyles}`}
              />
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">To:</span>
              <input
                type="datetime-local"
                value={
                  Array.isArray(safeValue) && safeValue[1] !== null
                    ? safeValue[1]
                    : ""
                }
                onChange={(e) => handleBetweenDateChange(1, e)}
                className={`w-full ${themeStyles.inputStyles}`}
              />
            </div>
          </div>
        ) : (
          <input
            type="datetime-local"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${themeStyles.inputStyles}`}
          />
        );

      case "date":
        return operator === "between" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">From:</span>
              <input
                type="date"
                value={
                  Array.isArray(safeValue) && safeValue[0] !== null
                    ? safeValue[0]
                    : ""
                }
                onChange={(e) => handleBetweenDateChange(0, e)}
                className={`w-full ${themeStyles.inputStyles}`}
              />
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">To:</span>
              <input
                type="date"
                value={
                  Array.isArray(safeValue) && safeValue[1] !== null
                    ? safeValue[1]
                    : ""
                }
                onChange={(e) => handleBetweenDateChange(1, e)}
                className={`w-full ${themeStyles.inputStyles}`}
              />
            </div>
          </div>
        ) : (
          <input
            type="date"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${themeStyles.inputStyles}`}
          />
        );

      case "number":
        return operator === "between" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">From:</span>
              <input
                type="number"
                value={
                  Array.isArray(safeValue) && safeValue[0] !== null
                    ? safeValue[0]
                    : ""
                }
                onChange={(e) => handleBetweenNumericChange(0, e)}
                onBlur={(e) => handleBetweenNumericBlur(0, e)}
                className={`w-full ${themeStyles.inputStyles}`}
                placeholder="Min value"
              />
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium w-8">To:</span>
              <input
                type="number"
                value={
                  Array.isArray(safeValue) && safeValue[1] !== null
                    ? safeValue[1]
                    : ""
                }
                onChange={(e) => handleBetweenNumericChange(1, e)}
                onBlur={(e) => handleBetweenNumericBlur(1, e)}
                className={`w-full ${themeStyles.inputStyles}`}
                placeholder="Max value"
              />
            </div>
          </div>
        ) : (
          <input
            type="number"
            value={safeValue}
            onChange={(e) => {
              const val = e.target.value;
              // Allow partial number input like "-" or "."
              onChange(val);
            }}
            className={`w-full ${themeStyles.inputStyles}`}
            placeholder="Enter number"
            onBlur={(e) => {
              // Convert to number on blur if needed
              const val = e.target.value;
              if (val !== "" && val !== "-" && val !== ".") {
                onChange(Number(val));
              }
            }}
          />
        );

      default:
        return (
          <input
            type="text"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full ${themeStyles.inputStyles}`}
            placeholder="Enter value"
          />
        );
    }
  };

  return renderInput();
};

// Recursive Condition Renderer
const ConditionRenderer = ({
  group,
  properties,
  onUpdate,
  onRemove,
  depth = 0,
  theme = "light",
  refreshProperties,
}) => {
  const [operatorsMap, setOperatorsMap] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFocused, setHasFocused] = useState({});
  const themeStyles = THEMES[theme] || THEMES.light;

  // Get the appropriate group style based on depth
  const groupStyle =
    themeStyles.groupStyles[depth % themeStyles.groupStyles.length];

  // Helper function to get property type
  const getPropertyType = (propertyName) => {
    const property = properties.find((p) => p.name === propertyName);
    return property ? property.data_type : "String";
  };

  // Load operators for a specific data type
  const loadOperatorsForType = async (dataType) => {
    const operators = await fetchOperators(dataType);
    setOperatorsMap((prevMap) => ({
      ...prevMap,
      [dataType]: operators,
    }));
    return operators;
  };

  // Ensure operators are loaded for a data type (used when rendering rules)
  const ensureOperatorsLoaded = async (dataType) => {
    if (!operatorsMap[dataType]) {
      console.log(`Loading missing operators for data type: ${dataType}`);
      await loadOperatorsForType(dataType);
      return true; // operators were loaded
    }
    return false; // operators were already loaded
  };

  // Previous addItem implementation remains the same
  const addItem = (type) => {
    // Create a deep copy of the group to avoid reference issues
    const newGroup = JSON.parse(JSON.stringify(group));

    if (type === "condition") {
      // Add a new condition with all required fields
      newGroup.rules.push({
        property: "",
        operator: "",
        value: "",
        data_type: "",
        source_type: "",
      });
    } else {
      // Add a new group with a nested condition
      newGroup.rules.push({
        type: "group",
        operator: "all",
        rules: [
          {
            property: "",
            operator: "",
            value: "",
            data_type: "",
            source_type: "",
          },
        ],
      });
    }

    // Force update to parent
    onUpdate(newGroup);
  };

  // Use a ref to store the select element we're currently interacting with
  const currentSelectRef = React.useRef(null);

  // Refresh properties without closing the dropdown
  const refreshPropertiesInBackground = async () => {
    if (isRefreshing || !refreshProperties) return;

    setIsRefreshing(true);

    try {
      // Keep track of the currently selected value before refreshing
      const selectedValues = {};
      group.rules.forEach((rule, index) => {
        if (!rule.type) {
          // Only for condition rules
          selectedValues[index] = rule.property;
        }
      });

      // Refresh the properties in the background
      await refreshProperties();

      // After refresh, make sure we maintain the selected values where possible
      const newGroup = { ...group };
      group.rules.forEach((rule, index) => {
        if (!rule.type && selectedValues[index]) {
          // Check if the previously selected property still exists
          const stillExists = properties.some(
            (p) => p.name === selectedValues[index]
          );
          if (!stillExists) {
            // If the property no longer exists, reset to the first available property
            if (properties.length > 0) {
              newGroup.rules[index] = {
                ...rule,
                property: properties[0].name,
                operator:
                  operatorsMap[properties[0].data_type]?.[0]?.value || "",
                data_type: properties[0].data_type,
              };
            }
          }
        }
      });

      // Update the group if needed
      if (newGroup !== group) {
        onUpdate(newGroup);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Pre-refresh properties before the dropdown opens
  const handleSelectClick = (e) => {
    const target = e.currentTarget;
    currentSelectRef.current = target;

    // Don't refresh if we're already refreshing
    if (!isRefreshing) {
      refreshPropertiesInBackground();
    }
  };

  // Preload operators for existing properties on mount
  useEffect(() => {
    const loadInitialOperators = async () => {
      // Get unique data types from existing conditions
      const dataTypes = new Set();

      const processRules = (rules) => {
        for (const rule of rules) {
          if (rule.type === "group") {
            processRules(rule.rules);
          } else if (rule.property && rule.data_type) {
            // Use existing data_type if available
            dataTypes.add(rule.data_type);
          } else if (rule.property) {
            // Otherwise get from property lookup
            const dataType = getPropertyType(rule.property);
            dataTypes.add(dataType);
          }
        }
      };

      processRules(group.rules);

      console.log("Loading operators for data types:", Array.from(dataTypes));

      // Load operators for each data type
      const operatorsPromises = Array.from(dataTypes).map((dataType) =>
        loadOperatorsForType(dataType)
      );

      await Promise.all(operatorsPromises);

      // If we have rules with properties but no operators, set them now
      const newGroup = JSON.parse(JSON.stringify(group));
      let hasUpdates = false;

      const updateRulesWithOperators = (rules) => {
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule.type === "group") {
            if (updateRulesWithOperators(rule.rules)) {
              hasUpdates = true;
            }
          } else if (rule.property && !rule.operator && rule.data_type) {
            // Get available operators for this data type
            const operators = operatorsMap[rule.data_type];
            if (operators && operators.length > 0) {
              rules[i] = {
                ...rule,
                operator: operators[0].value,
              };
              hasUpdates = true;
            }
          }
        }
        return hasUpdates;
      };

      if (updateRulesWithOperators(newGroup.rules) && onUpdate) {
        console.log("Updating rules with missing operators");
        onUpdate(newGroup);
      }
    };

    loadInitialOperators();

    // Also load properties on mount to ensure we have fresh data
    if (refreshProperties) {
      refreshPropertiesInBackground();
    }
  }, []);

  // Update and remove item methods remain the same

  return (
    <div
      className={`${
        themeStyles.groupBackground
      } p-4 rounded-md mb-4 shadow-sm ${groupStyle} ${
        depth > 0 ? "ml-8" : ""
      } relative`}
      style={{ width: "auto", minWidth: "fit-content" }}
    >
      {/* Operator dropdown for ALL groups, including main group */}
      <div
        className={`absolute ${
          depth > 0 ? "-left-9" : "-left-10"
        } top-1/2 transform -translate-y-1/2`}
      >
        <select
          value={group.operator}
          onChange={(e) => onUpdate({ ...group, operator: e.target.value })}
          className={`${
            themeStyles.inputStyles
          } font-semibold text-xs rounded-full h-8 w-16 ${
            group.operator === "all"
              ? theme === "dark"
                ? "bg-blue-900 text-blue-100 border-blue-700"
                : "bg-blue-50 text-blue-700 border-blue-300"
              : theme === "dark"
              ? "bg-orange-900 text-orange-100 border-orange-700"
              : "bg-green-50 text-green-700 border-green-300"
          }`}
        >
          <option value="all">AND</option>
          <option value="any">OR</option>
        </select>
      </div>

      {/* Rules and Nested Groups */}
      <div
        className={`pl-4 ${
          depth > 0 ? "border-l border-dashed border-gray-300" : ""
        }`}
      >
        {group.rules.map((condition, index) => (
          <div
            key={index}
            className="mb-4"
            style={{
              width: condition.type === "group" ? "auto" : "max-content",
            }}
          >
            {condition.type === "group" ? (
              <ConditionRenderer
                group={condition}
                properties={properties}
                onUpdate={(updatedGroup) => {
                  const newGroup = JSON.parse(JSON.stringify(group));
                  newGroup.rules[index] = updatedGroup;
                  onUpdate(newGroup);
                }}
                onRemove={() => {
                  // Create a deep copy and remove the group
                  const newGroup = JSON.parse(JSON.stringify(group));
                  newGroup.rules.splice(index, 1);
                  onUpdate(newGroup);
                }}
                depth={depth + 1}
                theme={theme}
                refreshProperties={refreshProperties}
              />
            ) : (
              <div
                className={`p-2 rounded-md  bg-opacity-50 max-w-[750px] ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "800px",
                    gap: "8px",
                  }}
                >
                  {/* Property Selector */}
                  <CustomPropertySelect
                    value={condition.property}
                    properties={properties}
                    onClick={handleSelectClick}
                    onChange={async (e) => {
                      const selectedProperty = properties.find(
                        (p) => p.name === e.target.value
                      );

                      if (!selectedProperty) return;

                      const dataType = selectedProperty.data_type;

                      // Load operators for this data type if not already loaded
                      let availableOperators = operatorsMap[dataType];
                      if (!availableOperators) {
                        availableOperators = await loadOperatorsForType(
                          dataType
                        );
                      }

                      const firstOperator =
                        availableOperators?.[0]?.value || "";

                      // Set default value based on data type
                      let defaultValue = "";
                      if (dataType === "Boolean") {
                        defaultValue = true;
                      }

                      // Create a deep copy to avoid reference issues
                      const newGroup = JSON.parse(JSON.stringify(group));
                      newGroup.rules[index] = {
                        property: selectedProperty.name,
                        operator: firstOperator,
                        value: defaultValue,
                        source_type: selectedProperty.source_type,
                        data_type: dataType,
                      };
                      onUpdate(newGroup);
                    }}
                    inputStyles={themeStyles.inputStyles}
                    theme={theme}
                  />

                  {/* Operator Selector */}
                  {condition.property && (
                    <React.Fragment>
                      {/* Force immediate loading of operators if needed */}
                      {(() => {
                        const dataType =
                          condition.data_type ||
                          getPropertyType(condition.property);
                        if (!operatorsMap[dataType]) {
                          // This kicks off operator loading without waiting
                          ensureOperatorsLoaded(dataType);

                          // While loading, return a placeholder
                          return (
                            <div
                              className={`${themeStyles.inputStyles} flex items-center justify-center`}
                              style={{ width: "200px", flex: "0 0 200px" }}
                            >
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
                              <span>Loading...</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Only render select if operators are loaded */}
                      {operatorsMap[
                        condition.data_type ||
                          getPropertyType(condition.property)
                      ] && (
                        <select
                          value={condition.operator || ""}
                          onChange={(e) => {
                            // Create a deep copy of the group to avoid reference issues
                            const newGroup = JSON.parse(JSON.stringify(group));
                            const newOperator = e.target.value;
                            const selectedProperty = properties.find(
                              (p) => p.name === condition.property
                            );
                            const dataType =
                              selectedProperty?.data_type ||
                              condition.data_type ||
                              "String";

                            // Initialize appropriate value type based on operator and data type
                            let newValue;
                            if (
                              newOperator === "Any" ||
                              newOperator === "Exists"
                            ) {
                              // Set value to empty string for Any and Exists operators
                              newValue = "";
                            } else if (newOperator === "between") {
                              // Initialize as empty array with proper type
                              newValue = ["", ""];
                            } else if (
                              newOperator === "in" ||
                              newOperator === "not in"
                            ) {
                              // Initialize as empty array for in/not in operators
                              newValue = [];
                            } else if (
                              dataType === "Numeric" &&
                              newOperator !== "between"
                            ) {
                              // For other numeric operators, initialize as empty string
                              newValue = "";
                            } else {
                              // Default for other data types
                              newValue = "";
                            }

                            // Update the rule with new operator and appropriate value
                            newGroup.rules[index] = {
                              ...newGroup.rules[index], // Keep existing properties
                              operator: newOperator,
                              value: newValue, // Set appropriate empty value
                              data_type: dataType, // Ensure data_type is set
                              source_type: condition.source_type || "", // Keep source_type
                            };

                            console.log(
                              "Updating operator to:",
                              newOperator,
                              "with value:",
                              newValue
                            );

                            // Force update to parent with the new group
                            onUpdate(newGroup);
                          }}
                          className={`${themeStyles.inputStyles}`}
                          style={{ width: "200px", flex: "0 0 200px" }}
                        >
                          <option value="">Select operator</option>
                          {operatorsMap[
                            condition.data_type ||
                              getPropertyType(condition.property)
                          ]?.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </React.Fragment>
                  )}

                  {/* Value Input */}
                  <div style={{ width: "230px", flex: "0 0 230px" }}>
                    <DynamicValueInput
                      property={
                        condition.property
                          ? properties.find(
                              (p) => p.name === condition.property
                            )
                          : { input_type: "text" }
                      }
                      value={condition.value}
                      operator={condition.operator}
                      onChange={(newValue) => {
                        // Create deep copy of the group to avoid reference issues
                        const newGroup = JSON.parse(JSON.stringify(group));
                        newGroup.rules[index] = {
                          ...newGroup.rules[index],
                          value: newValue,
                        };
                        onUpdate(newGroup);
                      }}
                      theme={theme}
                    />
                  </div>

                  {/* Source Type Display (hidden) */}
                  <div className="hidden">{condition.source_type || ""}</div>

                  {/* Remove Condition Button */}
                  <button
                    onClick={() => {
                      // Create a deep copy of the group to avoid reference issues
                      const newGroup = JSON.parse(JSON.stringify(group));
                      // Remove the rule at this index
                      newGroup.rules.splice(index, 1);
                      // Force an immediate update
                      onUpdate(newGroup);
                    }}
                    className={`${
                      themeStyles.buttonColors.remove
                    } p-1 cursor-pointer rounded-full  ${
                      theme === "dark" ? "bg-gray-700" : "bg-white"
                    }`}
                    style={{ flexShrink: 0 }}
                  >
                    <DeleteIcon size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Group Actions - moved to bottom */}
      <div className="mt-4 flex items-center">
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => addItem("condition")}
            className={`flex items-center ${themeStyles.buttonColors.condition} px-2 py-1 rounded-md border border-green-200 bg-green-50 cursor-pointer`}
          >
            <AddIcon size={16} className="mr-1" /> Condition
          </button>
          <button
            onClick={() => addItem("group")}
            className={`flex items-center ${themeStyles.buttonColors.group} px-2 py-1 rounded-md border border-blue-200 bg-blue-50 cursor-pointer`}
          >
            <GroupIcon size={16} className="mr-1" /> Group
          </button>
          {depth > 0 && (
            <button
              onClick={() => {
                // Force immediate removal with proper deep copy
                onRemove();
              }}
              className={`flex items-center ${themeStyles.buttonColors.remove} px-2 py-1 cursor-pointer rounded-md border border-red-200 bg-red-50`}
            >
              <DeleteIcon size={16} className="mr-1" /> Remove Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Condition Builder Component
const ConditionBuilder = ({
  theme = "light",
  onConditionChange,
  isTested,
  setIsTested,
  currentConditions,
}) => {
  const [properties, setProperties] = useState([]);
  const [operatorsMap, setOperatorsMap] = useState({});
  const [rootGroup, setRootGroup] = useState({
    type: "group",
    operator: "all",
    rules: [],
  });
  const themeStyles = THEMES[theme] || THEMES.light;

  // Track if we're in the middle of an update
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to get property data type by name
  const getPropertyDataType = (propertyName) => {
    const property = properties.find((p) => p.name === propertyName);
    return property ? property.data_type : "String";
  };

  // Process the rules for submission - convert string values to proper arrays for in/not in
  const processRuleValues = (rule) => {
    if (!rule || rule.type === "group") return rule;

    // Clone to avoid modifying original
    const processedRule = { ...rule };

    // If using in/not in operators with string value, convert to array
    if (
      (rule.operator === "in" || rule.operator === "not in") &&
      typeof rule.value === "string"
    ) {
      const dataType = getPropertyDataType(rule.property);

      if (rule.value.trim()) {
        if (dataType === "Numeric") {
          // Convert to array of numbers
          processedRule.value = rule.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "")
            .map((item) => {
              const num = Number(item);
              return isNaN(num) ? null : num;
            })
            .filter((item) => item !== null);
        } else {
          // Convert to array of strings
          processedRule.value = rule.value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
        }
      } else {
        processedRule.value = [];
      }
    } else if (
      (rule.operator === "in" || rule.operator === "not in") &&
      !Array.isArray(rule.value)
    ) {
      // Handle non-string, non-array values (like numbers)
      processedRule.value = rule.value ? [rule.value] : [];
    }

    return processedRule;
  };

  // Process an entire rule group recursively
  const processRuleGroup = (group) => {
    if (!group || !group.rules) return group;

    const processedGroup = { ...group };
    processedGroup.rules = group.rules.map((rule) => {
      if (rule.type === "group") {
        return processRuleGroup(rule);
      } else {
        return processRuleValues(rule);
      }
    });

    return processedGroup;
  };

  // Function to fetch properties
  const loadProperties = async () => {
    const fetchedProperties = await fetchProperties();
    setProperties(fetchedProperties);
    return fetchedProperties;
  };

  // Fetch properties and handle currentConditions
  useEffect(() => {
    const initializeComponent = async () => {
      // Log current state for debugging
      console.log(
        "Effect triggered with currentConditions:",
        currentConditions
      );

      // Load properties first if not already loaded
      if (properties.length === 0) {
        await loadProperties();
      }

      // Handle the currentConditions changes
      if (
        currentConditions &&
        typeof currentConditions === "object" &&
        currentConditions.type === "group" &&
        Array.isArray(currentConditions.rules)
      ) {
        // Skip if the structure is identical to avoid loops
        if (JSON.stringify(rootGroup) === JSON.stringify(currentConditions)) {
          console.log("Skipping update - conditions are identical");
          return;
        }

        // Create a deep copy to ensure no reference issues
        const conditionsCopy = JSON.parse(JSON.stringify(currentConditions));

        // Ensure rules array is never empty
        if (conditionsCopy.rules.length === 0) {
          conditionsCopy.rules = [
            {
              property: "",
              operator: "",
              value: "",
              data_type: "",
              source_type: "",
            },
          ];
        }

        // Pre-load operators for all data types used in the conditions
        const dataTypesUsed = new Set();

        // Recursive function to find all data types
        const extractDataTypes = (rules) => {
          rules.forEach((rule) => {
            if (rule.type === "group" && rule.rules) {
              extractDataTypes(rule.rules);
            } else if (rule.data_type) {
              dataTypesUsed.add(rule.data_type);
            }
          });
        };

        extractDataTypes(conditionsCopy.rules);

        // Load operators for all data types in parallel
        const operatorPromises = Array.from(dataTypesUsed).map((dataType) =>
          fetchOperators(dataType).then((operators) => {
            setOperatorsMap((prev) => ({
              ...prev,
              [dataType]: operators,
            }));
          })
        );

        await Promise.all(operatorPromises);

        console.log(
          "Setting rootGroup from updated currentConditions:",
          conditionsCopy
        );

        // Update state
        setRootGroup(conditionsCopy);
      }
      // Only initialize default if rootGroup is empty (first load)
      else if (
        (!rootGroup.rules || rootGroup.rules.length === 0) &&
        (!currentConditions || !Array.isArray(currentConditions.rules))
      ) {
        console.log("Initializing with default empty condition");

        const initialGroup = {
          type: "group",
          operator: "all",
          rules: [
            {
              property: "",
              operator: "",
              value: "",
              data_type: "",
              source_type: "",
            },
          ],
        };

        setRootGroup(initialGroup);

        // Notify parent of initial state
        if (onConditionChange) {
          onConditionChange(initialGroup);
        }
      }
    };

    initializeComponent();
  }, [currentConditions]);

  // Update method with optional callback
  const handleUpdate = (updatedGroup) => {
    // Prevent circular updates
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      // Make a deep copy to ensure we're not working with references
      const processedGroup = JSON.parse(JSON.stringify(updatedGroup));

      // Skip update ONLY if structures are identical (but always update if rule count changes or operators change)
      const rulesCountChanged =
        rootGroup.rules?.length !== processedGroup.rules?.length;

      // Check for operator changes - these should always trigger an update
      let operatorChanged = false;
      if (rootGroup.rules && processedGroup.rules) {
        for (
          let i = 0;
          i < Math.min(rootGroup.rules.length, processedGroup.rules.length);
          i++
        ) {
          const oldRule = rootGroup.rules[i];
          const newRule = processedGroup.rules[i];

          // Check if this is a condition rule (not a group) and operator changed
          if (
            !oldRule.type &&
            !newRule.type &&
            oldRule.operator !== newRule.operator
          ) {
            operatorChanged = true;
            break;
          }
        }
      }

      // Always update if rules count changed or operator changed, otherwise check JSON equality
      if (
        !rulesCountChanged &&
        !operatorChanged &&
        JSON.stringify(rootGroup) === JSON.stringify(processedGroup)
      ) {
        console.log("Skipping update - no changes detected");
        return;
      }

      if (operatorChanged) {
        console.log("Operator change detected, forcing update");
      }

      // Update local state immediately
      setRootGroup(processedGroup);

      // Prevent testing after user edits
      if (setIsTested) {
        setIsTested(false);
      }

      // Notify parent immediately to ensure UI updates
      if (onConditionChange) {
        onConditionChange(processedGroup);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`p-6 ${themeStyles.background} ${themeStyles.text}`}>
      <div
        className={`max-w-6xl  mx-auto ${themeStyles.background} p-6 rounded-lg shadow-md overflow-auto`}
        style={{ overflowX: "auto" }}
      >
        {/* <h1 className="text-2xl font-bold mb-6">Condition Builder</h1> */}

        {/* Recursive Condition Renderer */}
        <div
          style={{
            display: "inline-block",
            minWidth: "min-content",
            marginLeft: "20px",
          }}
        >
          <ConditionRenderer
            group={rootGroup}
            properties={properties}
            onUpdate={handleUpdate}
            onRemove={() => {}} // Root group cannot be removed
            theme={theme}
            refreshProperties={loadProperties}
          />
        </div>

        {/* JSON Output for Debugging */}
        {/* <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">JSON Output:</h2>
          <pre
            className={`${themeStyles.groupBackground} p-4 rounded overflow-x-auto`}
          >
            {JSON.stringify(rootGroup, null, 2)}
          </pre>
        </div> */}
      </div>
    </div>
  );
};

export default ConditionBuilder;
