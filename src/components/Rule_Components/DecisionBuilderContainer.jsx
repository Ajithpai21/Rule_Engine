import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  MoreVertical,
  DatabaseZap,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useSelector } from "react-redux";
import ResultConfigPopup from "./ResultConfigPopup"; // <-- Import the new component
import { produce } from "immer";
import { toast } from "react-toastify";
import getUserDetails from "@/utils/getUserDetails";

const DecisionBuilderContainer = ({
  conditions = [],
  onUpdate,
  isReadOnly = false,
  isInputAttribute,
}) => {
  const user = getUserDetails();
  const theme = useSelector((state) => state.theme.mode);
  const [activeRowMenu, setActiveRowMenu] = useState(null);
  const [columnProperties, setColumnProperties] = useState([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(null);
  const [showResultConfigPopupIndex, setShowResultConfigPopupIndex] =
    useState(null); // New state for result popup index
  const [refresh, setRefresh] = useState(0);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  // --- State for Rule Policy Dropdown (Managed by PARENT) ---
  // const [selectedRulePolicy, setSelectedRulePolicy] = useState(""); // REMOVED - Now passed as prop or handled by parent
  // -------------------------------------

  // Combined initialization effect
  useEffect(() => {
    console.log(
      "Running consolidated initialization effect. Conditions:",
      conditions
    );

    if (
      !conditions ||
      conditions.length === 0 ||
      !conditions[0]?.conditions?.[0]?.rules ||
      conditions[0].conditions[0].rules.filter((rule) => !rule.isResult)
        .length === 0 // Check if there are no non-result rules
    ) {
      // CASE 1: Conditions are empty or invalid or lack condition rules - Set defaults
      console.log(
        "Conditions are empty/invalid or lack condition rules. Setting defaults."
      );

      const defaultConditionColumn = {
        property: "",
        operator: "",
        displayLabel: "",
        data_type: "String",
        source_type: "",
        is_group: false,
        id: `condition-default-${Date.now()}`,
        isResult: false, // Explicitly mark as not result
      };

      // Check if there are result columns from potentially empty conditions structure
      const existingResultProps = [];
      if (conditions && conditions.length > 0 && conditions[0].result) {
        const firstRowWithResults = conditions.find(
          (row) =>
            row.result &&
            typeof row.result === "object" &&
            Object.keys(row.result).length > 0
        );
        if (firstRowWithResults && firstRowWithResults.result) {
          Object.keys(firstRowWithResults.result).forEach((resultKey) => {
            let dataType = "String";
            for (const row of conditions) {
              if (
                row.result &&
                row.result[resultKey] !== null &&
                row.result[resultKey] !== undefined
              ) {
                const value = row.result[resultKey];
                if (typeof value === "number") dataType = "Numeric";
                else if (typeof value === "boolean") dataType = "Boolean";
                break;
              }
            }
            existingResultProps.push({
              property: resultKey,
              key: resultKey,
              resultName: resultKey,
              resultDataType: dataType,
              displayLabel: dataType,
              isResult: true,
              id: `result-${Date.now()}-${resultKey}`,
              isFromAPI: true,
            });
          });
        }
      }

      const defaultColumnProps = [
        defaultConditionColumn,
        ...existingResultProps,
      ];

      console.log("Setting default column properties:", defaultColumnProps);
      setColumnProperties(defaultColumnProps); // Set state FIRST

      // Now create the default row structure using these properties
      console.log("Creating default row structure...");
      const defaultRow = createDefaultRowStructure(defaultColumnProps); // Use the new function

      console.log("Calling onUpdate with default row:", [defaultRow]);
      onUpdate([defaultRow]); // Update parent state
    } else {
      // CASE 2: Conditions have data - Extract properties
      console.log("Conditions have data. Extracting properties.");
      const initialColumnProperties = [];
      const firstRow = conditions[0];

      // Extract condition/group columns
      firstRow.conditions[0].rules.forEach((rule, index) => {
        // Check if it's explicitly marked as a group based on structure or flag
        const isGroup =
          rule.is_group === true ||
          (Array.isArray(rule.rules) && rule.operator);
        if (isGroup) {
          initialColumnProperties.push({
            property: rule.property || "", // Group header might not have property
            operator: rule.operator || "all", // Group operator (all/any)
            displayLabel: rule.display_label || `Group ${index + 1}`,
            data_type: "String", // Not directly relevant for group header
            source_type: rule.source_type || "",
            is_group: true,
            id: `group-${rule.id || Date.now()}-${index}`,
            isResult: false,
          });
        } else if (rule.property || !rule.key) {
          // Ensure it's a condition (has property) or needs configuration
          initialColumnProperties.push({
            property: rule.property || "",
            operator: "", // Operator is per-cell
            displayLabel: rule.display_label || `Condition ${index + 1}`,
            data_type: rule.data_type || "String",
            source_type: rule.source_type || "",
            is_group: false,
            id: `condition-${rule.id || Date.now()}-${index}`,
            isResult: false,
          });
        }
      });

      // Extract result columns
      const firstRowWithResults = conditions.find(
        (row) =>
          row.result &&
          typeof row.result === "object" &&
          Object.keys(row.result).length > 0
      );
      if (firstRowWithResults && firstRowWithResults.result) {
        Object.keys(firstRowWithResults.result).forEach((resultKey) => {
          // Avoid adding if a column with this key already exists (e.g., from condition rule parsing if structure is mixed)
          if (!initialColumnProperties.some((p) => p.key === resultKey)) {
            let dataType = "String";
            for (const row of conditions) {
              if (
                row.result &&
                row.result[resultKey] !== null &&
                row.result[resultKey] !== undefined
              ) {
                const value = row.result[resultKey];
                if (typeof value === "number") {
                  dataType = "Numeric";
                } else if (typeof value === "boolean") {
                  dataType = "Boolean";
                }
                break;
              }
            }

            // --- Check if this column already exists in state and preserve isFromAPI status --- START
            const existingColumn = columnProperties.find(
              (col) => col.isResult && col.key === resultKey
            );
            const isFromAPIValue =
              existingColumn?.isFromAPI === false ? false : true; // Preserve false if it exists, otherwise default to true
            // --- Check if this column already exists in state and preserve isFromAPI status --- END

            // --- Preserve existing dataType if column exists --- START
            const finalDataType = existingColumn?.resultDataType || dataType;
            // --- Preserve existing dataType if column exists --- END

            initialColumnProperties.push({
              property: resultKey,
              key: resultKey,
              resultName: resultKey, // Fetch name if available?
              resultDataType: finalDataType, // Use preserved or inferred dataType
              displayLabel: finalDataType, // Use preserved or inferred dataType
              isResult: true,
              id: `result-${Date.now()}-${resultKey}`,
              isFromAPI: isFromAPIValue, // Use the determined value
            });
          }
        });
      }

      console.log(
        "Setting extracted column properties:",
        initialColumnProperties
      );
      setColumnProperties(initialColumnProperties);

      // Ensure decision_id consistency
      if (
        conditions.some((row) => row.decision_id !== undefined) && // Check if any row has it
        sessionStorage.getItem("type_id")
      ) {
        const typeId = sessionStorage.getItem("type_id");
        const needsUpdate = conditions.some(
          (row) => row.decision_id !== typeId
        ); // Check if any row differs or is missing it
        if (needsUpdate) {
          console.log("Ensuring decision_id consistency across rows");
          const updatedConditions = produce(conditions, (draft) => {
            draft.forEach((row) => {
              row.decision_id = typeId;
            });
          });
          // Avoid infinite loops by checking if an update is actually needed before calling onUpdate
          if (
            JSON.stringify(conditions) !== JSON.stringify(updatedConditions)
          ) {
            onUpdate(updatedConditions);
          }
        }
      }
    }
    // Dependency array: depend on `conditions` prop to react to changes from parent
  }, [conditions, onUpdate]); // Added onUpdate

  // Helper function to create the default row structure
  const createDefaultRowStructure = (columnProps) => {
    console.log("createDefaultRowStructure called with props:", columnProps);
    const initialResult = {};
    const initialConditionRules = [];

    columnProps.forEach((prop) => {
      if (prop.isResult && prop.key) {
        initialResult[prop.key] = null;
      } else if (!prop.isResult) {
        // Only add non-result columns to condition rules
        if (prop.is_group) {
          // Add a default group structure
          initialConditionRules.push({
            id: `group-default-inner-${Date.now()}`,
            operator: "all",
            is_group: true,
            rules: [
              {
                // Default inner rule for the group
                id: `group-default-inner-rule-${Date.now()}`,
                property: "",
                source_type: "",
                operator: "",
                value: "",
                data_type: "String",
              },
            ],
          });
        } else {
          // Add a default condition rule structure
          initialConditionRules.push({
            id: `condition-default-inner-${Date.now()}`,
            property: prop.property || "",
            source_type: prop.source_type || "",
            operator: "",
            value: "",
            data_type: prop.data_type || "String",
          });
        }
      }
    });

    // Ensure at least one condition rule exists if none were added (e.g., only result cols provided)
    if (initialConditionRules.length === 0) {
      initialConditionRules.push({
        id: `condition-fallback-default-${Date.now()}`,
        property: "",
        source_type: "",
        operator: "",
        value: "",
        data_type: "String",
      });
    }

    return {
      id: Date.now(),
      priority: 1,
      enabled: true,
      decision_id: sessionStorage.getItem("type_id") || null,
      conditions: [
        {
          operator: "all", // Default outer operator
          rules: initialConditionRules, // Use the generated rules
        },
      ],
      result: initialResult,
    };
  };

  const handleToggleEnabled = (index) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      enabled: !newConditions[index].enabled,
    };
    onUpdate(newConditions);
  };

  const handleRowAction = (action, index) => {
    switch (action) {
      case "add_above":
        console.log(`[add_above] Starting with index=${index}`);
        try {
          // Create a new row with proper column structure
          const newRowAbove = createNewRowWithSharedProperties(index + 1);
          console.log("[add_above] New row created:", newRowAbove);

          // Create a deep clone of the existing conditions to avoid reference issues
          const updatedConditions = JSON.parse(JSON.stringify(conditions));

          // --- FIX: Update localInputValues to shift keys down ---
          const updatedLocalValues = { ...localInputValues };

          // Track all keys that need to be processed
          const keysToProcess = Object.keys(updatedLocalValues);

          // First, identify and build a map of min/max pairs for 'between' operators
          const betweenMinMaxPairs = {};
          keysToProcess.forEach((key) => {
            if (key.endsWith("-min") || key.endsWith("-max")) {
              const baseKey = key.replace(/-min$/, "").replace(/-max$/, "");
              if (!betweenMinMaxPairs[baseKey]) {
                betweenMinMaxPairs[baseKey] = { min: null, max: null };
              }
              if (key.endsWith("-min")) betweenMinMaxPairs[baseKey].min = key;
              if (key.endsWith("-max")) betweenMinMaxPairs[baseKey].max = key;
            }
          });

          // Find and shift regular condition keys
          const keysToShift = keysToProcess.filter((key) => {
            // Exclude -min and -max keys as they'll be handled separately
            if (key.endsWith("-min") || key.endsWith("-max")) return false;

            // Handle keys in format: "rowIndex-columnIndex-ruleIndex"
            const parts = key.split("-");
            const rowIndexPart = parseInt(parts[0], 10);
            return !isNaN(rowIndexPart) && rowIndexPart >= index;
          });

          // Sort keys in descending order of row index to avoid overwriting during shift
          keysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[0], 10);
            const rowB = parseInt(b.split("-")[0], 10);
            return rowB - rowA;
          });

          keysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[0], 10);
            const newRowIndex = oldRowIndex + 1;
            const restOfKey = parts.slice(1).join("-");
            const newKey = `${newRowIndex}-${restOfKey}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Find and shift ALL result column keys (which can have various formats)
          // This includes result-rowIndex-key format AND any other formats that might include row indices
          const resultKeysToShift = keysToProcess.filter((key) => {
            if (key.startsWith("result-")) {
              // Handle keys that start with "result-rowIndex-"
              const parts = key.split("-");
              if (parts.length >= 2) {
                const rowIndex = parseInt(parts[1], 10);
                return !isNaN(rowIndex) && rowIndex >= index;
              }
            }
            return false;
          });

          resultKeysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[1], 10);
            const rowB = parseInt(b.split("-")[1], 10);
            return rowB - rowA;
          });

          resultKeysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[1], 10);
            const newRowIndex = oldRowIndex + 1;
            // Reconstruct the key with the new row index
            const newKey = `result-${newRowIndex}-${parts.slice(2).join("-")}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Handle 'between' min/max values by updating special keys
          Object.entries(betweenMinMaxPairs).forEach(([baseKey, pair]) => {
            const baseKeyParts = baseKey.split("-");
            if (baseKeyParts.length >= 2) {
              const rowIdx = parseInt(baseKeyParts[0], 10);

              if (rowIdx >= index) {
                const newRowIdx = rowIdx + 1;
                const restOfBaseKey = baseKeyParts.slice(1).join("-");
                const newBaseKey = `${newRowIdx}-${restOfBaseKey}`;

                // Shift min key if it exists
                if (pair.min && updatedLocalValues[pair.min] !== undefined) {
                  const newMinKey = `${newBaseKey}-min`;
                  updatedLocalValues[newMinKey] = updatedLocalValues[pair.min];
                  delete updatedLocalValues[pair.min];
                }

                // Shift max key if it exists
                if (pair.max && updatedLocalValues[pair.max] !== undefined) {
                  const newMaxKey = `${newBaseKey}-max`;
                  updatedLocalValues[newMaxKey] = updatedLocalValues[pair.max];
                  delete updatedLocalValues[pair.max];
                }
              }
            }
          });

          // Update the localInputValues state
          setLocalInputValues(updatedLocalValues);
          // -------------------------------------------------------

          // Insert the new row at the specified position
          updatedConditions.splice(index, 0, newRowAbove);

          // Update priorities for all rows after the insertion
          for (let i = index + 1; i < updatedConditions.length; i++) {
            updatedConditions[i].priority = i + 1;
          }

          // Update the conditions with the new array
          onUpdate(updatedConditions);
        } catch (error) {
          console.error("[add_above] Error:", error);
        }
        break;

      case "add_below":
        console.log(`[add_below] Starting with index=${index}`);
        try {
          // Create a new row with proper column structure
          const newRowBelow = createNewRowWithSharedProperties(index + 2);
          console.log("[add_below] New row created:", newRowBelow);

          // Create a deep clone of the existing conditions to avoid reference issues
          const updatedConditions = JSON.parse(JSON.stringify(conditions));

          // --- FIX: Update localInputValues to shift keys down ---
          const updatedLocalValues = { ...localInputValues };

          // Track all keys that need to be processed
          const keysToProcess = Object.keys(updatedLocalValues);

          // First, identify and build a map of min/max pairs for 'between' operators
          const betweenMinMaxPairs = {};
          keysToProcess.forEach((key) => {
            if (key.endsWith("-min") || key.endsWith("-max")) {
              const baseKey = key.replace(/-min$/, "").replace(/-max$/, "");
              if (!betweenMinMaxPairs[baseKey]) {
                betweenMinMaxPairs[baseKey] = { min: null, max: null };
              }
              if (key.endsWith("-min")) betweenMinMaxPairs[baseKey].min = key;
              if (key.endsWith("-max")) betweenMinMaxPairs[baseKey].max = key;
            }
          });

          // Find and shift regular condition keys
          const keysToShift = keysToProcess.filter((key) => {
            // Exclude -min and -max keys as they'll be handled separately
            if (key.endsWith("-min") || key.endsWith("-max")) return false;

            // Handle keys in format: "rowIndex-columnIndex-ruleIndex"
            const parts = key.split("-");
            const rowIndexPart = parseInt(parts[0], 10);
            // Only affect rows AFTER the current index (since we're adding below)
            return !isNaN(rowIndexPart) && rowIndexPart > index;
          });

          // Sort keys in descending order of row index to avoid overwriting during shift
          keysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[0], 10);
            const rowB = parseInt(b.split("-")[0], 10);
            return rowB - rowA;
          });

          keysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[0], 10);
            const newRowIndex = oldRowIndex + 1;
            const restOfKey = parts.slice(1).join("-");
            const newKey = `${newRowIndex}-${restOfKey}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Find and shift ALL result column keys (which can have various formats)
          const resultKeysToShift = keysToProcess.filter((key) => {
            if (key.startsWith("result-")) {
              // Handle keys that start with "result-rowIndex-"
              const parts = key.split("-");
              if (parts.length >= 2) {
                const rowIndex = parseInt(parts[1], 10);
                // Only affect rows AFTER the current index
                return !isNaN(rowIndex) && rowIndex > index;
              }
            }
            return false;
          });

          resultKeysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[1], 10);
            const rowB = parseInt(b.split("-")[1], 10);
            return rowB - rowA;
          });

          resultKeysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[1], 10);
            const newRowIndex = oldRowIndex + 1;
            // Reconstruct the key with the new row index
            const newKey = `result-${newRowIndex}-${parts.slice(2).join("-")}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Handle 'between' min/max values by updating special keys
          Object.entries(betweenMinMaxPairs).forEach(([baseKey, pair]) => {
            const baseKeyParts = baseKey.split("-");
            if (baseKeyParts.length >= 2) {
              const rowIdx = parseInt(baseKeyParts[0], 10);

              // Only affect rows AFTER the current index
              if (rowIdx > index) {
                const newRowIdx = rowIdx + 1;
                const restOfBaseKey = baseKeyParts.slice(1).join("-");
                const newBaseKey = `${newRowIdx}-${restOfBaseKey}`;

                // Shift min key if it exists
                if (pair.min && updatedLocalValues[pair.min] !== undefined) {
                  const newMinKey = `${newBaseKey}-min`;
                  updatedLocalValues[newMinKey] = updatedLocalValues[pair.min];
                  delete updatedLocalValues[pair.min];
                }

                // Shift max key if it exists
                if (pair.max && updatedLocalValues[pair.max] !== undefined) {
                  const newMaxKey = `${newBaseKey}-max`;
                  updatedLocalValues[newMaxKey] = updatedLocalValues[pair.max];
                  delete updatedLocalValues[pair.max];
                }
              }
            }
          });

          // Update the localInputValues state
          setLocalInputValues(updatedLocalValues);
          // -------------------------------------------------------

          // Insert the new row after the current row
          updatedConditions.splice(index + 1, 0, newRowBelow);

          // Update priorities for all rows after the insertion
          for (let i = index + 1; i < updatedConditions.length; i++) {
            updatedConditions[i].priority = i + 1;
          }

          // Update the conditions with the new array
          onUpdate(updatedConditions);
        } catch (error) {
          console.error("[add_below] Error:", error);
        }
        break;

      case "duplicate":
        console.log(`[duplicate] Starting with index=${index}`);
        try {
          // Create a copy of the row being duplicated
          const rowToDuplicate = JSON.parse(JSON.stringify(conditions[index]));

          // Generate new IDs for the duplicated row and its rules
          const creationTimestamp = Date.now();
          const duplicatedRow = {
            ...rowToDuplicate,
            id: creationTimestamp,
            priority: rowToDuplicate.priority + 1,
            createdAt: creationTimestamp,
          };

          // Remove sub_rule_id from the duplicated row if it exists
          if (duplicatedRow.hasOwnProperty("sub_rule_id")) {
            delete duplicatedRow.sub_rule_id;
            console.log("Removed sub_rule_id from duplicated row");
          }

          // Deep clone existing conditions
          const updatedConditions = JSON.parse(JSON.stringify(conditions));

          // --- FIX: Update localInputValues to properly handle key shifting ---
          const updatedLocalValues = { ...localInputValues };

          // Track all keys that need to be processed
          const keysToProcess = Object.keys(updatedLocalValues);

          // First, identify and build a map of min/max pairs for 'between' operators
          const betweenMinMaxPairs = {};
          keysToProcess.forEach((key) => {
            if (key.endsWith("-min") || key.endsWith("-max")) {
              const baseKey = key.replace(/-min$/, "").replace(/-max$/, "");
              if (!betweenMinMaxPairs[baseKey]) {
                betweenMinMaxPairs[baseKey] = { min: null, max: null };
              }
              if (key.endsWith("-min")) betweenMinMaxPairs[baseKey].min = key;
              if (key.endsWith("-max")) betweenMinMaxPairs[baseKey].max = key;
            }
          });

          // Find and shift regular condition keys for rows after the one being duplicated
          const keysToShift = keysToProcess.filter((key) => {
            // Exclude -min and -max keys as they'll be handled separately
            if (key.endsWith("-min") || key.endsWith("-max")) return false;

            // Handle keys in format: "rowIndex-columnIndex-ruleIndex"
            const parts = key.split("-");
            const rowIndexPart = parseInt(parts[0], 10);
            // Only affect rows AFTER the current index (since we're duplicating)
            return !isNaN(rowIndexPart) && rowIndexPart > index;
          });

          // Sort keys in descending order of row index to avoid overwriting during shift
          keysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[0], 10);
            const rowB = parseInt(b.split("-")[0], 10);
            return rowB - rowA;
          });

          keysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[0], 10);
            const newRowIndex = oldRowIndex + 1;
            const restOfKey = parts.slice(1).join("-");
            const newKey = `${newRowIndex}-${restOfKey}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Find and shift ALL result column keys for rows after the one being duplicated
          const resultKeysToShift = keysToProcess.filter((key) => {
            if (key.startsWith("result-")) {
              // Handle keys that start with "result-rowIndex-"
              const parts = key.split("-");
              if (parts.length >= 2) {
                const rowIndex = parseInt(parts[1], 10);
                // Only affect rows AFTER the current index
                return !isNaN(rowIndex) && rowIndex > index;
              }
            }
            return false;
          });

          resultKeysToShift.sort((a, b) => {
            const rowA = parseInt(a.split("-")[1], 10);
            const rowB = parseInt(b.split("-")[1], 10);
            return rowB - rowA;
          });

          resultKeysToShift.forEach((key) => {
            const parts = key.split("-");
            const oldRowIndex = parseInt(parts[1], 10);
            const newRowIndex = oldRowIndex + 1;
            // Reconstruct the key with the new row index
            const newKey = `result-${newRowIndex}-${parts.slice(2).join("-")}`;

            updatedLocalValues[newKey] = updatedLocalValues[key];
            delete updatedLocalValues[key]; // Remove the old key
          });

          // Handle 'between' min/max values by updating special keys
          Object.entries(betweenMinMaxPairs).forEach(([baseKey, pair]) => {
            const baseKeyParts = baseKey.split("-");
            if (baseKeyParts.length >= 2) {
              const rowIdx = parseInt(baseKeyParts[0], 10);

              // Only affect rows AFTER the current index
              if (rowIdx > index) {
                const newRowIdx = rowIdx + 1;
                const restOfBaseKey = baseKeyParts.slice(1).join("-");
                const newBaseKey = `${newRowIdx}-${restOfBaseKey}`;

                // Shift min key if it exists
                if (pair.min && updatedLocalValues[pair.min] !== undefined) {
                  const newMinKey = `${newBaseKey}-min`;
                  updatedLocalValues[newMinKey] = updatedLocalValues[pair.min];
                  delete updatedLocalValues[pair.min];
                }

                // Shift max key if it exists
                if (pair.max && updatedLocalValues[pair.max] !== undefined) {
                  const newMaxKey = `${newBaseKey}-max`;
                  updatedLocalValues[newMaxKey] = updatedLocalValues[pair.max];
                  delete updatedLocalValues[pair.max];
                }
              }
            }
          });

          // Additionally, copy between operator values from the source row to the duplicated row
          Object.entries(betweenMinMaxPairs).forEach(([baseKey, pair]) => {
            const baseKeyParts = baseKey.split("-");
            if (
              baseKeyParts.length >= 2 &&
              parseInt(baseKeyParts[0], 10) === index
            ) {
              const sourceRowIdx = index;
              const targetRowIdx = index + 1;
              const restOfBaseKey = baseKeyParts.slice(1).join("-");

              const sourceBaseKey = `${sourceRowIdx}-${restOfBaseKey}`;
              const targetBaseKey = `${targetRowIdx}-${restOfBaseKey}`;

              // Copy min value if it exists
              if (pair.min && updatedLocalValues[pair.min] !== undefined) {
                const targetMinKey = `${targetBaseKey}-min`;
                updatedLocalValues[targetMinKey] = updatedLocalValues[pair.min];
              }

              // Copy max value if it exists
              if (pair.max && updatedLocalValues[pair.max] !== undefined) {
                const targetMaxKey = `${targetBaseKey}-max`;
                updatedLocalValues[targetMaxKey] = updatedLocalValues[pair.max];
              }

              // Also copy the main value
              if (updatedLocalValues[sourceBaseKey] !== undefined) {
                updatedLocalValues[targetBaseKey] =
                  updatedLocalValues[sourceBaseKey];
              }
            }
          });

          // Update the localInputValues state
          setLocalInputValues(updatedLocalValues);

          // Insert duplicated row after the original
          updatedConditions.splice(index + 1, 0, duplicatedRow);

          // Update priorities for all rows after the insertion
          for (let i = index + 2; i < updatedConditions.length; i++) {
            updatedConditions[i].priority = i + 1;
          }

          // Update the conditions with the new array
          onUpdate(updatedConditions);
        } catch (error) {
          console.error("[duplicate] Error:", error);
        }
        break;

      case "delete":
        try {
          console.log(`[delete] Starting with index=${index}`);
          // Create a deep clone of conditions
          const updatedConditions = JSON.parse(JSON.stringify(conditions));

          // Remove the row at specified index
          updatedConditions.splice(index, 1);

          // Update priority for the remaining conditions after deletion
          updatedConditions.forEach((condition, idx) => {
            condition.priority = idx + 1;
          });

          // Clean up localInputValues for the deleted row
          const updatedLocalValues = { ...localInputValues };

          // Track all keys that need to be processed
          const keysToProcess = Object.keys(updatedLocalValues);

          // First, identify and build a map of min/max pairs for 'between' operators
          const betweenMinMaxPairs = {};
          keysToProcess.forEach((key) => {
            if (key.endsWith("-min") || key.endsWith("-max")) {
              const baseKey = key.replace(/-min$/, "").replace(/-max$/, "");
              if (!betweenMinMaxPairs[baseKey]) {
                betweenMinMaxPairs[baseKey] = { min: null, max: null };
              }
              if (key.endsWith("-min")) betweenMinMaxPairs[baseKey].min = key;
              if (key.endsWith("-max")) betweenMinMaxPairs[baseKey].max = key;
            }
          });

          // Identify and remove all keys associated with the deleted row
          keysToProcess.forEach((key) => {
            const parts = key.split("-");
            const rowIdx = parseInt(parts[0], 10);

            // Delete keys for the deleted row
            if (rowIdx === index) {
              delete updatedLocalValues[key];
            }
            // Shift keys for rows after the deleted one
            else if (rowIdx > index) {
              const newRowIdx = rowIdx - 1;
              const restOfKey = parts.slice(1).join("-");
              const newKey = `${newRowIdx}-${restOfKey}`;

              updatedLocalValues[newKey] = updatedLocalValues[key];
              delete updatedLocalValues[key];
            }
          });

          // Handle result column values which have a different format (result-rowIndex-key)
          keysToProcess.forEach((key) => {
            if (key.startsWith("result-")) {
              const parts = key.split("-");
              if (parts.length >= 3) {
                const rowIdx = parseInt(parts[1], 10);

                // Delete keys for the deleted row
                if (rowIdx === index) {
                  delete updatedLocalValues[key];
                }
                // Shift keys for rows after the deleted one
                else if (rowIdx > index) {
                  const newRowIdx = rowIdx - 1;
                  // Keep the "result-" prefix and the key parts
                  const newKey = `result-${newRowIdx}-${parts
                    .slice(2)
                    .join("-")}`;

                  updatedLocalValues[newKey] = updatedLocalValues[key];
                  delete updatedLocalValues[key];
                }
              }
            }
          });

          // Handle 'between' min/max values by updating base keys and special keys
          Object.entries(betweenMinMaxPairs).forEach(([baseKey, pair]) => {
            const baseKeyParts = baseKey.split("-");
            if (baseKeyParts.length >= 2) {
              const rowIdx = parseInt(baseKeyParts[0], 10);

              if (rowIdx > index) {
                const newRowIdx = rowIdx - 1;
                const restOfBaseKey = baseKeyParts.slice(1).join("-");
                const newBaseKey = `${newRowIdx}-${restOfBaseKey}`;

                // Shift min key if it exists
                if (pair.min && updatedLocalValues[pair.min] !== undefined) {
                  const newMinKey = `${newBaseKey}-min`;
                  updatedLocalValues[newMinKey] = updatedLocalValues[pair.min];
                  delete updatedLocalValues[pair.min];
                }

                // Shift max key if it exists
                if (pair.max && updatedLocalValues[pair.max] !== undefined) {
                  const newMaxKey = `${newBaseKey}-max`;
                  updatedLocalValues[newMaxKey] = updatedLocalValues[pair.max];
                  delete updatedLocalValues[pair.max];
                }
              }
            }
          });

          // Update the localInputValues state
          setLocalInputValues(updatedLocalValues);

          // Update the conditions with the new array
          onUpdate(updatedConditions);
          console.log(`[delete] Row deleted successfully`);
        } catch (error) {
          console.error("[delete] Error:", error);
        }
        break;

      case "toggle_enabled":
        handleToggleEnabled(index);
        break;

      default:
        console.error(`Unknown row action: ${action}`);
    }

    // Close the row actions menu after any action
    setActiveRowMenu(null);
  };

  const createDefaultRow = () => {
    // Initialize result object with empty strings instead of null for each result column
    const initialResult = {};
    columnProperties.forEach((prop) => {
      if (prop.isResult && prop.key) {
        initialResult[prop.key] = ""; // Using empty string instead of null
      }
    });

    return {
      id: Date.now(),
      priority: 1,
      enabled: true,
      decision_id: sessionStorage.getItem("type_id") || null, // Add decision_id
      conditions: [
        {
          operator: "all",
          rules: [
            {
              id: Date.now() + 1,
              property: "",
              source_type: "",
              operator: "",
              value: "",
              data_type: "String",
            },
          ],
        },
      ],
      result: initialResult, // Initialize with proper structure
    };
  };

  // Update createNewRowWithSharedProperties to handle group/result columns correctly
  const createNewRowWithSharedProperties = (priority) => {
    // Create a new row with shared properties from existing rows
    // Add a timestamp marker to identify newly created rows
    const creationTimestamp = Date.now();

    // Initialize result object with empty strings instead of null for each result column
    const initialResult = {};
    columnProperties.forEach((prop) => {
      if (prop.isResult && prop.key) {
        initialResult[prop.key] = ""; // Using empty string instead of null
      }
    });

    return {
      id: creationTimestamp,
      priority,
      enabled: true,
      decision_id: sessionStorage.getItem("type_id") || null, // Add decision_id
      isNewRow: true, // Mark as a new row (this is fine at row level)
      createdAt: creationTimestamp, // Add creation timestamp (this is fine at row level)
      conditions: [
        {
          operator: columnProperties[0]?.operator || "all",
          rules: columnProperties
            // Filter out result columns when building condition rules
            .filter((prop) => !prop.isResult)
            .map((prop, idx) => {
              // Check if this column is a group
              if (prop.is_group) {
                // For group columns, create a structure similar to existing groups but with empty values
                const firstRowGroupRule =
                  conditions[0]?.conditions?.[0]?.rules?.[idx];
                const innerRuleCount = firstRowGroupRule?.rules?.length || 0;

                // Create a new group rule with the same operator as existing ones
                return {
                  id:
                    creationTimestamp + idx + Math.floor(Math.random() * 10000),
                  operator: firstRowGroupRule?.operator || "all", // Preserve the group operator
                  is_group: true, // This flag is okay to keep
                  rules: Array.from(
                    { length: innerRuleCount },
                    (_, innerIdx) => {
                      // For each inner rule, copy property, source_type, data_type, and operator from template
                      // but initialize value as empty
                      const templateInnerRule =
                        firstRowGroupRule?.rules?.[innerIdx];
                      return {
                        id:
                          creationTimestamp +
                          idx +
                          innerIdx +
                          Math.floor(Math.random() * 10000),
                        property: templateInnerRule?.property || "",
                        source_type: templateInnerRule?.source_type || "",
                        data_type: templateInnerRule?.data_type || "String",
                        operator: "", // Don't preserve operator for new rows
                        value: "", // Start with empty value
                        // Removing isNewRule flag as requested
                      };
                    }
                  ),
                };
              } else {
                // For regular columns, create a simple rule with property from column properties
                return {
                  id:
                    creationTimestamp + idx + Math.floor(Math.random() * 10000),
                  property: prop.property || "",
                  source_type: prop.source_type || "",
                  data_type: prop.data_type || "String",
                  operator: "",
                  value: "",
                  // Removing is_group: false as it's not needed for regular conditions
                };
              }
            }),
        },
      ],
      result: initialResult, // Initialize with proper structure
    };
  };

  const handleAddRow = () => {
    // Create a new row with the next priority
    const nextPriority = conditions.length + 1;
    const newRow = createNewRowWithSharedProperties(nextPriority);

    // Create a deep clone of existing conditions to avoid reference issues
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Add the new row at the end
    updatedConditions.push(newRow);

    // The new row's index will be the length of the current conditions array
    const newRowIndex = conditions.length;

    // Clear any potential cached values for the new row index
    const updatedLocalValues = { ...localInputValues };

    // Clear regular cell values
    const keysToDelete = Object.keys(updatedLocalValues).filter((key) => {
      const parts = key.split("-");
      return parts[0] === newRowIndex.toString();
    });

    keysToDelete.forEach((key) => {
      delete updatedLocalValues[key];
    });

    // Clear result values (which use a different key format)
    const resultKeysToDelete = Object.keys(updatedLocalValues).filter((key) => {
      return (
        key.startsWith("result-") &&
        key.split("-")[1] === newRowIndex.toString()
      );
    });

    resultKeysToDelete.forEach((key) => {
      delete updatedLocalValues[key];
    });

    setLocalInputValues(updatedLocalValues);

    // Update the state
    onUpdate(updatedConditions);
  };

  const handleAddResult = () => {
    // Implementation for adding a result
  };

  const handleAddColumn = () => {
    if (conditions.length === 0) {
      onUpdate([createDefaultRow()]);
      return;
    }

    const newConditions = JSON.parse(JSON.stringify(conditions));

    // Add the new rule to the first condition's rules array for each row
    newConditions.forEach((condition, idx) => {
      if (condition.conditions[0] && condition.conditions[0].rules) {
        condition.conditions[0].rules.push({
          id: Date.now() + idx + Math.floor(Math.random() * 1000),
          property: "",
          source_type: "",
          operator: "",
          value: "",
          data_type: "String", // Default data type
        });
      }
    });

    // Update conditions using onUpdate directly
    onUpdate(newConditions);
  };

  const handleDeleteColumn = (columnIndex) => {
    // Check if the column to delete exists and get its properties
    const colToDelete = columnProperties[columnIndex];
    if (!colToDelete) return; // Exit if column doesn't exist

    // Create new arrays based on the current state
    const newColumnProperties = columnProperties.filter(
      (_, idx) => idx !== columnIndex
    );
    let updatedConditions = JSON.parse(JSON.stringify(conditions)); // Copy conditions

    // --- Update handleDeleteColumn to handle result columns ---
    if (colToDelete.isResult) {
      // If it's a result column, just remove from properties
      setColumnProperties(newColumnProperties);

      // Optionally: Iterate conditions and delete the key from each row's result object
      const resultKey = colToDelete.key;
      if (resultKey) {
        // Use produce for safer immutable update
        const updatedConditionsWithDeletedResult = produce(
          conditions,
          (draft) => {
            draft.forEach((row) => {
              if (row.result && row.result[resultKey] !== undefined) {
                // Check singular 'result'
                delete row.result[resultKey];
              }
            });
          }
        );
        onUpdate(updatedConditionsWithDeletedResult); // Update conditions if key was deleted
        updatedConditions = updatedConditionsWithDeletedResult; // Keep local copy in sync
      }

      // Also clear local input values associated with this result column
      const updatedLocalValues = { ...localInputValues };
      updatedConditions.forEach((_, rIndex) => {
        const localKey = `result-${rIndex}-${resultKey}`;
        if (updatedLocalValues[localKey] !== undefined) {
          delete updatedLocalValues[localKey];
        }
      });
      setLocalInputValues(updatedLocalValues);
    } else {
      // Existing logic for condition/group columns
      updatedConditions.forEach((condition) => {
        if (
          condition.conditions &&
          condition.conditions[0] &&
          condition.conditions[0].rules
        ) {
          condition.conditions[0].rules.splice(columnIndex, 1);
        }
      });

      // Update local state for remaining columns
      const updatedLocalValues = { ...localInputValues };
      // Shift keys down
      for (let r = 0; r < updatedConditions.length; r++) {
        for (let c = columnIndex; c < newColumnProperties.length; c++) {
          const oldKeyBase = `${r}-${c + 1}`;
          const newKeyBase = `${r}-${c}`;
          const colProp = newColumnProperties[c]; // Check the property of the *new* column index c

          if (colProp?.is_group) {
            const innerRuleCount =
              conditions[0]?.conditions?.[0]?.rules?.[c + 1]?.rules?.length ||
              0;
            for (let innerIdx = 0; innerIdx < innerRuleCount; innerIdx++) {
              const oldKey = `${oldKeyBase}-${innerIdx}`;
              const newKey = `${newKeyBase}-${innerIdx}`;
              if (updatedLocalValues[oldKey] !== undefined) {
                updatedLocalValues[newKey] = updatedLocalValues[oldKey];
                delete updatedLocalValues[oldKey];
              }
            }
          } else if (!colProp?.isResult) {
            // Ensure it's not a result col we are shifting into
            const oldKey = `${oldKeyBase}-0`;
            const newKey = `${newKeyBase}-0`;
            if (updatedLocalValues[oldKey] !== undefined) {
              updatedLocalValues[newKey] = updatedLocalValues[oldKey];
              delete updatedLocalValues[oldKey];
            }
          }
        }
        // Clear keys for the last column that was removed
        const removedColKeyBase = `${r}-${newColumnProperties.length}`;
        const colPropRemoved = columnProperties[columnIndex]; // Property of the actually removed column
        if (colPropRemoved?.is_group) {
          const innerRuleCount =
            conditions[0]?.conditions?.[0]?.rules?.[columnIndex]?.rules
              ?.length || 0;
          for (let innerIdx = 0; innerIdx < innerRuleCount; innerIdx++) {
            delete updatedLocalValues[`${removedColKeyBase}-${innerIdx}`];
          }
        } else if (!colPropRemoved?.isResult) {
          delete updatedLocalValues[`${removedColKeyBase}-0`];
        }
      }
      setLocalInputValues(updatedLocalValues);

      // Apply changes
      setColumnProperties(newColumnProperties);
      onUpdate(updatedConditions);
    }
  };

  const handleColumnPropertyChange = (columnIndex, property, value) => {
    // Create new immutable references to trigger proper React updates
    const newColumnProperties = JSON.parse(JSON.stringify(columnProperties));
    // Only copy conditions if we actually need to modify them (for property changes)
    let newConditions = null;

    // If changing operator, ONLY update the parent condition operator in the conditions state
    if (property === "operator") {
      // We need to modify conditions, so create a deep copy
      newConditions = JSON.parse(JSON.stringify(conditions));

      // Update operator for the first condition group in ALL rows
      // This applies the AND/OR logic across rows for this column
      for (let rowIndex = 0; rowIndex < newConditions.length; rowIndex++) {
        if (newConditions[rowIndex].conditions[0]) {
          newConditions[rowIndex].conditions[0].operator = value;
        }
      }

      // Update ONLY the main conditions data
      onUpdate(newConditions); // Update main data
      return; // Exit early
    }
    // If changing property, update column properties AND the conditions data
    else if (property === "property") {
      // We need to modify conditions, so create a deep copy now
      newConditions = JSON.parse(JSON.stringify(conditions));

      // For property changes, find the attribute to get its source_type
      const selectedAttribute = inputAttributes.find(
        (attr) => attr.name === value
      );
      const source_type = selectedAttribute
        ? selectedAttribute.source_type
        : "";
      const dataType = selectedAttribute
        ? selectedAttribute.data_type
        : "String";

      console.log(
        `Selected property "${value}" with source_type "${source_type}" and data_type "${dataType}"`
      );

      // Update both property and source_type in column properties
      newColumnProperties[columnIndex] = {
        ...newColumnProperties[columnIndex],
        property: value,
        source_type: source_type,
        data_type: dataType,
      };

      // Update property, source_type and data_type in the corresponding rule for every row
      for (let i = 0; i < newConditions.length; i++) {
        const rule = newConditions[i]?.conditions?.[0]?.rules?.[columnIndex];

        if (rule) {
          rule.property = value;
          rule.source_type = source_type;
          rule.data_type = dataType;

          // --- Only reset operator/value if it's NOT a group column ---
          if (!rule.is_group) {
            rule.operator = "";
            rule.value = "";

            // Also clear local input values for this column (only if not a group)
            // --- Use key consistent with renderValueInput (includes ruleIndex 0) ---
            const valueKey = `${i}-${columnIndex}-0`;
            setLocalInputValues((prev) => {
              const updated = { ...prev };
              delete updated[valueKey];
              return updated;
            });
            // Prevent focus restoration after property change
            window.lastModifiedInput = null;
          }
          // -----------------------------------------------------------
        }
      }
      // Update column properties state
      setColumnProperties(newColumnProperties);
      // Update the main conditions data as well
      onUpdate(newConditions);
    } else {
      // For any other potential future properties (unlikely needed now)
      if (newColumnProperties[columnIndex]) {
        newColumnProperties[columnIndex] = {
          ...newColumnProperties[columnIndex],
          [property]: value,
        };
      }
      // Only update column properties state
      setColumnProperties(newColumnProperties);
      // DO NOT CALL onUpdate unless condition data changes
    }
  };

  const handleOperatorChange = (
    rowIndex,
    columnIndex,
    operatorKey,
    ruleIndex = 0
  ) => {
    const newConditions = JSON.parse(JSON.stringify(conditions));

    // Access the rule in the first condition's rules array
    if (
      newConditions[rowIndex] &&
      newConditions[rowIndex].conditions[0] &&
      newConditions[rowIndex].conditions[0].rules &&
      newConditions[rowIndex].conditions[0].rules[columnIndex]
    ) {
      const rule = newConditions[rowIndex].conditions[0].rules[columnIndex];
      const hideValueField =
        operatorKey &&
        (operatorKey.toLowerCase() === "any" ||
          operatorKey.toLowerCase() === "exists");

      rule.operator = operatorKey;

      // --- Reset value correctly based on new operator ---
      let resetValue = "";
      if (
        operatorKey.toLowerCase() === "between" ||
        operatorKey.toLowerCase() === "in" ||
        operatorKey.toLowerCase() === "not in"
      ) {
        resetValue = [];
      }
      rule.value = resetValue;
      // ---------------------------------------------------

      // Also reset the local input value using correct key format
      const valueKey = `${rowIndex}-${columnIndex}-0`; // Use correct key with ruleIndex 0
      setLocalInputValues((prev) => {
        const updated = { ...prev };
        delete updated[valueKey]; // Use delete for cleaner state
        // If operator was 'between' or 'in', delete specific keys too if they exist
        delete updated[`${valueKey}-min`];
        delete updated[`${valueKey}-max`];
        delete updated[`${valueKey}-list`];
        return updated;
      });

      // Remove initialization logic here as it's handled by the value reset above
      /*
      // Initialize appropriate value structure for certain operators
      if (!hideValueField) {
        const dataType = rule.data_type || "String";

        if (operatorKey.toLowerCase() === "between") {
          rule.value = []; // Initialize as empty array
        } else if (
          operatorKey.toLowerCase() === "in" ||
          operatorKey.toLowerCase() === "not in"
        ) {
          rule.value = [];
        }
      }
      */

      onUpdate(newConditions);
    }
  };

  // Add the missing inputAttributes state
  const [operators, setOperators] = useState({});
  const [inputAttributes, setInputAttributes] = useState([]);
  const [localInputValues, setLocalInputValues] = useState({});

  // Add an effect to maintain focus across re-renders
  // const valueInputRefs = useRef({});

  // Effect to restore focus after updates
  // useEffect(() => {
  //   // Check if we have a lastModifiedInput and restore focus to it
  //   if (window.lastModifiedInput && window.lastModifiedInput.refKey) {
  //     const refKey = window.lastModifiedInput.refKey;
  //     const inputElement = valueInputRefs.current[refKey];

  //     if (inputElement && inputElement !== document.activeElement) {
  //       // Focus the element
  //       inputElement.focus();

  //       // Only try to set selection if the element supports it
  //       // Number inputs, date inputs, etc. don't support selection range
  //       const supportsSelection =
  //         inputElement.type === "text" ||
  //         inputElement.type === "textarea" ||
  //         inputElement.type === "search" ||
  //         inputElement.type === "tel" ||
  //         inputElement.type === "url" ||
  //         inputElement.type === "password" ||
  //         inputElement.type === undefined;

  //       if (
  //         supportsSelection &&
  //         typeof inputElement.setSelectionRange === "function" &&
  //         inputElement.selectionStart !== undefined &&
  //         inputElement.selectionEnd !== undefined
  //       ) {
  //         try {
  //           const selectionStart = inputElement.selectionStart;
  //           const selectionEnd = inputElement.selectionEnd;
  //           inputElement.setSelectionRange(selectionStart, selectionEnd);
  //         } catch (error) {
  //           console.log(
  //             "Selection range not supported for this input type:",
  //             inputElement.type
  //           );
  //         }
  //       }
  //     }
  //   }
  // });

  // Complete replacement of renderValueInput to maintain focus using refs
  const renderValueInput = (
    rowIndex,
    columnIndex,
    rule,
    columnProp,
    disabled,
    ruleIndex = 0,
    mainValueChangeHandler // <-- Added explicit prop
  ) => {
    // Define a placeholder renderWithAttributeButton that will be properly defined later
    // This avoids the "Cannot access before initialization" error
    let renderWithAttributeButton = (inputElement) => inputElement; // Simple passthrough by default

    // *** CRITICAL FIX: Check for attribute data first, before anything else ***
    // Get the value from conditions state directly for result columns
    if (columnProp?.isResult) {
      const resultObj = conditions[rowIndex]?.result?.[columnProp.key];

      // Debugging - log all result cell values to diagnose issues
      console.log(
        `Detailed result cell check [${rowIndex}-${columnIndex}] ${columnProp.key}:`,
        {
          resultValue: resultObj,
          valueType: typeof resultObj,
          isObject: typeof resultObj === "object" && resultObj !== null,
          hasIsAttributeData: resultObj?.isAttributeData === true,
          localInputValue:
            localInputValues[`result-${rowIndex}-${columnProp.key}`],
        }
      );

      // Check for attribute data in state AND local values
      const isAttributeDataInState =
        resultObj &&
        typeof resultObj === "object" &&
        resultObj.isAttributeData === true &&
        resultObj.value !== undefined;

      const localValue =
        localInputValues[`result-${rowIndex}-${columnProp.key}`];
      let isAttributeLocalValue = false;

      // Try to parse local value if it's a string that might be JSON
      if (typeof localValue === "string" && localValue.startsWith("{")) {
        try {
          const parsedLocal = JSON.parse(localValue);
          isAttributeLocalValue = parsedLocal?.isAttributeData === true;
        } catch (e) {
          // Not JSON, ignore
        }
      }

      // If attribute data is detected either in state or local values
      if (isAttributeDataInState || isAttributeLocalValue) {
        const displayValue = isAttributeDataInState
          ? resultObj.value
          : typeof localValue === "string" && !localValue.startsWith("{")
          ? localValue
          : "Attribute Data";

        console.log(
          `Rendering attribute data text input for [${rowIndex}-${columnIndex}]:`,
          {
            displayValue,
            source: isAttributeDataInState ? "state" : "localValue",
          }
        );

        // Always render attribute data as text input regardless of column's data_type
        return renderWithAttributeButton(
          <input
            key={`attr-data-${rowIndex}-${columnIndex}`}
            value={displayValue || ""}
            disabled={true}
            className={`w-full py-3 px-4 ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            } border border-gray-300 rounded-md`} // Added stronger border to highlight attribute data
            type="text"
            readOnly
          />
        );
      }
    }

    // Continue with regular input rendering for non-attribute data values
    // --- Refetch rule for groups to ensure freshness ---
    const actualRule = columnProp?.is_group
      ? conditions[rowIndex]?.conditions?.[0]?.rules?.[columnIndex]?.rules?.[
          ruleIndex
        ]
      : rule;
    // Handle cases where rule might be null or undefined, especially for results
    const safeRule = actualRule || {}; // Use empty object if rule is not provided
    // -------------------------------------------------

    // Determine dataType and operator based on whether it's a result column
    const dataType = columnProp?.isResult
      ? columnProp.resultDataType || columnProp.data_type || "String"
      : safeRule?.data_type || "String";
    const operator = columnProp?.isResult ? "" : safeRule?.operator; // No operator for results

    // Determine key based on whether it's a result column
    const valueKey = columnProp?.isResult
      ? `result-${rowIndex}-${columnProp.key}`
      : `${rowIndex}-${columnIndex}-${ruleIndex}`;

    // For result columns, check if the value is an attribute data object
    let currentValue = localInputValues[valueKey];
    let isAttributeDataValue = false;

    // Debug current state of the cell
    if (columnProp?.isResult) {
      console.log(
        `Checking result cell [${rowIndex}-${columnIndex}] for attribute data:`,
        {
          localValue: currentValue,
          resultInState: conditions[rowIndex]?.result?.[columnProp.key],
        }
      );
    }

    if (currentValue === undefined) {
      if (columnProp?.isResult) {
        const resultValue = conditions[rowIndex]?.result?.[columnProp.key];

        // If it's an attribute data object, display the attribute name
        if (resultValue && typeof resultValue === "object") {
          // Check if it's an attribute data object with isAttributeData flag
          if (
            resultValue.isAttributeData === true &&
            resultValue.value !== undefined
          ) {
            console.log(
              `Found attribute data in state for ${valueKey}:`,
              resultValue
            );
            currentValue = resultValue.value;
            isAttributeDataValue = true;
          } else if (resultValue.value !== undefined) {
            // It has a value property but might not be explicitly marked as attribute data
            currentValue = resultValue.value;
          } else {
            // It's an object but not our attribute data format
            currentValue = JSON.stringify(resultValue);
          }
        } else {
          currentValue = resultValue ?? "";
        }
      } else {
        currentValue = safeRule?.value ?? "";
      }
    } else if (columnProp?.isResult) {
      // Check if the current local value is a stringified attribute data object
      try {
        if (typeof currentValue === "string" && currentValue.startsWith("{")) {
          const parsedValue = JSON.parse(currentValue);
          if (parsedValue && typeof parsedValue === "object") {
            if (
              parsedValue.isAttributeData === true &&
              parsedValue.value !== undefined
            ) {
              console.log(
                `Parsed attribute data from JSON for ${valueKey}:`,
                parsedValue
              );
              currentValue = parsedValue.value;
              isAttributeDataValue = true;
            } else if (parsedValue.value !== undefined) {
              // Has value property but not explicitly marked as attribute data
              currentValue = parsedValue.value;
            }
          }
        } else if (typeof currentValue === "object" && currentValue !== null) {
          if (
            currentValue.isAttributeData === true &&
            currentValue.value !== undefined
          ) {
            console.log(
              `Direct attribute data object for ${valueKey}:`,
              currentValue
            );
            currentValue = currentValue.value;
            isAttributeDataValue = true;
          } else if (currentValue.value !== undefined) {
            // Has value property but not explicitly marked as attribute data
            currentValue = currentValue.value;
          } else {
            // It's an object but not our attribute data format
            currentValue = JSON.stringify(currentValue);
          }
        }
      } catch (e) {
        // Not a valid JSON string, keep as is
        console.log(
          `Error parsing possible attribute data JSON for ${valueKey}:`,
          e.message
        );
      }
    }

    // Log detected attribute data
    if (isAttributeDataValue) {
      console.log(
        `Detected attribute data for cell [${rowIndex}-${columnIndex}]: `,
        {
          displayValue: currentValue,
          isAttributeData: isAttributeDataValue,
        }
      );
    }

    // Determine mainValueChangeHandler based on whether it's a result column
    if (columnProp?.isResult && !mainValueChangeHandler) {
      // If result column and no handler passed, use handleResultValueChange
      mainValueChangeHandler = (rowIdx, colIdx, val, ruleIdx) => {
        console.log(
          "Using result handler:",
          rowIdx,
          columnProp?.key,
          val,
          dataType // Use the corrected dataType value
        );
        if (columnProp?.key) {
          handleResultValueChange(
            rowIdx,
            colIdx, // Pass columnIndex instead of key
            val
          );
        }
      };
    } else if (columnProp?.is_group && !mainValueChangeHandler) {
      // If group column and no handler passed, use handleInnerValueChange
      mainValueChangeHandler = (rowIdx, colIdx, val, innerRuleIdx) => {
        console.log("Using group handler with args:", {
          rowIdx,
          colIdx,
          val,
          innerRuleIdx,
        });
        // FIXED: Make sure parameters are in the correct order for handleInnerValueChange
        // handleInnerValueChange expects (rowIndex, columnIndex, innerRuleIndex, newValue)
        handleInnerValueChange(rowIdx, colIdx, innerRuleIdx, val);
      };
    } else if (!mainValueChangeHandler) {
      // Default to handleValueChange for regular condition cells
      mainValueChangeHandler = (rowIdx, colIdx, val, ruleIdx) => {
        console.log("Using default handler:", rowIdx, colIdx, val, ruleIdx);
        handleValueChange(rowIdx, colIdx, val, ruleIdx);
      };
    }

    // Helper function to handle change based on input type
    const handleInputChange = (value) => {
      // Update local state ONLY
      setLocalInputValues((prev) => ({ ...prev, [valueKey]: value }));

      // Mark as modified immediately on input change, not waiting for blur
      sessionStorage.setItem("conditionsModified", "true");
      // Dispatch event for immediate UI update
      window.dispatchEvent(
        new CustomEvent("conditionsModified", { detail: true })
      );

      // REMOVED call to main handler
      /* if (columnProp?.isResult) {
        handleResultValueChange(rowIndex, columnProp.key, value, dataType);
      } else if (columnProp?.is_group) {
        handleInnerValueChange(rowIndex, columnIndex, ruleIndex, value);
      } else {
        handleValueChange(rowIndex, columnIndex, value, ruleIndex);
      } */
    };

    // --- Add console log for debugging group data type ---
    if (columnProp?.is_group) {
      console.log(
        `Group Cell Render [${rowIndex}-${columnIndex}-${ruleIndex}]: InnerRule=`,
        safeRule,
        `Derived DataType=`,
        dataType
      );
    }
    // ---------------------------------------------------

    const commonProps = {
      key: valueKey,
      value: currentValue,
      disabled: disabled,
      onChange: (e) => handleInputChange(e.target.value),
      className:
        "w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500",
    };

    // Check if there's an attribute data for this result cell
    const hasAttributeData =
      columnProp?.isResult &&
      conditions[rowIndex]?.result &&
      typeof conditions[rowIndex].result[columnProp.key] === "object" &&
      conditions[rowIndex].result[columnProp.key]?.isAttributeData;

    // Now redefine renderWithAttributeButton with its full implementation
    renderWithAttributeButton = (inputElement) => {
      if (!columnProp?.isResult) return inputElement;

      // If this is an attribute data value, always use a text input
      if (isAttributeDataValue) {
        const attributeValueInput = (
          <input
            key={commonProps.key}
            value={currentValue}
            disabled={true}
            className={`w-full py-3 px-4 ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            } border border-gray-300 rounded-md`}
            type="text" // Always use text type for attribute data to avoid validation issues
            readOnly
          />
        );

        return (
          <div className="flex items-center">
            <div className="flex-grow pr-2 border-r border-blue-300">
              {attributeValueInput}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenAttributeSelector(rowIndex, columnIndex);
              }}
              className={`ml-2 p-1 rounded ${
                theme === "dark"
                  ? "hover:bg-gray-600 text-blue-400"
                  : "hover:bg-gray-200 text-blue-600"
              }`}
              title="Select Attribute Data"
              type="button"
              disabled={disabled}
            >
              <DatabaseZap size={16} />
            </button>
          </div>
        );
      }

      // Otherwise, render the regular input with the attribute button
      return (
        <div className="flex items-center">
          <div
            className={`flex-grow ${
              hasAttributeData ? "pr-2 border-r border-blue-300" : ""
            }`}
          >
            {inputElement}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenAttributeSelector(rowIndex, columnIndex);
            }}
            className={`ml-2 p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-600 text-blue-400"
                : "hover:bg-gray-200 text-blue-600"
            }`}
            title="Select Attribute Data"
            type="button"
            disabled={disabled}
          >
            <DatabaseZap size={16} />
          </button>
        </div>
      );
    };

    // --- Special handling for "between" operator ---
    if (operator === "between") {
      let [minValue, maxValue] = ["", ""];
      let currentDisplayValue = "";

      // Create consistent keys for min and max values
      const minInputKey = `${valueKey}-min`;
      const maxInputKey = `${valueKey}-max`;

      // Check local state first (if available) to avoid render flicker
      if (localInputValues[valueKey] !== undefined) {
        currentDisplayValue = localInputValues[valueKey];
        const parts = String(currentDisplayValue).split(",");
        if (parts.length >= 2) {
          minValue = parts[0] || "";
          maxValue = parts[1] || "";
        }
      }
      // If no local state or if it's empty, use rule values from the condition state
      else if (Array.isArray(safeRule.value) && safeRule.value.length >= 2) {
        minValue = safeRule.value[0] ?? "";
        maxValue = safeRule.value[1] ?? "";
        // DON'T update state here - it will cause re-renders
        // Instead, we'll just use these values for display
      }

      // Use these values locally without updating state in the render function
      // State updates only happen within event handlers (onChange, onBlur)

      const handleRangeChange = (e, isMin) => {
        let currentMin = minValue;
        let currentMax = maxValue;
        if (isMin) {
          currentMin = e.target.value;
        } else {
          currentMax = e.target.value;
        }
        const newDisplayValue = `${currentMin},${currentMax}`;

        // Safe to update state in event handlers
        setLocalInputValues((prev) => ({
          ...prev,
          [valueKey]: newDisplayValue,
          // We can still update the individual min/max values for redundancy
          [minInputKey]: currentMin,
          [maxInputKey]: currentMax,
        }));

        // Mark as modified immediately on range input change
        sessionStorage.setItem("conditionsModified", "true");
        // Dispatch event for immediate UI update
        window.dispatchEvent(
          new CustomEvent("conditionsModified", { detail: true })
        );
      };

      const getInputType = () => {
        switch (dataType) {
          case "Numeric":
            return "number";
          case "Date":
            return "date";
          case "DateTime":
            return "datetime-local";
          default:
            return "text";
        }
      };

      // --- Render differently based on dataType for between ---
      if (dataType === "DateTime" || dataType === "Date") {
        return (
          <div
            className={`flex flex-col space-y-2 ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
          >
            <input
              key={minInputKey}
              value={minValue}
              onChange={(e) => handleRangeChange(e, true)}
              onBlur={() => {
                console.log(
                  "Between min blur - calling mainValueChangeHandler with:",
                  valueKey,
                  localInputValues[valueKey],
                  "Is group:",
                  columnProp?.is_group
                );
                if (columnProp?.is_group) {
                  console.log(
                    "Calling handleInnerValueChange directly for group between min"
                  );
                  handleInnerValueChange(
                    rowIndex,
                    columnIndex,
                    ruleIndex,
                    localInputValues[valueKey]
                  );
                } else {
                  mainValueChangeHandler(
                    rowIndex,
                    columnIndex,
                    localInputValues[valueKey],
                    ruleIndex
                  );
                }
              }}
              disabled={disabled}
              className={`w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-white"
              }`}
              type={dataType === "DateTime" ? "datetime-local" : "date"}
              placeholder={
                dataType === "DateTime" ? "Start date/time" : "Start date"
              }
            />
            <input
              key={maxInputKey}
              value={maxValue}
              onChange={(e) => handleRangeChange(e, false)}
              onBlur={() => {
                console.log(
                  "Between max blur - calling mainValueChangeHandler with:",
                  valueKey,
                  localInputValues[valueKey],
                  "Is group:",
                  columnProp?.is_group
                );
                if (columnProp?.is_group) {
                  console.log(
                    "Calling handleInnerValueChange directly for group between max"
                  );
                  handleInnerValueChange(
                    rowIndex,
                    columnIndex,
                    ruleIndex,
                    localInputValues[valueKey]
                  );
                } else {
                  mainValueChangeHandler(
                    rowIndex,
                    columnIndex,
                    localInputValues[valueKey],
                    ruleIndex
                  );
                }
              }}
              disabled={disabled}
              className={`w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-white"
              }`}
              type={dataType === "DateTime" ? "datetime-local" : "date"}
              placeholder={
                dataType === "DateTime" ? "End date/time" : "End date"
              }
            />
          </div>
        );
      } else {
        // Not DateTime or Date - use horizontal layout with To label
        return (
          <div
            className={`flex items-center space-x-2 ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
          >
            <input
              key={minInputKey}
              value={minValue}
              onChange={(e) => handleRangeChange(e, true)}
              onBlur={() => {
                console.log(
                  "Between min blur (non-datetime) - calling mainValueChangeHandler with:",
                  valueKey,
                  localInputValues[valueKey],
                  "Is group:",
                  columnProp?.is_group
                );
                if (columnProp?.is_group) {
                  console.log(
                    "Calling handleInnerValueChange directly for group between min"
                  );
                  handleInnerValueChange(
                    rowIndex,
                    columnIndex,
                    ruleIndex,
                    localInputValues[valueKey]
                  );
                } else {
                  mainValueChangeHandler(
                    rowIndex,
                    columnIndex,
                    localInputValues[valueKey],
                    ruleIndex
                  );
                }
              }}
              disabled={disabled}
              className={`w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-white"
              }`}
              type={getInputType()}
              placeholder="Min"
            />
            <span className="mx-2 text-gray-500">to</span>
            <input
              key={maxInputKey}
              value={maxValue}
              onChange={(e) => handleRangeChange(e, false)}
              onBlur={() => {
                console.log(
                  "Between max blur (non-datetime) - calling mainValueChangeHandler with:",
                  valueKey,
                  localInputValues[valueKey],
                  "Is group:",
                  columnProp?.is_group
                );
                if (columnProp?.is_group) {
                  console.log(
                    "Calling handleInnerValueChange directly for group between max"
                  );
                  handleInnerValueChange(
                    rowIndex,
                    columnIndex,
                    ruleIndex,
                    localInputValues[valueKey]
                  );
                } else {
                  mainValueChangeHandler(
                    rowIndex,
                    columnIndex,
                    localInputValues[valueKey],
                    ruleIndex
                  );
                }
              }}
              disabled={disabled}
              className={`w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-white"
              }`}
              type={getInputType()}
              placeholder="Max"
            />
          </div>
        );
      }
      // --- End rendering based on dataType ---
    }
    // --- End Between ---

    // --- Special handling for "in" and "not in" operators ---
    if (operator === "in" || operator === "not in") {
      const listInputKey = `${valueKey}-list`;
      let displayValue = "";

      // Prioritize local state if available
      if (localInputValues[valueKey] !== undefined) {
        displayValue = localInputValues[valueKey];
      } else if (Array.isArray(safeRule.value)) {
        // Format array from state into comma-separated string for display
        displayValue = safeRule.value.join(", ");
        // Initialize local state if needed
        if (localInputValues[valueKey] === undefined) {
          setLocalInputValues((prev) => ({
            ...prev,
            [valueKey]: displayValue,
          }));
        }
      }

      const handleListChange = (e) => {
        const newValue = e.target.value;
        // Update local state immediately
        setLocalInputValues((prev) => ({ ...prev, [valueKey]: newValue }));

        // Mark as modified immediately on list input change
        sessionStorage.setItem("conditionsModified", "true");
        // Dispatch event for immediate UI update
        window.dispatchEvent(
          new CustomEvent("conditionsModified", { detail: true })
        );
      };

      // For debugging
      console.log("List input valueKey:", valueKey);
      console.log("Current localInputValues:", localInputValues);
      console.log("mainValueChangeHandler:", mainValueChangeHandler);
      console.log(
        "Is group cell:",
        columnProp?.is_group,
        "ruleIndex:",
        ruleIndex
      );

      return (
        <div className="relative">
          <textarea
            key={listInputKey}
            value={displayValue}
            onChange={handleListChange}
            onBlur={() => {
              console.log(
                "Textarea blur - calling mainValueChangeHandler with:",
                valueKey,
                localInputValues[valueKey],
                "Is group:",
                columnProp?.is_group,
                "ruleIndex:",
                ruleIndex
              );
              if (columnProp?.is_group) {
                console.log(
                  "Calling handleInnerValueChange directly for group cell"
                );
                handleInnerValueChange(
                  rowIndex,
                  columnIndex,
                  ruleIndex,
                  localInputValues[valueKey]
                );
              } else {
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  localInputValues[valueKey],
                  ruleIndex
                );
              }
            }}
            placeholder="Enter comma-separated values"
            rows={3}
            disabled={disabled}
            className={`w-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-300 rounded-md resize-none ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
          />
          <div
            className={`text-xs text-gray-500 mt-1 absolute right-2 bottom-2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Comma-separated list
          </div>
        </div>
      );
    }
    // --- End In/Not In ---

    // --- Default rendering based on dataType ---

    // Regular rendering based on dataType
    switch (dataType) {
      case "Boolean":
        // Convert value for proper display in dropdown
        let displayValue = "";
        if (currentValue === true || currentValue === "true") {
          displayValue = "true";
        } else if (currentValue === false || currentValue === "false") {
          displayValue = "false";
        } else if (currentValue !== "") {
          // Default to true if value exists but isn't explicitly boolean
          displayValue = "true";
        }

        const booleanSelect = (
          <select
            key={commonProps.key}
            value={displayValue}
            disabled={commonProps.disabled}
            onChange={(e) => {
              const boolValue =
                e.target.value === "true"
                  ? true
                  : e.target.value === "false"
                  ? false
                  : null;

              // Update local input value
              handleInputChange(boolValue);

              // For result columns, also update immediately without waiting for blur
              if (columnProp?.isResult) {
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  boolValue,
                  ruleIndex
                );
              }
            }}
            onBlur={() => {
              console.log(
                "Boolean blur - calling mainValueChangeHandler with:",
                commonProps.key,
                localInputValues[commonProps.key],
                "Is group:",
                columnProp?.is_group
              );
              const boolValue = localInputValues[commonProps.key];
              if (columnProp?.is_group) {
                console.log(
                  "Calling handleInnerValueChange directly for group Boolean"
                );
                handleInnerValueChange(
                  rowIndex,
                  columnIndex,
                  ruleIndex,
                  boolValue
                );
              } else if (columnProp?.isResult) {
                // For result columns, use the mainValueChangeHandler
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  boolValue,
                  ruleIndex
                );
              } else {
                // For regular condition columns
                handleValueChange(rowIndex, columnIndex, boolValue, ruleIndex);
              }
            }}
            className={`${commonProps.className} ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
          >
            {!displayValue && <option value="">Select Boolean</option>}
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

        return renderWithAttributeButton(booleanSelect);

      case "Numeric":
        const numericInput = (
          <input
            key={commonProps.key}
            value={commonProps.value}
            disabled={commonProps.disabled}
            onChange={commonProps.onChange} // Uses handleInputChange via commonProps
            onBlur={() => {
              console.log(
                "Numeric blur - calling mainValueChangeHandler with:",
                commonProps.key,
                localInputValues[commonProps.key],
                "Is group:",
                columnProp?.is_group
              );
              if (columnProp?.is_group) {
                console.log(
                  "Calling handleInnerValueChange directly for group Numeric"
                );
                handleInnerValueChange(
                  rowIndex,
                  columnIndex,
                  ruleIndex,
                  localInputValues[commonProps.key]
                );
              } else {
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  localInputValues[commonProps.key],
                  ruleIndex
                );
              }
            }}
            className={`${commonProps.className} ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
            type="number"
            placeholder="Enter Number"
          />
        );

        return renderWithAttributeButton(numericInput);

      case "Date":
        const dateInput = (
          <input
            key={commonProps.key}
            value={commonProps.value}
            disabled={commonProps.disabled}
            onChange={commonProps.onChange} // Uses handleInputChange via commonProps
            onBlur={() => {
              console.log(
                "Date blur - calling mainValueChangeHandler with:",
                commonProps.key,
                localInputValues[commonProps.key],
                "Is group:",
                columnProp?.is_group
              );
              if (columnProp?.is_group) {
                console.log(
                  "Calling handleInnerValueChange directly for group Date"
                );
                handleInnerValueChange(
                  rowIndex,
                  columnIndex,
                  ruleIndex,
                  localInputValues[commonProps.key]
                );
              } else {
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  localInputValues[commonProps.key],
                  ruleIndex
                );
              }
            }}
            className={`${commonProps.className} ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
            type="date"
            placeholder="Select Date"
          />
        );

        return renderWithAttributeButton(dateInput);

      case "DateTime":
        const dateTimeInput = (
          <input
            key={commonProps.key}
            value={commonProps.value}
            disabled={commonProps.disabled}
            onChange={commonProps.onChange} // Uses handleInputChange via commonProps
            onBlur={() => {
              console.log(
                "DateTime blur - calling mainValueChangeHandler with:",
                commonProps.key,
                localInputValues[commonProps.key],
                "Is group:",
                columnProp?.is_group
              );
              if (columnProp?.is_group) {
                console.log(
                  "Calling handleInnerValueChange directly for group DateTime"
                );
                handleInnerValueChange(
                  rowIndex,
                  columnIndex,
                  ruleIndex,
                  localInputValues[commonProps.key]
                );
              } else {
                mainValueChangeHandler(
                  rowIndex,
                  columnIndex,
                  localInputValues[commonProps.key],
                  ruleIndex
                );
              }
            }}
            className={`${commonProps.className} ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
            type="datetime-local"
            placeholder="Select Date and Time"
          />
        );

        return renderWithAttributeButton(dateTimeInput);

      default: // String and others
        const defaultInput = (
          <input
            key={commonProps.key}
            value={commonProps.value}
            disabled={commonProps.disabled}
            onChange={commonProps.onChange} // Uses handleInputChange via commonProps
            onBlur={() => {
              console.log(
                "Default blur - calling mainValueChangeHandler with:",
                commonProps.key,
                localInputValues[commonProps.key],
                "Is group:",
                columnProp?.is_group
              );

              // Only update if we have a valid value to avoid clearing
              const currentValue = localInputValues[commonProps.key];
              if (currentValue !== undefined && currentValue !== null) {
                if (columnProp?.is_group) {
                  console.log(
                    "Calling handleInnerValueChange directly for group default"
                  );
                  handleInnerValueChange(
                    rowIndex,
                    columnIndex,
                    ruleIndex,
                    currentValue
                  );
                } else {
                  mainValueChangeHandler(
                    rowIndex,
                    columnIndex,
                    currentValue,
                    ruleIndex
                  );
                }
              } else {
                console.log("Skipping update with undefined/null value");
              }
            }}
            className={`${commonProps.className} ${
              theme === "dark" ? "bg-gray-700" : "bg-white"
            }`}
            type="text"
            placeholder={`Enter ${dataType}`}
          />
        );

        return renderWithAttributeButton(defaultInput);
    }
  };

  // Update handleValueChange to use the rule's data_type directly
  const handleValueChange = (rowIndex, columnIndex, value, ruleIndex = 0) => {
    // Don't update if value is undefined
    if (value === undefined) {
      console.log("Preventing update with undefined value");
      return;
    }

    // Update local value for controlled input (UI references)
    const valueKey = `${rowIndex}-${columnIndex}-${ruleIndex}`;
    setLocalInputValues((prev) => ({
      ...prev,
      [valueKey]: value,
    }));

    // Keep track of the last modified inputs to avoid re-renders overriding focus
    window.lastModifiedInput = { rowIndex, columnIndex, ruleIndex };

    // Create a deep copy to avoid reference issues
    const newConditions = JSON.parse(JSON.stringify(conditions));

    // Access the rule in the first condition's rules array
    if (
      newConditions[rowIndex] &&
      newConditions[rowIndex].conditions[0] &&
      newConditions[rowIndex].conditions[0].rules &&
      newConditions[rowIndex].conditions[0].rules[columnIndex]
    ) {
      // Get rule and its data type
      const rule = newConditions[rowIndex].conditions[0].rules[columnIndex];
      const dataType = rule.data_type || "String";
      const operatorKey = rule.operator || "";

      // Convert and update value
      rule.value = convertToDataType(value, dataType, operatorKey);

      // Send update immediately using onUpdate directly
      onUpdate(newConditions);
    }
  };

  const fetchInputAttributes = async () => {
    try {
      // Get session values
      const user = getUserDetails(); // Use the imported function
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_type = sessionStorage.getItem("rule_type");
      const rule_id = sessionStorage.getItem("type_id");

      console.log("Session values for API call:", {
        user,
        workspace,
        workspace_id,
        rule_type,
        rule_id,
      });

      // Call the getAttribute API with values from session storage
      const response = await fetch(
        "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user,
            workspace,
            workspace_id,
            rule_type,
            rule_id,
            is_input_attribute: isInputAttribute,
          }),
        }
      );
      const data = await response.json();
      console.log("API response from getAttribute:", data);
      return data;
    } catch (error) {
      console.error("Error fetching input attributes:", error);
      return {
        status: "Error",
        data: {
          global_attributes: [],
          input_attributes: [],
        },
      };
    }
  };

  const fetchOperators = async (dataType) => {
    try {
      console.log(`Fetching operators for data type: ${dataType}`);

      // Call the getOperator API with the property's data type
      const response = await fetch(
        "https://micro-solution-ruleengineprod.mfilterit.net/getOperator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            datatype: dataType,
          }),
        }
      );

      const result = await response.json();
      console.log(`API response for operators (${dataType}):`, result);

      if (result && result.status === "Success" && result.data) {
        // Transform API response into the format our component expects
        // Convert from {key: value} to [{id: index, name: value, key: key}]
        const operatorArray = Object.entries(result.data).map(
          ([key, value], index) => ({
            id: index + 1,
            name: value, // Display name (e.g., "Equals")
            key: key, // API key (e.g., "=")
          })
        );

        console.log(`Transformed operators for ${dataType}:`, operatorArray);
        return operatorArray;
      }

      console.warn(`Invalid response format for operators (${dataType})`);
      return [];
    } catch (error) {
      console.error(`Error fetching operators for ${dataType}:`, error);
      return [];
    }
  };

  // Update the useEffect for loading operators to properly use attributes from API
  useEffect(() => {
    const loadOperators = async () => {
      const opMap = {};

      // First get operators for regular condition column properties
      for (const prop of columnProperties) {
        // --- ONLY fetch operators for NON-GROUP columns with a defined property ---
        if (prop.property && !prop.is_group) {
          // Find the data type associated with this property
          const attr = inputAttributes.find((a) => a.name === prop.property);
          if (attr && attr.data_type) {
            console.log(
              `Effect: Loading operators for property ${prop.property} with data type ${attr.data_type}`
            );
            // Fetch operators only if not already fetched/present to avoid redundant calls?
            // Could optimize here later if needed.
            opMap[prop.property] = await fetchOperators(attr.data_type);
          } else {
            console.log(
              `Effect: Could not find data type for property: ${prop.property}`
            );
          }
        }
      }

      // NEW: Check for inner rules in group columns and load their operators too
      if (conditions.length > 0) {
        // Use first row to find inner rules
        const firstRow = conditions[0];
        if (firstRow?.conditions?.[0]?.rules) {
          for (
            let colIndex = 0;
            colIndex < firstRow.conditions[0].rules.length;
            colIndex++
          ) {
            const rule = firstRow.conditions[0].rules[colIndex];
            // Only process group rules
            if (rule?.is_group && Array.isArray(rule.rules)) {
              // Check each inner rule for properties
              for (let innerIdx = 0; innerIdx < rule.rules.length; innerIdx++) {
                const innerRule = rule.rules[innerIdx];
                if (innerRule?.property && !opMap[innerRule.property]) {
                  // Find data type and load operators
                  const innerAttr = inputAttributes.find(
                    (a) => a.name === innerRule.property
                  );
                  if (innerAttr && innerAttr.data_type) {
                    console.log(
                      `Loading operators for inner rule property ${innerRule.property} with type ${innerAttr.data_type}`
                    );
                    opMap[innerRule.property] = await fetchOperators(
                      innerAttr.data_type
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Update the operators state, MERGING with existing operators
      // This prevents overwriting operators fetched for group inner properties
      setOperators((prev) => ({ ...prev, ...opMap }));
    };

    if (inputAttributes.length > 0) {
      loadOperators();
    }
    // Consider if dependencies are correct. Does it need `operators`?
  }, [inputAttributes, columnProperties, conditions.length]);

  // Update the useEffect to include isInputAttribute in dependencies to trigger refetch
  useEffect(() => {
    // Set the initial conditionsModified flag to false when component loads
    sessionStorage.setItem("conditionsModified", "false");

    const loadInputAttributes = async () => {
      const response = await fetchInputAttributes();

      // Handle the API response structure
      if (response && response.status === "Success" && response.data) {
        const { global_attributes = [], input_attributes = [] } = response.data;

        // Transform the attributes to match our expected format
        const formattedAttributes = [
          ...global_attributes.map((attr) => ({
            id: attr._id,
            name: attr.attribute,
            data_type: attr.data_type,
            source_type: "global_attributes",
          })),
          ...input_attributes.map((attr) => ({
            id: attr._id,
            name: attr.attribute,
            data_type: attr.data_type,
            source_type: "input_attributes",
          })),
        ];

        console.log("Formatted attributes:", formattedAttributes);
        setInputAttributes(formattedAttributes);
      } else {
        console.error("Unexpected API response format:", response);
        setInputAttributes([]);
      }
    };

    loadInputAttributes();
  }, [isInputAttribute]); // Add isInputAttribute to dependencies

  // --- Effect to Fetch Rule Policies --- MOVED TO RulePolicyDropdown.jsx ---
  // useEffect(() => {
  //   ...
  // }, []);
  // -------------------------------------

  // Add a function to convert string values to the appropriate data types
  const convertToDataType = (value, dataType, operator) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    // Special case for between operator
    if (operator && operator.toLowerCase() === "between") {
      // If value is already a comma-separated string, convert to array
      if (typeof value === "string" && value.includes(",")) {
        const parts = value.split(",");
        if (parts.length >= 2) {
          return [
            convertSingleValueToDataType(parts[0].trim(), dataType),
            convertSingleValueToDataType(parts[1].trim(), dataType),
          ];
        }
        return value;
      }

      // If value is an object with min/max, convert to array
      if (typeof value === "object") {
        if (value.min !== undefined && value.max !== undefined) {
          // Convert from object format to array format
          return [
            convertSingleValueToDataType(value.min, dataType),
            convertSingleValueToDataType(value.max, dataType),
          ];
        } else if (Array.isArray(value) && value.length >= 2) {
          // Already in array format, just ensure proper data types
          return [
            convertSingleValueToDataType(value[0], dataType),
            convertSingleValueToDataType(value[1], dataType),
          ];
        }
      }

      // --- ADDED: If value is already an array, ensure elements are correct type ---
      else if (Array.isArray(value) && value.length >= 2) {
        // Already in array format, just ensure proper data types
        return [
          convertSingleValueToDataType(value[0], dataType),
          convertSingleValueToDataType(value[1], dataType),
        ];
      }
      // -----------------------------------------------------------------------

      return value; // Return as is if not recognized format
    }

    // Special case for "in" and "not in" operators
    if (
      operator &&
      (operator.toLowerCase() === "in" || operator.toLowerCase() === "not in")
    ) {
      if (typeof value === "string") {
        return value
          .split(",")
          .map((v) => convertSingleValueToDataType(v.trim(), dataType));
      }
      return value;
    }

    return convertSingleValueToDataType(value, dataType);
  };

  // Helper to convert a single value to its appropriate data type
  const convertSingleValueToDataType = (value, dataType) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    switch (dataType) {
      case "Numeric":
        const num = Number(value);
        return isNaN(num) ? value : num;

      case "Boolean":
        if (value === "true") return true;
        if (value === "false") return false;
        return Boolean(value);

      case "Date":
      case "DateTime":
      case "Time":
        // Keep date strings as is since they're already in ISO format
        return value;

      default:
        return value; // Keep strings as is
    }
  };

  // Update handleAddConditionAtPosition to include data_type and use splice
  const handleAddConditionAtPosition = (columnIndex) => {
    if (conditions.length === 0) {
      onUpdate([createDefaultRow()]);
      return;
    }

    // Create a deep copy of the conditions array
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Add a new rule NEXT TO the specified column index
    updatedConditions.forEach((condition) => {
      if (condition.conditions[0] && condition.conditions[0].rules) {
        // Create the new default rule - remove is_group
        const newRule = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          property: "", // Empty property
          source_type: "", // Empty source_type
          operator: "", // Empty operator
          value: "", // Empty value
          data_type: "String", // Default data type
        };
        // Use splice to insert at the correct position
        condition.conditions[0].rules.splice(columnIndex + 1, 0, newRule);
      }
    });

    // --- Also update column properties state directly ---
    const newColumnProperties = [...columnProperties];
    newColumnProperties.splice(columnIndex + 1, 0, {
      property: "",
      source_type: "",
      operator: "all", // Default operator for the column
      data_type: "String",
      is_group: false,
    });
    setColumnProperties(newColumnProperties);
    // --------------------------------------------------

    // Update conditions state
    onUpdate(updatedConditions);

    // --- Clear local values for the new column index ---
    const newColIndex = columnIndex + 1;
    const clearedLocalValues = { ...localInputValues };
    updatedConditions.forEach((_, rIndex) => {
      const keyToClear = `${rIndex}-${newColIndex}-0`; // Assuming ruleIndex 0 for new regular condition
      delete clearedLocalValues[keyToClear];
    });
    setLocalInputValues(clearedLocalValues);
    // -------------------------------------------------

    // Close the dropdown
    setShowPropertyDropdown(null);
  };

  // Add useEffect for handling click outside event
  useEffect(() => {
    // Function to handle clicks outside of the popup
    const handleClickOutside = (event) => {
      if (showPropertyDropdown !== null) {
        // Check if the click was outside of the popup
        const popupElement = document.getElementById(
          `popup-${showPropertyDropdown}`
        );
        if (popupElement && !popupElement.contains(event.target)) {
          // Check if the click was not on the button that toggles the popup
          const toggleButton = document.getElementById(
            `toggle-${showPropertyDropdown}`
          );
          if (!toggleButton || !toggleButton.contains(event.target)) {
            setShowPropertyDropdown(null);
          }
        }
      }

      // Also close row menus when clicking outside
      if (activeRowMenu !== null) {
        const menuElement = document.getElementById(
          `row-menu-${activeRowMenu}`
        );
        if (menuElement && !menuElement.contains(event.target)) {
          const toggleButton = document.getElementById(
            `row-toggle-${activeRowMenu}`
          );
          if (!toggleButton || !toggleButton.contains(event.target)) {
            setActiveRowMenu(null);
          }
        }
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Remove event listener on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPropertyDropdown, activeRowMenu]); // Add new state to dependency array

  // Update the utility function to prevent scrolling
  const preventScroll = (e) => {
    if (e) e.preventDefault();

    // Remember current scroll position
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Add event listener for the next tick to reset scroll position
    setTimeout(() => {
      window.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "auto",
      });
    }, 5);
  };

  // Add a function to handle adding a group at a specific position
  const handleAddGroupAtPosition = (columnIndex) => {
    if (conditions.length === 0) {
      onUpdate([createDefaultRow()]);
      return;
    }

    // Create a deep copy of the conditions array
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Add a new column (with a group flag) to each row
    updatedConditions.forEach((condition) => {
      if (condition.conditions[0]) {
        // Create a default inner condition for the group
        const defaultInnerCondition = {
          id: Date.now() + Math.floor(Math.random() * 10000),
          property: "",
          source_type: "",
          operator: "",
          value: "",
          data_type: "String",
        };

        // Insert the simplified group rule at columnIndex + 1
        const newGroupRule = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          operator: "all", // Default group operator
          is_group: true,
          rules: [defaultInnerCondition], // Initialize with a default inner condition
        };

        // Insert the new rule at the specified position
        condition.conditions[0].rules.splice(columnIndex + 1, 0, newGroupRule);
      }
    });

    // Update column properties with a new entry for this group
    const newColumnProperties = [...columnProperties];
    newColumnProperties.splice(columnIndex + 1, 0, {
      property: "", // Groups don't have a top-level property
      source_type: "",
      operator: "all", // Default operator for the new group column
      data_type: "String", // Not applicable, but structure requires it?
      is_group: true,
    });

    setColumnProperties(newColumnProperties);
    onUpdate(updatedConditions);

    // Close the dropdown
    setShowPropertyDropdown(null);
  };

  // Updated function to add a condition *inside* a group
  const handleAddConditionToGroup = (rowIndex, columnIndex) => {
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Find the specific group rule
    const groupRule =
      updatedConditions[rowIndex]?.conditions[0]?.rules?.[columnIndex];

    if (groupRule && groupRule.is_group) {
      // Ensure the group rule has a 'rules' array
      if (!Array.isArray(groupRule.rules)) {
        groupRule.rules = [];
      }

      // Add a new default rule to the group's internal rules array
      groupRule.rules.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        property: "",
        source_type: "",
        operator: "",
        value: "",
        data_type: "String",
      });

      // Update the conditions state
      onUpdate(updatedConditions);
    } else {
      console.error("Could not find the group rule to add a condition to.");
    }
  };

  // Function to handle deleting an inner condition within a group (now applies to ALL rows)
  const handleDeleteInnerCondition = (columnIndex, innerRuleIndex) => {
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Check if this is the last inner condition in the group
    const isLastInnerCondition = updatedConditions.some((condition) => {
      const groupRule = condition?.conditions?.[0]?.rules?.[columnIndex];
      return (
        groupRule?.is_group &&
        Array.isArray(groupRule.rules) &&
        groupRule.rules.length <= 1
      );
    });

    // Don't allow deletion of the last inner condition
    if (isLastInnerCondition) {
      toast?.error?.(
        "Cannot delete the last condition in a group. Groups must have at least one condition."
      );
      return;
    }

    // Get the number of inner rules before deletion for each row
    const innerRuleCountsByRow = updatedConditions.map((condition) => {
      const groupRule = condition?.conditions?.[0]?.rules?.[columnIndex];
      return groupRule && groupRule.is_group && Array.isArray(groupRule.rules)
        ? groupRule.rules.length
        : 0;
    });

    // Update the conditions data structure
    updatedConditions.forEach((condition) => {
      // Ensure the path to rules exists and it's a group
      const groupRule = condition?.conditions?.[0]?.rules?.[columnIndex];
      if (groupRule && groupRule.is_group && Array.isArray(groupRule.rules)) {
        // Check if the index is valid before splicing
        if (innerRuleIndex >= 0 && innerRuleIndex < groupRule.rules.length) {
          groupRule.rules.splice(innerRuleIndex, 1);
        }
      }
    });

    // Update localInputValues to shift indices for all subsequent inner rules
    const updatedLocalValues = { ...localInputValues };

    // For each row, adjust the keys in localInputValues
    updatedConditions.forEach((_, rowIndex) => {
      const innerRuleCount = innerRuleCountsByRow[rowIndex];

      // Skip if this row didn't have inner rules or the deleted index is invalid
      if (innerRuleCount <= 0 || innerRuleIndex >= innerRuleCount) {
        return;
      }

      // Start from the highest index and work backwards to avoid overwriting
      for (let i = innerRuleCount - 1; i > innerRuleIndex; i--) {
        const oldKey = `${rowIndex}-${columnIndex}-${i}`;
        const newKey = `${rowIndex}-${columnIndex}-${i - 1}`;

        // If the old key exists, move its value to the new key and delete the old one
        if (oldKey in updatedLocalValues) {
          updatedLocalValues[newKey] = updatedLocalValues[oldKey];
          delete updatedLocalValues[oldKey];
        }
      }

      // Delete the key for the removed inner rule
      const keyToDelete = `${rowIndex}-${columnIndex}-${innerRuleIndex}`;
      delete updatedLocalValues[keyToDelete];
    });

    // Update the localInputValues state
    setLocalInputValues(updatedLocalValues);

    // Update the conditions state
    onUpdate(updatedConditions);
  };

  // Function to handle property change for an inner condition (now applies to ALL rows)
  const handleInnerPropertyChange = async (
    columnIndex,
    innerRuleIndex,
    newProperty
  ) => {
    const updatedConditions = JSON.parse(JSON.stringify(conditions));
    const selectedAttribute = inputAttributes.find(
      (attr) => attr.name === newProperty
    );
    const source_type = selectedAttribute ? selectedAttribute.source_type : "";
    const dataType = selectedAttribute ? selectedAttribute.data_type : "String";

    updatedConditions.forEach((condition) => {
      const groupRule = condition?.conditions?.[0]?.rules?.[columnIndex];
      const innerRule = groupRule?.rules?.[innerRuleIndex];

      if (innerRule) {
        innerRule.property = newProperty;
        innerRule.source_type = source_type;
        innerRule.data_type = dataType;

        // ALWAYS reset operator and value when property changes
        innerRule.operator = "";
        innerRule.value = "";
      }
    });

    // Clear relevant local input values across all rows for this inner rule index
    const updatedLocalInputValues = { ...localInputValues };
    conditions.forEach((_, rowIndex) => {
      const valueKey = `${rowIndex}-${columnIndex}-${innerRuleIndex}`;
      delete updatedLocalInputValues[valueKey]; // Clear local value
    });
    setLocalInputValues(updatedLocalInputValues);
    // Prevent focus restoration after inner property change
    window.lastModifiedInput = null;

    // --- Fetch operators BEFORE updating main state ---
    // Fetch operators for the dropdown, but DO NOT set a default operator here
    if (newProperty && dataType) {
      console.log(
        `Fetching operators for inner property: ${newProperty} (${dataType})`
      );
      fetchOperators(dataType).then((fetchedOperators) => {
        if (fetchedOperators) {
          setOperators((prev) => ({
            ...prev,
            [newProperty]: fetchedOperators,
          }));
          console.log(
            `Operators for ${newProperty} loaded and stored in state.`
          );
        }
      });
    }
    // -------------------------------------------------

    // Update the main conditions state AFTER operators might have been updated
    onUpdate(updatedConditions);
    // Update window.lastModifiedInput with the correct refKey format
    window.lastModifiedInput = {
      refKey: `${rowIndex}-${columnIndex}-${innerRuleIndex}`,
    };
  };

  // Function to handle operator change for an inner condition (applies to specific ROW)
  const handleInnerOperatorChange = (
    rowIndex,
    columnIndex,
    innerRuleIndex,
    newOperator
  ) => {
    console.log(
      `Changing inner operator to ${newOperator} at [${rowIndex}][${columnIndex}][${innerRuleIndex}]`
    );

    // Create a deep copy to avoid reference issues - DO NOT use produce/immer which may be causing issues
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Only update the specific row that was changed
    const condition = updatedConditions[rowIndex];
    if (condition?.conditions?.[0]?.rules) {
      const groupRule = condition.conditions[0].rules[columnIndex];
      if (groupRule?.is_group && Array.isArray(groupRule.rules)) {
        const innerRule = groupRule.rules[innerRuleIndex];
        if (innerRule) {
          // Set the operator and ensure value is correctly initialized
          innerRule.operator = newOperator;

          // Initialize value structure for specific operators
          const hideValueField =
            newOperator &&
            (newOperator.toLowerCase() === "any" ||
              newOperator.toLowerCase() === "exists");

          // Initialize the appropriate value based on operator type
          if (hideValueField) {
            // For exists/any operators, use empty string
            innerRule.value = "";
          } else if (newOperator.toLowerCase() === "between") {
            // For between operator, use array with two empty strings
            innerRule.value = ["", ""];
          } else if (
            newOperator.toLowerCase() === "in" ||
            newOperator.toLowerCase() === "not in"
          ) {
            // For in/not in operators, use empty array
            innerRule.value = [];
          } else {
            // For all other operators, initialize with empty string
            innerRule.value = "";
          }

          // Clear local input value for this specific cell to ensure UI updates
          const valueKey = `${rowIndex}-${columnIndex}-${innerRuleIndex}`;
          setLocalInputValues((prev) => {
            const updated = { ...prev };
            delete updated[valueKey];
            return updated;
          });
        }
      }
    }

    // Mark as modified immediately
    sessionStorage.setItem("conditionsModified", "true");
    // Dispatch event for immediate UI update
    window.dispatchEvent(
      new CustomEvent("conditionsModified", { detail: true })
    );

    // Update the state with the new conditions
    onUpdate(updatedConditions);
  };

  // Function to handle value change for an inner condition (applies to specific ROW)
  const handleInnerValueChange = (
    rowIndex,
    columnIndex,
    innerRuleIndex,
    newValue
  ) => {
    console.log(
      "handleInnerValueChange called with:",
      rowIndex,
      columnIndex,
      innerRuleIndex,
      newValue
    );

    // Skip updates if the new value is undefined or null
    if (newValue === undefined || newValue === null) {
      console.log("Skipping update for undefined/null value");
      return;
    }

    const updatedConditions = JSON.parse(JSON.stringify(conditions));
    const groupRule =
      updatedConditions[rowIndex]?.conditions[0]?.rules?.[columnIndex];
    const innerRule = groupRule?.rules?.[innerRuleIndex];

    console.log("Group rule:", groupRule);
    console.log("Inner rule:", innerRule);

    if (innerRule) {
      const dataType = innerRule.data_type || "String";
      const operatorKey = innerRule.operator || "";

      // Update local value state first for this specific cell
      const valueKey = `${rowIndex}-${columnIndex}-${innerRuleIndex}`;
      setLocalInputValues((prev) => ({
        ...prev,
        [valueKey]: newValue,
      }));

      // Only set refKey here if NOT a complex operator
      const innerOperatorKey = innerRule?.operator || "";
      if (
        innerOperatorKey !== "between" &&
        innerOperatorKey !== "in" &&
        innerOperatorKey !== "not in"
      ) {
        window.lastModifiedInput = { refKey: valueKey };
      }

      // Convert and store the value with the correct data type in the main state
      const convertedValue = convertToDataType(newValue, dataType, operatorKey);
      console.log(
        "Converting value:",
        newValue,
        "to",
        convertedValue,
        "for dataType:",
        dataType
      );

      innerRule.value = convertedValue;
      console.log("Updated conditions:", updatedConditions);

      // Update state with onUpdate directly
      onUpdate(updatedConditions);

      // Update window.lastModifiedInput with the correct refKey format
      window.lastModifiedInput = { refKey: valueKey };
    } else {
      console.error(
        "Inner rule not found for",
        rowIndex,
        columnIndex,
        innerRuleIndex
      );
    }
  };

  // Create new function to add inner condition to all rows for a group column
  const handleAddInnerConditionToAllRows = (columnIndex) => {
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    updatedConditions.forEach((condition, rowIndex) => {
      // Ensure the path to rules exists
      if (
        condition &&
        condition.conditions &&
        condition.conditions[0] &&
        condition.conditions[0].rules
      ) {
        const groupRule = condition.conditions[0].rules[columnIndex];
        if (groupRule && groupRule.is_group) {
          if (!Array.isArray(groupRule.rules)) {
            groupRule.rules = [];
          }
          groupRule.rules.push({
            id: Date.now() + rowIndex + Math.floor(Math.random() * 1000),
            property: "",
            source_type: "",
            operator: "",
            value: "",
            data_type: "String",
          });
        }
      }
    });

    onUpdate(updatedConditions);
  };

  // --- NEW: Handler specifically for the group's own AND/OR operator ---
  const handleGroupOperatorChange = (columnIndex, newOperatorValue) => {
    // Update the main conditions data
    const updatedConditions = JSON.parse(JSON.stringify(conditions));
    updatedConditions.forEach((condition) => {
      const groupRule = condition?.conditions?.[0]?.rules?.[columnIndex];
      if (groupRule && groupRule.is_group) {
        groupRule.operator = newOperatorValue;
      }
    });
    onUpdate(updatedConditions);

    // Also update the columnProperties state for UI consistency
    const newColumnProperties = JSON.parse(JSON.stringify(columnProperties));
    if (newColumnProperties[columnIndex]) {
      newColumnProperties[columnIndex].operator = newOperatorValue;
    }
    setColumnProperties(newColumnProperties);
  };
  // ---------------------------------------------------------------------

  // --- NEW: Handler to add the first result column ---
  const handleAddResultColumn = () => {
    console.log("Adding new result column");
    setShowResultConfigPopupIndex("new");
  };

  // Handle cancel from result configuration popup
  const handleCancelResultConfig = () => {
    console.log("Result configuration canceled");
    setShowResultConfigPopupIndex(null);
  };

  const handleSaveResultConfig = (columnIndex, config) => {
    console.log(
      `Saving result config for index ${columnIndex}:`,
      JSON.stringify(config)
    );
    const { key, name, dataType } = config;
    console.log(`Using dataType: ${dataType}`);

    // Default to String if no valid dataType is provided
    const dataTypeValue = dataType || "String";

    // Check for duplicate keys
    const isDuplicate = columnProperties.some((prop, idx) => {
      // Skip the current column if we're editing an existing one
      const isCurrentColumn =
        typeof columnIndex === "number" && idx === columnIndex;
      return prop.key === key && prop.isResult && !isCurrentColumn;
    });

    // Show toast if duplicate is found
    if (isDuplicate) {
      toast.error(
        `A result column with key '${key}' already exists. Please use a unique key.`
      );
      return;
    }

    // Update column properties based on whether this is a new column or an existing one
    let updatedColumnProperties;

    if (columnIndex === "new" || columnIndex.toString().startsWith("insert-")) {
      // This is a brand new column
      const newResultColumn = {
        key,
        property: key,
        resultName: name || key,
        resultDataType: dataTypeValue,
        displayLabel: dataTypeValue,
        isResult: true,
        id: `result-${Date.now()}`,
        isFromAPI: false, // Mark newly added columns as not from API
      };

      // Parse the position for insertion if necessary
      let insertPosition = columnProperties.length; // Default to end
      if (columnIndex.toString().startsWith("insert-")) {
        const posString = columnIndex.toString().replace("insert-", "");
        insertPosition = parseInt(posString, 10);
        console.log(`Will insert at position ${insertPosition}`);
      }

      // Use Immer to create a new column properties array with the new column
      updatedColumnProperties = produce(columnProperties, (draft) => {
        // Insert at the specified position or append
        if (columnIndex.toString().startsWith("insert-")) {
          draft.splice(insertPosition, 0, newResultColumn);
        } else {
          draft.push(newResultColumn);
        }
      });
    } else {
      // This is an update to an existing column
      // Make sure columnIndex is treated as a number
      const numericColumnIndex =
        typeof columnIndex === "number"
          ? columnIndex
          : parseInt(columnIndex, 10);

      console.log(`Updating existing column at index ${numericColumnIndex}`);

      if (
        numericColumnIndex < 0 ||
        numericColumnIndex >= columnProperties.length
      ) {
        console.error(`Invalid column index: ${numericColumnIndex}`);
        setShowResultConfigPopupIndex(null);
        return;
      }

      // Use Immer to update properties
      updatedColumnProperties = produce(columnProperties, (draft) => {
        // Make sure we're updating a result column
        if (draft[numericColumnIndex]) {
          const previousKey = draft[numericColumnIndex].key;
          draft[numericColumnIndex].key = config.key;
          draft[numericColumnIndex].property = config.key;
          draft[numericColumnIndex].resultName = config.name || config.key;
          draft[numericColumnIndex].resultDataType = dataTypeValue;
          draft[numericColumnIndex].displayLabel = dataTypeValue;

          // Also update the result key in all conditions
          if (previousKey !== config.key) {
            // Update all rows with the new key
            updateConditionsWithNewResultKey(
              previousKey,
              config.key,
              numericColumnIndex
            );
          }
        }
      });
    }

    // Update the column properties
    setColumnProperties(updatedColumnProperties);

    // Initialize all conditions with the new key
    initializeConditionsWithNewResultKey(key);

    // Close the popup
    setShowResultConfigPopupIndex(null);
  };

  // Helper function to update the result keys in all conditions
  const updateConditionsWithNewResultKey = (oldKey, newKey, columnIndex) => {
    console.log(
      `Updating result key from ${oldKey} to ${newKey} at column ${columnIndex}`
    );

    // Create a deep copy to ensure we don't modify state directly
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // For each row, update the result object
    updatedConditions.forEach((row) => {
      if (row.result) {
        // If the row has the old key, move its value to the new key
        if (oldKey && row.result.hasOwnProperty(oldKey)) {
          row.result[newKey] = row.result[oldKey];
          delete row.result[oldKey];
        } else {
          // Otherwise, initialize the new key with empty string (not null)
          row.result[newKey] = "";
        }
      }
    });

    console.log("Updated conditions with new result key:", updatedConditions);
    onUpdate(updatedConditions);

    // Return the updated result data, which triggers useEffect
    return updatedConditions;
  };

  // Helper function to initialize result key in all rows
  const initializeConditionsWithNewResultKey = (resultKey) => {
    console.log(
      `Initializing all conditions with new result key: ${resultKey}`
    );

    // Create a deep copy
    const updatedConditions = JSON.parse(JSON.stringify(conditions));

    // Add the result key to all rows
    updatedConditions.forEach((row) => {
      if (!row.result) {
        row.result = {};
      }
      // Initialize with empty string instead of null
      row.result[resultKey] = "";
    });

    console.log(
      "Initialized conditions with new result key:",
      updatedConditions
    );
    onUpdate(updatedConditions);
  };

  const handleAddResultAtPosition = (columnIndex) => {
    // Similar to handleAddResultColumn, show the config popup immediately
    // But use the position index for insertion rather than appending
    console.log(
      `Opening result config popup for insertion at position ${columnIndex}`
    );
    setShowResultConfigPopupIndex(`insert-${columnIndex}`);
  };

  const handleConfigureResultColumn = (columnIndex) => {
    console.log(`Configuring result column at index ${columnIndex}`);
    setShowResultConfigPopupIndex(columnIndex);
  };

  // --- NEW: Handler for result value changes ---
  const handleResultValueChange = (rowIndex, columnIndex, newValue) => {
    // Don't update if value is undefined
    if (newValue === undefined) {
      console.log("Preventing update with undefined value");
      return;
    }

    // Prevent explicitly setting to null
    if (newValue === null) {
      console.log(
        "Preventing update with null value, using empty string instead"
      );
      newValue = "";
    }

    // Create a deep copy to avoid reference issues
    const newConditions = JSON.parse(JSON.stringify(conditions));

    // Get the relevant column property to use its key
    const columnProp = columnProperties[columnIndex];
    if (!columnProp || !columnProp.key) {
      console.error(`Invalid column index ${columnIndex} or missing key`);
      return;
    }

    // Update local value state (for controlled input)
    const valueKey = `result-${rowIndex}-${columnProp.key}`;
    setLocalInputValues((prev) => ({
      ...prev,
      [valueKey]: newValue,
    }));

    // Update the actual result in the condition state
    if (newConditions[rowIndex] && newConditions[rowIndex].result) {
      // Check if value is an attribute data object (already structured)
      if (
        typeof newValue === "object" &&
        newValue !== null &&
        newValue.source_type &&
        newValue.value
      ) {
        // It's already an attribute data object, use as is
        newConditions[rowIndex].result[columnProp.key] = newValue;
      } else {
        // It's a regular value, convert based on data type
        const dataType =
          columnProp.resultDataType || columnProp.data_type || "String";
        const convertedValue = convertToDataType(newValue, dataType);

        // Ensure we never set null as a value - use empty string if it would be null
        newConditions[rowIndex].result[columnProp.key] =
          convertedValue === null ? "" : convertedValue;
      }

      // Send update immediately to persist changes
      onUpdate(newConditions);
    }
  };

  // --- Effect to ensure decision_id is present on all rows ---
  useEffect(() => {
    const typeId = sessionStorage.getItem("type_id");
    if (typeId && conditions.some((row) => row.decision_id !== typeId)) {
      console.log("Ensuring decision_id on all rows...");
      const updatedConditions = produce(conditions, (draft) => {
        draft.forEach((row) => {
          if (row.decision_id !== typeId) {
            row.decision_id = typeId;
          }
        });
      });
      onUpdate(updatedConditions);
    }
  }, [conditions, onUpdate]); // Rerun if conditions change

  // Add state variables for attribute selector
  const [isAttributeSelectorOpen, setIsAttributeSelectorOpen] = useState(false);
  const [selectedRowColumnForAttribute, setSelectedRowColumnForAttribute] =
    useState({ row: null, column: null });
  const [fetchedAttributes, setFetchedAttributes] = useState({
    global_attributes: [],
    input_attributes: [],
  });
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [errorAttributes, setErrorAttributes] = useState(null);
  const [expandedAttributeGroups, setExpandedAttributeGroups] = useState({
    "Global Attributes": true,
    "Input Attributes": true,
  });
  const attributeSelectorRef = useRef(null);

  // Add click outside handler for attribute selector
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        attributeSelectorRef.current &&
        !attributeSelectorRef.current.contains(event.target)
      ) {
        setIsAttributeSelectorOpen(false);
      }
    }

    if (isAttributeSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAttributeSelectorOpen]);

  // Add these new functions
  const fetchAttributesForData = async () => {
    console.log("Fetching attributes for data dropdown...");
    setIsLoadingAttributes(true);
    setErrorAttributes(null);
    setFetchedAttributes({ global_attributes: [], input_attributes: [] });

    try {
      // Use the same function already defined in this component
      const attributes = await fetchInputAttributes();

      if (attributes && attributes.data) {
        setFetchedAttributes({
          global_attributes: attributes.data.global_attributes || [],
          input_attributes: attributes.data.input_attributes || [],
        });
        setExpandedAttributeGroups({
          "Global Attributes": true,
          "Input Attributes": true,
        });
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Error fetching attributes for data:", error);
      setErrorAttributes(`Failed to load attributes: ${error.message}`);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  const toggleAttributeGroup = (groupName) => {
    setExpandedAttributeGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleOpenAttributeSelector = (rowIndex, columnIndex) => {
    setSelectedRowColumnForAttribute({ row: rowIndex, column: columnIndex });
    fetchAttributesForData();
    setIsAttributeSelectorOpen(true);
  };

  // Get the current result column's data type for filtering attributes
  const getSelectedResultColumnDataType = () => {
    if (selectedRowColumnForAttribute.column === null) return null;

    const columnProp = columnProperties[selectedRowColumnForAttribute.column];
    if (!columnProp || !columnProp.isResult) return null;

    return columnProp.resultDataType || columnProp.data_type || "String";
  };

  const updateCellWithAttributeData = (attribute, sourceType) => {
    if (
      selectedRowColumnForAttribute.row === null ||
      selectedRowColumnForAttribute.column === null
    )
      return;

    // Get the selected row and column
    const { row, column } = selectedRowColumnForAttribute;

    // Create a deep copy to avoid reference issues
    const newConditions = JSON.parse(JSON.stringify(conditions));

    // Get the column property to identify the result key
    const columnProp = columnProperties[column];

    if (!columnProp || !columnProp.isResult || !columnProp.key) {
      console.error("Invalid column selected for attribute data");
      return;
    }

    // Format attribute data object similar to ResultButton
    const attributeDataValue = {
      source_type: sourceType,
      value: attribute.attribute,
      isAttributeData: true, // This flag is crucial
      data_type: attribute.data_type || "String",
      // Add timestamp to ensure this object is treated as new
      _timestamp: Date.now(),
    };

    console.log(
      `Setting attribute data for result column [${row}-${column}] ${columnProp.key}:`,
      {
        attributeValue: attributeDataValue,
        columnDataType:
          columnProp.data_type || columnProp.resultDataType || "String",
        originalAttribute: attribute,
      }
    );

    // Update the result value in the condition
    if (newConditions[row] && newConditions[row].result) {
      // Set the attribute data in the condition state
      newConditions[row].result[columnProp.key] = attributeDataValue;

      // Update UI with the new result value - store the display value in localInputValues
      const valueKey = `result-${row}-${columnProp.key}`;

      // Update local input value state for rendering
      setLocalInputValues((prev) => {
        console.log(`Updating localInputValues for ${valueKey}:`, {
          before: prev[valueKey],
          after: attribute.attribute,
        });
        return {
          ...prev,
          [valueKey]: attribute.attribute, // Store just the attribute name for display
        };
      });

      // Send update immediately to persist changes
      onUpdate(newConditions);

      // Force a refresh to verify the change was properly applied
      setTimeout(() => {
        console.log("Verifying attribute data after update:", {
          valueInState: conditions[row]?.result?.[columnProp.key],
          attributeDataFlagSet:
            conditions[row]?.result?.[columnProp.key]?.isAttributeData === true,
        });
      }, 500);
    }

    // Close the attribute selector
    setIsAttributeSelectorOpen(false);
    setSelectedRowColumnForAttribute({ row: null, column: null });
  };

  return (
    <div className="space-y-4">
      {/* Add Result Column Button */}
      <div className="mt-4 mb-4 flex justify-start">
        <button
          onClick={handleAddResultColumn}
          disabled={isReadOnly}
          className={`bg-blue-500 cursor-pointer text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition duration-150 ease-in-out flex items-center ${
            theme === "dark"
              ? "bg-blue-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <Plus size={18} className="mr-1" /> Add Result Column
        </button>
      </div>

      {/* Decision Table */}
      <div className="border rounded-md overflow-auto">
        <table
          className="w-full"
          key={`table-${columnProperties
            .map((prop) => `${prop.property}-${prop.operator}`)
            .join("_")}`}
        >
          <thead>
            <tr className="border-b">
              <th className="w-16 border-r p-4"></th>
              <th className="w-16 border-r p-4 text-center">#</th>

              {/* Column Headers with Property Selection */}
              {columnProperties.map((prop, columnIndex) => {
                // --- Render based on column type ---
                if (prop.isResult) {
                  // --- Result Column Header ---
                  return (
                    <th
                      key={`result-header-${columnIndex}-${prop.id}`}
                      // Add background, ensure padding works well
                      className="p-4 border-r align-top"
                      style={{ minWidth: "250px" }} // Adjust minWidth for results?
                    >
                      {/* Center content vertically and horizontally */}
                      <div className="flex flex-col items-center h-full">
                        <div className="flex justify-between items-center w-full mb-1">
                          {" "}
                          {/* Top row: Label (centered) + Buttons (right) */}
                          {/* Spacer to help center */}
                          <div className="w-12"></div>
                          {/* Result Key Label - Centered */}
                          <span className="font-semibold text-indigo-800 text-center flex-grow px-2">
                            {prop.key || "Result"}
                            {!prop.key && (
                              <span className="text-xs text-red-500 ml-1 block">
                                (Needs config)
                              </span>
                            )}
                          </span>
                          {/* Action Buttons: Delete only */}
                          <div className="flex items-center gap-1 flex-shrink-0 w-12 justify-end">
                            {" "}
                            {/* Fixed width for buttons */}
                            <button
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                preventScroll(e);
                                handleDeleteColumn(columnIndex);
                              }}
                              disabled={
                                columnProperties.length <= 1 || isReadOnly
                              } // Not disabled based on isFromAPI - delete always enabled
                              title="Delete Result Column"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        {/* Data Type Display - Commented Out */}
                        {/*
                        {prop.key && (
                          <div className="text-xs text-indigo-600 mt-1">
                            (
                            {prop.resultDataType ||
                              prop.displayLabel ||
                              prop.data_type ||
                              "String"}
                            )
                          </div>
                        )}
                        */}
                      </div>
                    </th>
                  );
                } else if (prop.is_group) {
                  // --- Group Column Header ---
                  return (
                    <th
                      key={`group-header-${columnIndex}`}
                      className="p-4 border-r align-top"
                      style={{ minWidth: "350px" }} // Adjust minWidth for groups?
                    >
                      <div className="flex justify-between items-center mb-2">
                        {/* Left side: Label, Add Inner Condition */}
                        <div className="flex items-center gap-2 ">
                          {/* AND/OR Dropdown - Render for ALL columns now */}
                          <select
                            // --- Value based on PARENT condition operator ---
                            value={
                              conditions[0]?.conditions[0]?.operator === "all"
                                ? "AND"
                                : "OR"
                            }
                            onChange={(e) => {
                              preventScroll(e);
                              handleColumnPropertyChange(
                                columnIndex,
                                "operator",
                                e.target.value === "AND" ? "all" : "any"
                              );
                            }}
                            // --- ClassName based on PARENT condition operator ---
                            className={`py-2 px-4 rounded-md border  ${
                              conditions[0]?.conditions[0]?.operator === "all"
                                ? theme === "dark"
                                  ? "border-green-500 bg-gray-700 text-white"
                                  : "border-green-500 bg-green-50 text-black"
                                : theme === "dark"
                                ? "border-orange-500 bg-gray-700 text-white"
                                : "border-orange-500 bg-orange-50 text-black"
                            } font-medium text-center`}
                            disabled={isReadOnly}
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                          {/* Condition/Group Label and Add Button */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {prop.is_group ? "Group" : "Condition"}{" "}
                              {/* REMOVED: ${columnIndex + 1} */}
                            </span>
                            {/* Show Add Inner Condition Button directly for Groups */}
                            {prop.is_group && (
                              <button
                                disabled={isReadOnly}
                                onClick={(e) => {
                                  e.preventDefault();
                                  preventScroll(e);
                                  handleAddInnerConditionToAllRows(columnIndex);
                                }}
                                className={`flex items-center text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 text-sm ${
                                  theme === "dark"
                                    ? "text-blue-500"
                                    : "text-blue-600"
                                }`}
                                title="Add Condition Slot to Group"
                              >
                                <Plus size={14} className="mr-1" /> Add
                                Condition
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Right side: Action Buttons */}
                        <div className="flex items-center gap-2 relative">
                          {/* Unified '+' icon button */}
                          <button
                            disabled={isReadOnly}
                            id={`toggle-${columnIndex}`} // Use consistent ID
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              preventScroll(e);
                              setShowPropertyDropdown(
                                showPropertyDropdown === columnIndex
                                  ? null
                                  : columnIndex
                              );
                            }}
                            className={`flex items-center p-1 rounded ${
                              prop.is_group
                                ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                : "text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                            }`}
                            title={
                              prop.is_group
                                ? "Add Column Nearby"
                                : "Add Condition/Group"
                            }
                          >
                            <Plus size={20} />
                          </button>
                          {/* Delete Column Button (Common) */}
                          <button
                            className="text-red-500 hover:text-red-700 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              preventScroll(e);
                              handleDeleteColumn(columnIndex);
                            }}
                            disabled={
                              columnProperties.length <= 1 || isReadOnly
                            }
                          >
                            <Trash2 size={20} />
                          </button>
                          {/* Standard Popup for Add Condition/Group */}
                          {showPropertyDropdown === columnIndex && (
                            <div
                              id={`popup-${columnIndex}`}
                              className={`absolute bg-white border rounded-md shadow-lg z-50 w-48 ${
                                theme === "dark"
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-white border-gray-300"
                              }`}
                              style={{
                                top: "30px",
                                right: "0",
                                position: "absolute",
                              }}
                            >
                              <div
                                className={`py-1 ${
                                  theme === "dark"
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-gray-300"
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    preventScroll(e);
                                    handleAddConditionAtPosition(columnIndex);
                                    setShowPropertyDropdown(null);
                                  }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 hover:bg-gray-100 ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  Add Condition
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    preventScroll(e);
                                    handleAddGroupAtPosition(columnIndex);
                                    setShowPropertyDropdown(null);
                                  }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 hover:bg-gray-100 ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  Add Group
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom part of header: Property Selectors (only for Groups) */}
                      {prop.is_group && (
                        <div className="mt-2 flex space-x-3 overflow-x-auto pb-2 border-t pt-2 items-center">
                          {" "}
                          {/* Added items-center */}
                          {/* Use first row's structure as template for header controls */}
                          {(
                            conditions[0]?.conditions?.[0]?.rules?.[columnIndex]
                              ?.rules ?? []
                          ).map((innerRuleTemplate, innerRuleIndex) => (
                            <React.Fragment
                              key={`header-group-item-${columnIndex}-${innerRuleIndex}`}
                            >
                              {/* Add AND/OR Dropdown BETWEEN property selectors */}
                              {innerRuleIndex > 0 && (
                                <div className="flex-shrink-0 px-1">
                                  {" "}
                                  {/* Wrapper for spacing */}
                                  <select
                                    value={
                                      columnProperties[columnIndex]
                                        ?.operator === "all"
                                        ? "AND"
                                        : "OR"
                                    }
                                    onChange={(e) => {
                                      preventScroll(e);
                                      // Call the NEW handler specific to the group's operator
                                      handleGroupOperatorChange(
                                        columnIndex,
                                        e.target.value === "AND" ? "all" : "any"
                                      );
                                    }}
                                    className={`py-1 px-2 rounded-md border text-xs ${
                                      columnProperties[columnIndex]
                                        ?.operator === "all"
                                        ? theme === "dark"
                                          ? "border-green-500 bg-gray-700 text-white"
                                          : "border-green-500 bg-green-50 text-black"
                                        : theme === "dark"
                                        ? "border-orange-500 bg-gray-700 text-white"
                                        : "border-orange-500 bg-orange-50 text-black"
                                    } font-medium text-center`}
                                    disabled={isReadOnly}
                                  >
                                    <option value="AND">AND</option>
                                    <option value="OR">OR</option>
                                  </select>
                                </div>
                              )}

                              {/* Property Selector Box (Select + Delete Button) */}
                              <div className="flex items-center space-x-1 flex-shrink-0 w-64">
                                {/* Property Selection (controls all rows) */}
                                <select
                                  value={innerRuleTemplate.property || ""}
                                  onChange={(e) => {
                                    preventScroll(e);
                                    handleInnerPropertyChange(
                                      columnIndex,
                                      innerRuleIndex,
                                      e.target.value
                                    );
                                  }}
                                  className={`w-full py-3 px-4 appearance-none rounded-md border border-gray-300 ${
                                    theme === "dark"
                                      ? "bg-gray-700"
                                      : "bg-white"
                                  }`}
                                  disabled={isReadOnly}
                                >
                                  <option value="">Select Property</option>
                                  {/* ... options ... */}
                                  {inputAttributes.length === 0 && (
                                    <option disabled>
                                      Loading attributes...
                                    </option>
                                  )}
                                  <optgroup label="GLOBAL ATTRIBUTES">
                                    {inputAttributes
                                      .filter(
                                        (attr) =>
                                          attr.source_type ===
                                          "global_attributes"
                                      )
                                      .map((attr) => (
                                        <option key={attr.id} value={attr.name}>
                                          {attr.name} - {attr.data_type}
                                        </option>
                                      ))}
                                    {inputAttributes.filter(
                                      (attr) =>
                                        attr.source_type === "global_attributes"
                                    ).length === 0 &&
                                      inputAttributes.length > 0 && (
                                        <option disabled>
                                          No global attributes available
                                        </option>
                                      )}
                                  </optgroup>
                                  <optgroup label="INPUT ATTRIBUTES">
                                    {inputAttributes
                                      .filter(
                                        (attr) =>
                                          attr.source_type ===
                                          "input_attributes"
                                      )
                                      .map((attr) => (
                                        <option key={attr.id} value={attr.name}>
                                          {attr.name} - {attr.data_type}
                                        </option>
                                      ))}
                                    {inputAttributes.filter(
                                      (attr) =>
                                        attr.source_type === "input_attributes"
                                    ).length === 0 &&
                                      inputAttributes.length > 0 && (
                                        <option disabled>
                                          No input attributes available
                                        </option>
                                      )}
                                  </optgroup>
                                </select>

                                {/* Delete Button - Re-added next to select */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    preventScroll(e);
                                    handleDeleteInnerCondition(
                                      columnIndex,
                                      innerRuleIndex
                                    );
                                  }}
                                  disabled={isReadOnly}
                                  className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                  title="Delete Condition Slot"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </React.Fragment>
                          ))}
                          {/* Placeholder if no inner conditions exist yet */}
                          {(
                            conditions[0]?.conditions?.[0]?.rules?.[columnIndex]
                              ?.rules ?? []
                          ).length === 0 && (
                            <div className="text-gray-500 text-sm p-3 min-h-[60px] flex items-center justify-center w-full">
                              Click '+ Add Condition' above to add properties.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Regular Property Dropdown (only for non-group columns) */}
                      {!prop.is_group && (
                        <div className="mt-2">
                          <div className="rounded-md border border-blue-400 overflow-hidden">
                            <select
                              value={prop.property || ""}
                              onChange={(e) => {
                                preventScroll(e);
                                handleColumnPropertyChange(
                                  columnIndex,
                                  "property",
                                  e.target.value
                                );
                              }}
                              className={`w-full py-3 px-4 appearance-none rounded-md border border-gray-300 ${
                                theme === "dark" ? "bg-gray-700" : "bg-white"
                              }`}
                              disabled={isReadOnly}
                            >
                              <option value="">Select Property</option>
                              {inputAttributes.length === 0 && (
                                <option disabled>Loading attributes...</option>
                              )}
                              <optgroup label="GLOBAL ATTRIBUTES">
                                {inputAttributes
                                  .filter(
                                    (attr) =>
                                      attr.source_type === "global_attributes"
                                  )
                                  .map((attr) => (
                                    <option key={attr.id} value={attr.name}>
                                      {attr.name} - {attr.data_type}
                                    </option>
                                  ))}
                                {inputAttributes.filter(
                                  (attr) =>
                                    attr.source_type === "global_attributes"
                                ).length === 0 &&
                                  inputAttributes.length > 0 && (
                                    <option disabled>
                                      No global attributes available
                                    </option>
                                  )}
                              </optgroup>
                              <optgroup label="INPUT ATTRIBUTES">
                                {inputAttributes
                                  .filter(
                                    (attr) =>
                                      attr.source_type === "input_attributes"
                                  )
                                  .map((attr) => (
                                    <option key={attr.id} value={attr.name}>
                                      {attr.name} - {attr.data_type}
                                    </option>
                                  ))}
                                {inputAttributes.filter(
                                  (attr) =>
                                    attr.source_type === "input_attributes"
                                ).length === 0 &&
                                  inputAttributes.length > 0 && (
                                    <option disabled>
                                      No input attributes available
                                    </option>
                                  )}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      )}
                    </th>
                  );
                } else {
                  // --- Regular Condition Header ---
                  return (
                    <th
                      key={`condition-header-${columnIndex}`}
                      className="p-4 border-r align-top"
                      style={{ minWidth: "350px" }} // Adjust minWidth for conditions?
                    >
                      {/* Top part of header: Label, Buttons */}
                      <div className="flex justify-between items-center mb-2">
                        {/* Left side: Label, Add Inner Condition */}
                        <div className="flex items-center gap-2">
                          {/* AND/OR Dropdown - Render for ALL columns now */}
                          <select
                            // --- Value based on PARENT condition operator ---
                            value={
                              conditions[0]?.conditions[0]?.operator === "all"
                                ? "AND"
                                : "OR"
                            }
                            onChange={(e) => {
                              preventScroll(e);
                              handleColumnPropertyChange(
                                columnIndex,
                                "operator",
                                e.target.value === "AND" ? "all" : "any"
                              );
                            }}
                            // --- ClassName based on PARENT condition operator ---
                            className={`py-2 px-4 rounded-md border ${
                              conditions[0]?.conditions[0]?.operator === "all"
                                ? theme === "dark"
                                  ? "border-green-500 bg-gray-700 text-white"
                                  : "border-green-500 bg-green-50 text-black"
                                : theme === "dark"
                                ? "border-orange-500 bg-gray-700 text-white"
                                : "border-orange-500 bg-orange-50 text-black"
                            } font-medium text-center`}
                            disabled={isReadOnly}
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                          {/* Condition/Group Label and Add Button */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {prop.is_group ? "Group" : "Condition"}{" "}
                              {/* REMOVED: ${columnIndex + 1} */}
                            </span>
                            {/* Show Add Inner Condition Button directly for Groups */}
                            {prop.is_group && (
                              <button
                                disabled={isReadOnly}
                                onClick={(e) => {
                                  e.preventDefault();
                                  preventScroll(e);
                                  handleAddInnerConditionToAllRows(columnIndex);
                                }}
                                className="flex items-center text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 text-sm"
                                title="Add Condition Slot to Group"
                              >
                                <Plus size={14} className="mr-1" /> Add
                                Condition
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Right side: Action Buttons */}
                        <div className="flex items-center gap-2 relative">
                          {/* Unified '+' icon button */}
                          <button
                            disabled={isReadOnly}
                            id={`toggle-${columnIndex}`} // Use consistent ID
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              preventScroll(e);
                              setShowPropertyDropdown(
                                showPropertyDropdown === columnIndex
                                  ? null
                                  : columnIndex
                              );
                            }}
                            className={`flex items-center p-1 rounded ${
                              prop.is_group
                                ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                : "text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                            }`}
                            title={
                              prop.is_group
                                ? "Add Column Nearby"
                                : "Add Condition/Group"
                            }
                          >
                            <Plus size={20} />
                          </button>
                          {/* Delete Column Button (Common) */}
                          <button
                            className="text-red-500 hover:text-red-700 p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              preventScroll(e);
                              handleDeleteColumn(columnIndex);
                            }}
                            disabled={
                              columnProperties.length <= 1 || isReadOnly
                            }
                          >
                            <Trash2 size={20} />
                          </button>
                          {/* Standard Popup for Add Condition/Group */}
                          {showPropertyDropdown === columnIndex && (
                            <div
                              id={`popup-${columnIndex}`}
                              className="absolute bg-white border rounded-md shadow-lg z-50 w-48"
                              style={{
                                top: "30px",
                                right: "0",
                                position: "absolute",
                              }}
                            >
                              <div
                                className={`py-1 ${
                                  theme === "dark"
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-gray-300"
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    preventScroll(e);
                                    handleAddConditionAtPosition(columnIndex);
                                    setShowPropertyDropdown(null);
                                  }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 hover:bg-gray-100 ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  Add Condition
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    preventScroll(e);
                                    handleAddGroupAtPosition(columnIndex);
                                    setShowPropertyDropdown(null);
                                  }}
                                  className={`w-full cursor-pointer text-left px-4 py-2 hover:bg-gray-100 ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  Add Group
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom part of header: Property Selectors (only for non-group columns) */}
                      {!prop.is_group && (
                        <div className="mt-2">
                          <div className="rounded-md border border-blue-400 overflow-hidden">
                            <select
                              value={prop.property || ""}
                              onChange={(e) => {
                                preventScroll(e);
                                handleColumnPropertyChange(
                                  columnIndex,
                                  "property",
                                  e.target.value
                                );
                              }}
                              className={`w-full py-3 px-4 appearance-none rounded-md border border-gray-300 ${
                                theme === "dark" ? "bg-gray-700" : "bg-white"
                              }`}
                              disabled={isReadOnly}
                            >
                              <option value="">Select Property</option>
                              {inputAttributes.length === 0 && (
                                <option disabled>Loading attributes...</option>
                              )}
                              <optgroup label="GLOBAL ATTRIBUTES">
                                {inputAttributes
                                  .filter(
                                    (attr) =>
                                      attr.source_type === "global_attributes"
                                  )
                                  .map((attr) => (
                                    <option key={attr.id} value={attr.name}>
                                      {attr.name} - {attr.data_type}
                                    </option>
                                  ))}
                                {inputAttributes.filter(
                                  (attr) =>
                                    attr.source_type === "global_attributes"
                                ).length === 0 &&
                                  inputAttributes.length > 0 && (
                                    <option disabled>
                                      No global attributes available
                                    </option>
                                  )}
                              </optgroup>
                              <optgroup label="INPUT ATTRIBUTES">
                                {inputAttributes
                                  .filter(
                                    (attr) =>
                                      attr.source_type === "input_attributes"
                                  )
                                  .map((attr) => (
                                    <option key={attr.id} value={attr.name}>
                                      {attr.name} - {attr.data_type}
                                    </option>
                                  ))}
                                {inputAttributes.filter(
                                  (attr) =>
                                    attr.source_type === "input_attributes"
                                ).length === 0 &&
                                  inputAttributes.length > 0 && (
                                    <option disabled>
                                      No input attributes available
                                    </option>
                                  )}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      )}
                    </th>
                  );
                }
              })}
            </tr>
          </thead>
          <tbody>
            {conditions.map((condition, rowIndex) => (
              <tr
                key={`${condition.id || rowIndex}-${JSON.stringify(
                  condition.conditions
                )}`}
                className="border-b"
              >
                {/* Toggle column */}
                <td className="border-r p-4 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={condition.enabled}
                        onChange={() => handleToggleEnabled(rowIndex)}
                        disabled={isReadOnly}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <div className="relative inline-block">
                      <button
                        disabled={isReadOnly}
                        id={`row-toggle-${rowIndex}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          preventScroll(e);
                          setActiveRowMenu(
                            activeRowMenu === rowIndex ? null : rowIndex
                          );
                        }}
                        className={`text-gray-600 cursor-pointer p-1 ${
                          theme === "dark"
                            ? "hover:text-blue-500 "
                            : "hover:text-gray-900 "
                        }`}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeRowMenu === rowIndex && (
                        <div
                          id={`row-menu-${rowIndex}`}
                          className="absolute bg-white border rounded-md shadow-lg z-50 w-40"
                          style={{
                            top: "30px",
                            left: "0",
                            position: "absolute",
                          }}
                        >
                          <ul
                            className={`py-1 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white"
                                : "bg-white text-black"
                            }`}
                          >
                            <li>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  preventScroll(e);
                                  handleRowAction("add_above", rowIndex);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 ${
                                  theme === "dark"
                                    ? "hover:bg-blue-700"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                Add Row Above
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  preventScroll(e);
                                  handleRowAction("add_below", rowIndex);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 ${
                                  theme === "dark"
                                    ? "hover:bg-blue-700"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                Add Row Below
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  preventScroll(e);
                                  handleRowAction("duplicate", rowIndex);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 ${
                                  theme === "dark"
                                    ? "hover:bg-blue-700"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                Duplicate Row
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  preventScroll(e);
                                  handleRowAction("delete", rowIndex);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 ${
                                  theme === "dark"
                                    ? "text-red-500 hover:bg-gray-300"
                                    : "text-red-600 hover:bg-gray-100"
                                }`}
                              >
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Row number column */}
                <td className="border-r p-4 text-center font-semibold">
                  {rowIndex + 1}
                </td>

                {/* Row cells - one for each column property - Updated to use rules from first condition */}
                {columnProperties.map((columnProp, columnIndex) => {
                  // Get the rule from the first condition's rules array at columnIndex
                  // This is only relevant for condition/group columns
                  const rule = condition.conditions[0]?.rules?.[columnIndex];

                  // --- Render cell based on column type ---
                  if (columnProp.isResult) {
                    // --- Result Cell ---
                    const isDisabled =
                      isReadOnly ||
                      (columnProp.isFromAPI && !condition.isNewRow); // Corrected Logic
                    console.log(
                      `Result Cell Render [${rowIndex}-${columnIndex}]: isReadOnly=${isReadOnly}, isFromAPI=${
                        columnProp.isFromAPI
                      }, isNewRow=${!!condition.isNewRow}, Calculated Disabled=${isDisabled}`
                    ); // Updated Log
                    return (
                      <td
                        key={`result-cell-${rowIndex}-${columnIndex}-${columnProp.id}`}
                        className="p-6 border-r" // Use same padding as regular condition
                        style={{ minWidth: "250px" }} // Match header minWidth?
                      >
                        {/* Check if key is configured before rendering input */}
                        {columnProp.key ? (
                          <div className="rounded-md border border-gray-300 overflow-hidden bg-white shadow-sm">
                            {renderValueInput(
                              rowIndex,
                              columnIndex, // Still needed for context?
                              null, // No specific 'rule' for result cell
                              columnProp, // Pass the result column config
                              isDisabled, // Use the corrected calculated disabled state
                              0, // Default ruleIndex
                              handleResultValueChange // <-- Pass correct handler
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 text-center p-3">
                            Configure Key
                          </div>
                        )}
                      </td>
                    );
                  } else if (rule?.is_group) {
                    // --- Group Cell ---
                    // Ensure group rule has a rules array
                    const innerRules = Array.isArray(rule.rules)
                      ? rule.rules
                      : [];

                    return (
                      <td
                        key={`group-${columnIndex}-${rule.id}-${refresh}`}
                        className="p-4 border-r align-top" // Use align-top
                        style={{ minWidth: "350px" }}
                      >
                        {/* Directly render Operator/Value inputs based on header properties */}
                        <div className="space-y-3">
                          {/* REMOVED Container for Inner Condition Boxes (Property Selects) */}
                          {/* <div className="flex space-x-3 overflow-x-auto pb-2"> ... </div> */}

                          {/* Container for Operator and Value Inputs */}
                          {/* Ensure this container is always rendered if the column is a group, */}
                          {/* but map over innerRules which might be empty initially */}
                          <div className="flex space-x-4 overflow-x-auto pt-6 items-center">
                            {" "}
                            {/* Added items-center for spacers */}
                            {innerRules.map((innerRule, innerRuleIndex) => {
                              // Get the shared property info from the header (using first row as template)
                              const sharedProperty =
                                conditions[0]?.conditions?.[0]?.rules?.[
                                  columnIndex
                                ]?.rules?.[innerRuleIndex]?.property;

                              // Continue with existing code
                              const propertyOperators = sharedProperty
                                ? operators[sharedProperty] || []
                                : [];
                              const hideValue =
                                innerRule.operator &&
                                (innerRule.operator.toLowerCase() === "any" ||
                                  innerRule.operator.toLowerCase() ===
                                    "exists");
                              const sharedDataType =
                                conditions[0]?.conditions?.[0]?.rules?.[
                                  columnIndex
                                ]?.rules?.[innerRuleIndex]?.data_type ||
                                "String";

                              return (
                                // Use React.Fragment to allow conditional spacer
                                <React.Fragment
                                  key={`${
                                    innerRule.id || innerRuleIndex
                                  }-inputs-fragment`}
                                >
                                  {/* Add Spacer matching the AND/OR dropdown width in header */}
                                  {innerRuleIndex > 0 && (
                                    <div className="flex-shrink-0 w-14"></div> // Spacer div (adjust width w-12, w-14, w-16 as needed)
                                  )}

                                  {/* Operator/Value Box */}
                                  <div className="flex-shrink-0 w-64 space-y-4">
                                    {/* Operator Selection */}
                                    <div className="rounded-md border border-gray-300 overflow-hidden">
                                      <select
                                        // Value comes from the specific cell's innerRule
                                        value={innerRule.operator || ""}
                                        onChange={(e) =>
                                          handleInnerOperatorChange(
                                            rowIndex, // Use current row index
                                            columnIndex,
                                            innerRuleIndex,
                                            e.target.value
                                          )
                                        }
                                        // Apply consistent styling
                                        className={`w-full py-3 px-4 rounded-md border border-gray-300 ${
                                          theme === "dark"
                                            ? "bg-gray-700"
                                            : "bg-white"
                                        }`}
                                        // Enable based on shared property being selected in header
                                        disabled={isReadOnly || !sharedProperty}
                                      >
                                        <option value="">
                                          Select Operator
                                        </option>
                                        {/* Populate based on shared property */}
                                        {propertyOperators.length === 0 &&
                                          sharedProperty && (
                                            <option disabled>Loading...</option>
                                          )}
                                        {propertyOperators.map((op) => (
                                          <option key={op.id} value={op.key}>
                                            {op.name}
                                          </option>
                                        ))}
                                        {propertyOperators.length === 0 &&
                                          !sharedProperty && (
                                            <option disabled>
                                              Select property in header
                                            </option>
                                          )}
                                      </select>
                                    </div>
                                    {/* Value Input */}
                                    {!hideValue && (
                                      <div className="rounded-md border border-gray-300 overflow-hidden bg-white shadow-sm">
                                        {/* Call renderValueInput for inner rules, passing actual columnProp */}
                                        {renderValueInput(
                                          rowIndex, // Current row
                                          columnIndex, // Current column
                                          innerRule, // The specific inner rule for this cell (contains op, val, data_type)
                                          columnProperties[columnIndex], // Pass the actual columnProp for this column
                                          isReadOnly || !innerRule.operator, // Disabled state
                                          innerRuleIndex, // The index of this inner rule
                                          handleInnerValueChange // <-- Pass correct handler
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </React.Fragment>
                              );
                            })}
                            {/* Placeholder if no inner conditions exist (slots created from header) */}
                            {innerRules.length === 0 && (
                              <div className="text-gray-500 text-sm p-3 min-h-[60px] flex items-center justify-center w-full">
                                Add condition slots from header.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  } else if (rule) {
                    // --- Regular Condition Cell ---
                    const hideValue =
                      rule.operator &&
                      (rule.operator.toLowerCase() === "any" ||
                        rule.operator.toLowerCase() === "exists");

                    const conditionGroup = condition.conditions[0]; // Only use the first condition
                    const propertyOperators =
                      operators[columnProp.property] || [];

                    return (
                      <td
                        key={`${columnIndex}-${conditionGroup?.operator}-${refresh}`}
                        className="p-6 border-r"
                        style={{ minWidth: "350px" }}
                      >
                        <div className="space-y-4">
                          {/* Operator dropdown */}
                          <div className="rounded-md border border-gray-300 overflow-hidden">
                            <select
                              value={rule.operator || ""}
                              onChange={(e) => {
                                preventScroll(e);
                                handleOperatorChange(
                                  rowIndex,
                                  columnIndex,
                                  e.target.value
                                );
                              }}
                              className={`w-full py-3 px-4 rounded-md border border-gray-300 ${
                                theme === "dark" ? "bg-gray-700" : "bg-white"
                              }`}
                              disabled={isReadOnly || !columnProp.property}
                            >
                              <option value="">Select Operator</option>
                              {propertyOperators.length === 0 &&
                                columnProp.property && (
                                  <option disabled>Loading operators...</option>
                                )}
                              {propertyOperators.map((op) => (
                                <option key={op.id} value={op.key}>
                                  {op.name}
                                </option>
                              ))}
                              {propertyOperators.length === 0 &&
                                !columnProp.property && (
                                  <option disabled>
                                    Select a property first
                                  </option>
                                )}
                            </select>
                          </div>

                          {/* Value Input - only shown if operator isn't Any/Exists */}
                          {!hideValue && (
                            <div className="rounded-md border border-gray-300 overflow-hidden bg-white shadow-sm mt-2">
                              {renderValueInput(
                                rowIndex,
                                columnIndex,
                                rule,
                                columnProp,
                                isReadOnly,
                                0, // ruleIndex is 0 for non-group conditions
                                handleValueChange // <-- Pass correct handler
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  } else {
                    // Fallback for safety, should ideally not happen if columnProperties and conditions are synced
                    return (
                      <td
                        key={`empty-${rowIndex}-${columnIndex}`}
                        className="p-4 border-r"
                      ></td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      {!isReadOnly && (
        <div className="flex justify-start mt-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              preventScroll(e);
              handleAddRow();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border border-purple-700  text-purple-700 cursor-pointer  ${
              theme === "dark"
                ? "hover:text-gray-300 bg-purple-700 text-white"
                : "hover:text-purple-700 bg-white"
            }`}
          >
            <Plus
              size={16}
              className={`${
                theme === "dark" ? "text-white" : "text-purple-700"
              }`}
            />
            Add Row
          </button>
        </div>
      )}

      {/* JSON Output for Debugging */}
      {/* {process.env.NODE_ENV === "development" && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">JSON Output:</h2>
          <pre
            className={`${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100"
            } p-4 rounded overflow-x-auto`}
          >
            {JSON.stringify(conditions, null, 2)}
          </pre>
        </div>
      )} */}

      {/* --- Render the Result Config Popup --- */}
      {showResultConfigPopupIndex !== null && (
        <ResultConfigPopup
          onSave={(config) =>
            handleSaveResultConfig(showResultConfigPopupIndex, config)
          }
          onCancel={handleCancelResultConfig}
          initialConfig={
            typeof showResultConfigPopupIndex === "number" &&
            columnProperties[showResultConfigPopupIndex]
              ? {
                  key: columnProperties[showResultConfigPopupIndex].key || "",
                  name:
                    columnProperties[showResultConfigPopupIndex].resultName ||
                    "",
                  dataType:
                    columnProperties[showResultConfigPopupIndex]
                      .resultDataType || "String",
                }
              : { key: "", name: "", dataType: "String" }
          }
        />
      )}

      {/* Attribute Selector Modal */}
      {isAttributeSelectorOpen && (
        <div
          style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
          className={`fixed inset-0 z-70 flex items-center justify-center`}
        >
          <div
            className={`w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] max-w-lg p-6 rounded-lg shadow-lg ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            }`}
            ref={attributeSelectorRef}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                Select Attribute Data Source
              </h3>
              <button
                onClick={() => setIsAttributeSelectorOpen(false)}
                className={`p-2 cursor-pointer rounded-md ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={20} />
              </button>
            </div>
            {/* Add subtitle showing filtered data type */}
            {getSelectedResultColumnDataType() && (
              <div
                className={`text-sm mb-2 ${
                  theme === "dark" ? "text-blue-300" : "text-blue-600"
                }`}
              >
                Showing attributes with data type:{" "}
                <strong>{getSelectedResultColumnDataType()}</strong>
              </div>
            )}
            <hr
              className={
                theme === "dark" ? "border-gray-700" : "border-gray-300"
              }
            />

            <div className="mt-4 max-h-80 overflow-y-auto">
              {isLoadingAttributes && (
                <div className="p-4 text-center">Loading attributes...</div>
              )}
              {errorAttributes && (
                <div className="p-4 text-center text-red-500">
                  {errorAttributes}
                </div>
              )}
              {!isLoadingAttributes && !errorAttributes && (
                <>
                  {/* Global Attributes */}
                  {fetchedAttributes.global_attributes.length > 0 && (
                    <div>
                      <button
                        onClick={() =>
                          toggleAttributeGroup("Global Attributes")
                        }
                        className={`flex justify-between items-center w-full px-4 py-2 font-semibold text-left ${
                          theme === "dark"
                            ? "hover:bg-gray-700 text-white"
                            : "hover:bg-gray-100 text-black"
                        } `}
                      >
                        <span className="font-bold">Global Attributes</span>
                        {expandedAttributeGroups["Global Attributes"] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      {expandedAttributeGroups["Global Attributes"] && (
                        <div className="pl-4">
                          {/* Filter global attributes based on column data type */}
                          {fetchedAttributes.global_attributes
                            .filter((attr) => {
                              const requiredDataType =
                                getSelectedResultColumnDataType();
                              // If no specific data type required, or types match, include the attribute
                              return (
                                !requiredDataType ||
                                attr.data_type === requiredDataType
                              );
                            })
                            .map((attr) => (
                              <button
                                key={attr._id || attr.id}
                                onClick={() =>
                                  updateCellWithAttributeData(
                                    attr,
                                    "global_attributes"
                                  )
                                }
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  theme === "dark"
                                    ? "hover:bg-gray-700 text-white"
                                    : "hover:bg-gray-100 text-black"
                                }`}
                              >
                                <div className="font-medium cursor-pointer flex items-center gap-5">
                                  <span
                                    className={`${
                                      theme === "dark"
                                        ? "text-blue-300"
                                        : "text-blue-600"
                                    }  text-lg `}
                                  >
                                    {attr.attribute}
                                  </span>
                                  <span
                                    className={`text-gray-500 ${
                                      theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {attr.data_type}
                                  </span>
                                </div>
                              </button>
                            ))}

                          {/* Show message when no attributes match the filter */}
                          {fetchedAttributes.global_attributes.length > 0 &&
                            fetchedAttributes.global_attributes.filter(
                              (attr) => {
                                const requiredDataType =
                                  getSelectedResultColumnDataType();
                                return (
                                  !requiredDataType ||
                                  attr.data_type === requiredDataType
                                );
                              }
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500 italic">
                                No matching attributes with this data type.
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Attributes */}
                  {fetchedAttributes.input_attributes.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleAttributeGroup("Input Attributes")}
                        className={`flex justify-between items-center w-full px-4 py-2 font-semibold text-left ${
                          theme === "dark"
                            ? "hover:bg-gray-700 text-white"
                            : "hover:bg-gray-100 text-black"
                        }`}
                      >
                        <span className="font-bold">Input Attributes</span>
                        {expandedAttributeGroups["Input Attributes"] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      {expandedAttributeGroups["Input Attributes"] && (
                        <div className="pl-4">
                          {/* Filter input attributes based on column data type */}
                          {fetchedAttributes.input_attributes
                            .filter((attr) => {
                              const requiredDataType =
                                getSelectedResultColumnDataType();
                              // If no specific data type required, or types match, include the attribute
                              return (
                                !requiredDataType ||
                                attr.data_type === requiredDataType
                              );
                            })
                            .map((attr) => (
                              <button
                                key={attr._id || attr.id}
                                onClick={() =>
                                  updateCellWithAttributeData(
                                    attr,
                                    "input_attributes"
                                  )
                                }
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  theme === "dark"
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                <div className="font-medium cursor-pointer flex items-center gap-5">
                                  <span
                                    className={`${
                                      theme === "dark"
                                        ? "text-blue-300"
                                        : "text-blue-600"
                                    }  text-lg `}
                                  >
                                    {attr.attribute}
                                  </span>
                                  <span
                                    className={`text-gray-500 ${
                                      theme === "dark"
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {attr.data_type}
                                  </span>
                                </div>
                              </button>
                            ))}

                          {/* Show message when no attributes match the filter */}
                          {fetchedAttributes.input_attributes.length > 0 &&
                            fetchedAttributes.input_attributes.filter(
                              (attr) => {
                                const requiredDataType =
                                  getSelectedResultColumnDataType();
                                return (
                                  !requiredDataType ||
                                  attr.data_type === requiredDataType
                                );
                              }
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500 italic">
                                No matching attributes with this data type.
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No attributes message */}
                  {fetchedAttributes.global_attributes.length === 0 &&
                    fetchedAttributes.input_attributes.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No attributes found.
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionBuilderContainer;
