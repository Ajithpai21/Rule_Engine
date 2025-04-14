import AddDataSource from "@/components/Rule_Components/AddDataSource";
import AddInputAttribute from "@/components/Rule_Components/AddInputAttribute";
import TriggerSchedular from "@/components/Rule_Components/TriggerSchedular";
import { X, Plus } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import RuleResultSection from "@/components/Rule_Components/RuleResultSection";
import ConditionBuilder from "@/components/Rule_Components/ConditionBuilder";
import TestRule from "../components/Rule_Components/TestRule";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const CreateSimpleRule = ({ setOnClose }) => {
  const theme = useSelector((state) => state.theme.mode);
  const [firstSave, setFirstSave] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isInputAttribute, setIsInputAttribute] = useState(false);
  const [isDataSource, setIsDataSource] = useState(false);
  const [isTestRule, setIsTestRule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentConditions, setCurrentConditions] = useState({
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
  const [thenResult, setThenResult] = useState([]);
  const [elseResult, setElseResult] = useState([]);
  const [actions, setActions] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isTested, setIsTested] = useState(false);

  // For then/else dictionaries
  const thenResultDict = useMemo(() => {
    const dict = {};
    if (Array.isArray(thenResult)) {
      thenResult.forEach((item) => {
        if (
          item &&
          typeof item === "object" &&
          item.key &&
          item.value !== undefined
        ) {
          dict[item.key] = item.value;
        }
      });
    }
    return dict;
  }, [thenResult]);

  const elseResultDict = useMemo(() => {
    const dict = {};
    if (Array.isArray(elseResult)) {
      elseResult.forEach((item) => {
        if (
          item &&
          typeof item === "object" &&
          item.key &&
          item.value !== undefined
        ) {
          dict[item.key] = item.value;
        }
      });
    }
    return dict;
  }, [elseResult]);

  console.log("thenResult", thenResult);
  console.log("elseResult", elseResult);

  // For debugging current conditions - placed at a better location
  useEffect(() => {
    // Only log meaningful changes to avoid spamming the console
    if (
      currentConditions &&
      currentConditions.rules &&
      currentConditions.rules.length > 0 &&
      currentConditions.rules[0].property
    ) {
      console.log(
        "Meaningful conditions update in CreateSimpleRule:",
        JSON.stringify(currentConditions).substring(0, 100) + "..."
      );
    }
  }, [currentConditions]);

  const handleConditionChange = (conditionGroup) => {
    // Don't log the full object here to reduce console spam
    console.log(
      "Condition Changed - properties with values:",
      conditionGroup.rules?.filter((r) => r.property && r.operator).length || 0
    );
    setCurrentConditions(conditionGroup);
  };

  const handleDeleteAction = (id) => {
    setIsTested(false);
    setActions(actions.filter((action) => action.id !== id));
  };

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const buttonClass =
    "flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium";
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-gray-100";

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setOnClose(), 300);
  };

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const saveRule = async () => {
    if (firstSave) {
      try {
        setIsSaving(true);
        const conditions = [currentConditions] || [];

        // Get actions from your action components if available
        const actionsData = actions || [];

        // Create result details from the thenResult and elseResult
        const resultDetails = [];
        if (thenResult && thenResult.length > 0) {
          resultDetails.push({
            ...thenResultDict,
            value: true,
          });
        }
        if (elseResult && elseResult.length > 0) {
          resultDetails.push({
            ...elseResultDict,
            value: false,
          });
        }

        const conditions_test = [currentConditions];
        const updated_thenResult = { ...thenResultDict, value: true };
        const updated_elseResult = { ...elseResultDict, value: false };

        const data = {
          rule_id: sessionStorage.getItem("type_id"),
          name: sessionStorage.getItem("name"),
          description: sessionStorage.getItem("description") || "",
          conditions: conditions_test,
          actions: actions || [{}],
          result: {
            details:
              updated_elseResult && updated_thenResult
                ? [updated_thenResult, updated_elseResult]
                : updated_elseResult
                ? [updated_elseResult]
                : updated_thenResult
                ? [updated_thenResult]
                : [],
          },
        };

        const payload = {
          user: user,
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
          rule_type: sessionStorage.getItem("rule_type"),
          api_key: sessionStorage.getItem("api_key"),
          data: data,
        };

        // Make the API call
        const response = await axios.post(
          "https://micro-solution-ruleengineprod.mfilterit.net/addRules_RuleSet",
          payload
        );

        if (response.data.status === "Success") {
          toast.success(response.data.message || "Rule saved successfully!");
          setIsSaved(true);
          setFirstSave(false);
        } else {
          toast.error(response.data.message || "Failed to save rule");
        }
      } catch (error) {
        console.error("Error saving rule:", error);
        toast.error(error.message || "An error occurred while saving the rule");
      } finally {
        setIsSaving(false);
      }
    } else {
      try {
        setIsSaving(true);
        // Create result details from the thenResult and elseResult
        const resultDetails = [];
        if (thenResult && thenResult.length > 0) {
          resultDetails.push({
            ...thenResultDict,
            value: true,
          });
        }
        if (elseResult && elseResult.length > 0) {
          resultDetails.push({
            ...elseResultDict,
            value: false,
          });
        }

        const conditions = [currentConditions];
        const updated_thenResult = { ...thenResultDict, value: true };
        const updated_elseResult = { ...elseResultDict, value: false };

        const data = {
          workspace_id: sessionStorage.getItem("workspace_id"),
          rule_id: sessionStorage.getItem("type_id"),
          name: sessionStorage.getItem("name"),
          description: sessionStorage.getItem("description") || "",
          conditions: conditions,
          actions: actions || [{}],
          result: {
            details:
              updated_elseResult && updated_thenResult
                ? [updated_thenResult, updated_elseResult]
                : updated_elseResult
                ? [updated_elseResult]
                : updated_thenResult
                ? [updated_thenResult]
                : [],
          },
        };

        const payload = {
          user: user,
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
          rule_type: sessionStorage.getItem("rule_type"),
          api_key: sessionStorage.getItem("api_key"),
          data: data,
        };

        // Make the API call
        const response = await axios.post(
          "https://micro-solution-ruleengineprod.mfilterit.net/editRules_RuleSet",
          payload
        );

        if (response.data.status === "Success") {
          toast.success(response.data.message || "Rule saved successfully!");
          setIsSaved(true);
        } else {
          toast.error(response.data.message || "Failed to save rule");
        }
      } catch (error) {
        console.error("Error saving rule:", error);
        toast.error(error.message || "An error occurred while saving the rule");
      } finally {
        setIsSaving(false);
      }
    }
  };
  useEffect(() => {
    setIsSaved(false);
  }, [currentConditions, actions, thenResult, elseResult]);

  // function validateCondition(condition) {
  //   // List of operators that can have empty values
  //   const EMPTY_VALUE_ALLOWED_OPERATORS = ["any", "exists"];

  //   /**
  //    * Validate an individual rule or group
  //    * @param {Object} rule - The rule or group to validate
  //    * @returns {boolean} - Whether the rule is valid
  //    */
  //   function validateRule(rule) {
  //     // If it's a group, validate its nested rules
  //     if (rule.type === "group") {
  //       // Check if group operator exists
  //       if (!rule.operator) {
  //         console.log("Validation failed: Group missing operator", rule);
  //         return false;
  //       }
  //       // Recursively validate all nested rules
  //       return rule.rules.every(validateRule);
  //     }

  //     // --- Start Rule Validation ---\
  //     // Check if essential fields are present and not just empty strings
  //     if (!rule.property || !rule.property.trim()) {
  //       console.log("Validation failed: Missing property", rule);
  //       return false;
  //     }
  //     if (!rule.operator || !rule.operator.trim()) {
  //       console.log("Validation failed: Missing operator", rule);
  //       return false;
  //     }

  //     // --- Value Validation --- START
  //     const operator = (rule.operator || "").toLowerCase();
  //     const value = rule.value;

  //     // Check if value can be empty based on operator
  //     if (!EMPTY_VALUE_ALLOWED_OPERATORS.includes(operator)) {
  //       // Value is required, perform specific checks

  //       if (operator === "between") {
  //         const isValid =
  //           Array.isArray(value) &&
  //           value.length === 2 &&
  //           // Both items must be non-empty (not null, undefined, or empty string)
  //           value.every(
  //             (item) => item !== null && item !== undefined && item !== ""
  //           );
  //         if (!isValid) {
  //           console.log(
  //             "Validation failed for 'between' operator value:",
  //             value,
  //             rule
  //           );
  //           toast.error(
  //             "For 'between' operator, please provide two non-empty values."
  //           ); // User feedback
  //           return false;
  //         }
  //       } else if (operator === "in" || operator === "not in") {
  //         // Assuming value is stored as an array for these operators after processing
  //         const isValid =
  //           Array.isArray(value) &&
  //           value.length > 0 && // Must have at least one item
  //           // All items must be non-empty
  //           value.every(
  //             (item) => item !== null && item !== undefined && item !== ""
  //           );
  //         if (!isValid) {
  //           console.log(
  //             "Validation failed for 'in'/'not in' operator value:",
  //             value,
  //             rule
  //           );
  //           toast.error(
  //             `For '${operator}' operator, please provide at least one non-empty value in the list.`
  //           ); // User feedback
  //           return false;
  //         }
  //       } else {
  //         // General check for other operators requiring a non-empty value
  //         if (value === null || value === undefined || value === "") {
  //           console.log(
  //             "Validation failed: Value is empty for operator:",
  //             operator,
  //             rule
  //           );
  //           toast.error(
  //             `Please provide a value for the '${rule.property}' condition.`
  //           ); // User feedback
  //           return false;
  //         }
  //       }
  //     }
  //     // --- Value Validation --- END

  //     // If all checks passed for this rule
  //     return true;
  //   }

  //   // Start validation from the top-level condition object
  //   // The structure usually is { operator: 'all', rules: [...] }
  //   if (condition && Array.isArray(condition.rules)) {
  //     return condition.rules.every(validateRule);
  //   } else if (condition && condition.type === "group") {
  //     // Handle if the root itself is a group
  //     return validateRule(condition);
  //   } else {
  //     console.log(
  //       "Validation failed: Invalid root condition structure",
  //       condition
  //     );
  //     // Optionally show a more generic error if needed
  //     // toast.error("Invalid condition structure.");
  //     return false; // Invalid structure
  //   }
  // }

  // const validateAndOpenTestRule = () => {
  //   // Check Then Result for empty keys or values
  //   let hasEmptyThenFields = false;
  //   if (thenResult && thenResult.length > 0) {
  //     hasEmptyThenFields = thenResult.some(
  //       (item) =>
  //         !item.key ||
  //         item.key.trim() === "" ||
  //         item.value === undefined ||
  //         item.value === null ||
  //         (typeof item.value === "string" && item.value.trim() === "")
  //     );
  //   }

  //   // Check Else Result for empty keys or values
  //   let hasEmptyElseFields = false;
  //   if (elseResult && elseResult.length > 0) {
  //     hasEmptyElseFields = elseResult.some(
  //       (item) =>
  //         !item.key ||
  //         item.key.trim() === "" ||
  //         item.value === undefined ||
  //         item.value === null ||
  //         (typeof item.value === "string" && item.value.trim() === "")
  //     );
  //   }

  //   // If either Then or Else has empty fields, show toast and prevent testing
  //   if (hasEmptyThenFields || hasEmptyElseFields) {
  //     toast.error(
  //       `Please fill in all ${hasEmptyThenFields ? "Then" : ""} ${
  //         hasEmptyThenFields && hasEmptyElseFields ? "and" : ""
  //       } ${hasEmptyElseFields ? "Else" : ""} result fields before testing.`
  //     );
  //     return;
  //   }

  //   if (validateCondition(currentConditions)) {
  //     setIsTestRule(true);
  //   } else {
  //     // toast.error(
  //     //   "Please fill in all fields in Condition Builder before testing."
  //     // );
  //   }
  // };

  function validateCondition(condition) {
    // List of operators that can have empty values
    const EMPTY_VALUE_ALLOWED_OPERATORS = ["any", "exists"];

    /**
     * Validate an individual rule or group
     * @param {Object} rule - The rule or group to validate
     * @returns {boolean} - Whether the rule is valid
     */
    function validateRule(rule) {
      // If it's a group, validate its nested rules
      if (rule.type === "group") {
        // Check if group operator exists
        if (!rule.operator) {
          console.log("Validation failed: Group missing operator", rule);
          return false;
        }
        // Recursively validate all nested rules
        return rule.rules.every(validateRule);
      }

      // --- Start Rule Validation ---\
      // Check if essential fields are present and not just empty strings
      if (!rule.property || !rule.property.trim()) {
        console.log("Validation failed: Missing property", rule);
        toast.error(
          `Please fill in all Property fields in Condition Builder before testing.`
        );
        return false;
      }
      if (!rule.operator || !rule.operator.trim()) {
        console.log("Validation failed: Missing operator", rule);
        toast.error(
          `Please fill in Operator fields for "${rule.property}" in Condition Builder before testing.`
        );
        return false;
      }

      // --- Value Validation --- START
      const operator = (rule.operator || "").toLowerCase();
      const value = rule.value;

      // Check if value can be empty based on operator
      if (!EMPTY_VALUE_ALLOWED_OPERATORS.includes(operator)) {
        // Value is required, perform specific checks

        if (operator === "between") {
          const isValid =
            Array.isArray(value) &&
            value.length === 2 &&
            // Both items must be non-empty (not null, undefined, or empty string)
            value.every(
              (item) => item !== null && item !== undefined && item !== ""
            );
          if (!isValid) {
            console.log(
              "Validation failed for 'between' operator value:",
              value,
              rule
            );
            toast.error(
              "For 'between' operator, please provide two non-empty values."
            ); // User feedback
            return false;
          }
        } else if (operator === "in" || operator === "not in") {
          // Assuming value is stored as an array for these operators after processing
          const isValid =
            Array.isArray(value) &&
            value.length > 0 && // Must have at least one item
            // All items must be non-empty
            value.every(
              (item) => item !== null && item !== undefined && item !== ""
            );
          if (!isValid) {
            console.log(
              "Validation failed for 'in'/'not in' operator value:",
              value,
              rule
            );
            toast.error(
              `For '${operator}' operator, please provide at least one non-empty value in the list.`
            ); // User feedback
            return false;
          }
        } else {
          // General check for other operators requiring a non-empty value
          if (value === null || value === undefined || value === "") {
            console.log(
              "Validation failed: Value is empty for operator:",
              operator,
              rule
            );
            toast.error(
              `Please provide a value for the '${rule.property}' condition.`
            ); // User feedback
            return false;
          }
        }
      }
      // --- Value Validation --- END

      // If all checks passed for this rule
      return true;
    }

    // Start validation from the top-level condition object
    // The structure usually is { operator: 'all', rules: [...] }
    if (condition && Array.isArray(condition.rules)) {
      return condition.rules.every(validateRule);
    } else if (condition && condition.type === "group") {
      // Handle if the root itself is a group
      return validateRule(condition);
    } else {
      console.log(
        "Validation failed: Invalid root condition structure",
        condition
      );
      // Optionally show a more generic error if needed
      // toast.error("Invalid condition structure.");
      return false; // Invalid structure
    }
  }

  const validateAndOpenTestRule = () => {
    // Check Then Result for empty keys or values
    let hasEmptyThenFields = false;
    if (thenResult && thenResult.length > 0) {
      hasEmptyThenFields = thenResult.some(
        (item) =>
          !item.key ||
          item.key.trim() === "" ||
          item.value === undefined ||
          item.value === null ||
          (typeof item.value === "string" && item.value.trim() === "")
      );
    }

    // Check Else Result for empty keys or values
    let hasEmptyElseFields = false;
    if (elseResult && elseResult.length > 0) {
      hasEmptyElseFields = elseResult.some(
        (item) =>
          !item.key ||
          item.key.trim() === "" ||
          item.value === undefined ||
          item.value === null ||
          (typeof item.value === "string" && item.value.trim() === "")
      );
    }

    // If either Then or Else has empty fields, show toast and prevent testing
    if (hasEmptyThenFields || hasEmptyElseFields) {
      toast.error(
        `Please fill in all ${hasEmptyThenFields ? "Then" : ""} ${
          hasEmptyThenFields && hasEmptyElseFields ? "and" : ""
        } ${hasEmptyElseFields ? "Else" : ""} result fields before testing.`
      );
      return;
    }

    if (validateCondition(currentConditions)) {
      setIsTestRule(true);
    } else {
      return;
    }
  };

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-[10%] h-full flex items-center justify-center"
        onClick={handleClose}
      ></div>
      <div
        className={`w-[90%] p-6 h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        <div className="topBar flex justify-between items-center">
          <div className="label text-2xl font-bold">Create Rule</div>
          <div className="leftBox flex justify-center items-center gap-6">
            <div className="btns space-x-4 text-white">
              <button
                onClick={() => setIsInputAttribute(true)}
                className={`bg-blue-600 p-3 cursor-pointer font-bold rounded-xl hover:bg-blue-500`}
              >
                Add Input Attributes
              </button>
              <button
                onClick={() => setIsDataSource(true)}
                className={`bg-blue-600 p-3 cursor-pointer font-bold rounded-xl hover:bg-blue-500`}
              >
                Add DataSource
              </button>
            </div>
            <div
              onClick={handleClose}
              className={`close cursor-pointer p-2 rounded-md hover:bg-red-500`}
            >
              <X size={20} />
            </div>
          </div>
        </div>
        <hr
          className={`border-1 ${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />
        <div className="mainBox flex h-full">
          <div className="condition w-[70%] pt-2 pb-10 overflow-auto [&::-webkit-scrollbar]:hidden">
            <div className="builder-section">
              <ConditionBuilder
                theme={theme}
                onConditionChange={handleConditionChange}
                isTested={isTested}
                setIsTested={setIsTested}
                currentConditions={currentConditions}
              />
            </div>
            <RuleResultSection
              theme={theme}
              actions={actions}
              setActions={setActions}
              handleDeleteAction={handleDeleteAction}
              elseResult={elseResult}
              setElseResult={setElseResult}
              thenResult={thenResult}
              setThenResult={setThenResult}
              isTested={isTested}
              setIsTested={setIsTested}
            />
          </div>
          <div className="condition w-[30%] h-full">
            <TriggerSchedular
              theme={theme}
              workspace={workspace}
              workspace_id={workspace_id}
              isSaved={isSaved}
            />
            <div className="btns w-full flex justify-end gap-4 h-16 p-2">
              <button
                onClick={validateAndOpenTestRule}
                disabled={isTested}
                className={`px-6 py-2 cursor-pointer font-bold rounded-xl h-10 text-white ${
                  isTested ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                Test
              </button>
              <button
                onClick={saveRule}
                disabled={!isTested || isSaving || isSaved}
                className={`px-5 py-2 cursor-pointer font-bold rounded-xl h-10 text-white ${
                  !isTested || isSaving || isSaved
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {firstSave ? "Save" : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isInputAttribute && (
        <AddInputAttribute
          isOpen={isInputAttribute}
          setIsOpen={setIsInputAttribute}
          theme={theme}
          workspace={workspace}
          workspace_id={workspace_id}
        />
      )}
      {isDataSource && (
        <AddDataSource
          isOpen={isDataSource}
          setIsOpen={setIsDataSource}
          theme={theme}
          workspace={workspace}
          workspace_id={workspace_id}
        />
      )}
      <TestRule
        isOpen={isTestRule}
        setIsOpen={setIsTestRule}
        theme={theme}
        currentConditions={currentConditions}
        actions={actions}
        thenResult={thenResult}
        elseResult={elseResult}
        isTested={isTested}
        setIsTested={setIsTested}
      />
      {/* <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === "dark" ? "dark" : "light"}
      /> */}
    </div>
  );
};

export default CreateSimpleRule;
