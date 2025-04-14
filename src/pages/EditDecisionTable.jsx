import AddDataSource from "@/components/Rule_Components/AddDataSource";
import AddInputAttribute from "@/components/Rule_Components/AddInputAttribute";
import TriggerSchedular from "@/components/Rule_Components/TriggerSchedular";
import { X, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import CreateActionModal from "@/components/Rule_Components/CreateActionModal";
import EditActionModal from "@/components/Rule_Components/EditActionModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import DecisionBuilderContainer from "@/components/Rule_Components/DecisionBuilderContainer";
import RulePolicyDropdown from "@/components/Rule_Components/RulePolicyDropdown";
import TestDecisionRule from "@/components/Rule_Components/TestDecisionRule";
import getUserDetails from "@/utils/getUserDetails";

const EditDecisionTable = ({ setOnClose }) => {
  const theme = useSelector((state) => state.theme.mode);
  const [isVisible, setIsVisible] = useState(false);
  const [isInputAttribute, setIsInputAttribute] = useState(false);
  const [isDataSource, setIsDataSource] = useState(false);
  const [isTestRule, setIsTestRule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actions, setActions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentValue, setCurrentValue] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const [selectedRulePolicy, setSelectedRulePolicy] = useState("");
  const [conditionsModified, setConditionsModified] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentConditions, setCurrentConditions] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch rule data when component mounts
    const fetchRuleData = async () => {
      try {
        setIsLoading(true);

        // Get user data from session storage
        const userDetails = getUserDetails();
        const workspace = sessionStorage.getItem("workspace");
        const workspace_id = sessionStorage.getItem("workspace_id");

        // Get rule_type and rule_id from sessionStorage
        const rule_type = sessionStorage.getItem("rule_type");
        const rule_id = sessionStorage.getItem("type_id");

        const payload = {
          user: userDetails,
          workspace,
          workspace_id,
          rule_type,
          rule_id,
        };

        console.log("Fetching rule data with payload:", payload);

        const response = await fetch(
          "https://micro-solution-ruleengineprod.mfilterit.net/viewRules_RulesSet",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch rule data");
        }

        const data = await response.json();

        console.log("Rule data fetched:", data);

        if (data.status === "success" || data.status === "Success") {
          // Set the rules and actions from the response
          if (data.data?.rules && Array.isArray(data.data.rules)) {
            console.log("Setting currentConditions with:", data.data.rules);
            setCurrentConditions(data.data.rules);
          }

          if (data.data?.actions && Array.isArray(data.data.actions)) {
            console.log("Setting actions with:", data.data.actions);
            setActions(data.data.actions);
          }

          // Set rule policy if available
          if (data.data && data.data["Rule Policy"]) {
            setSelectedRulePolicy(data.data["Rule Policy"]);
          }
        } else {
          console.error("API response error:", data);
          throw new Error(data.message || "Failed to load rule data");
        }
      } catch (error) {
        console.error("Error fetching rule data:", error);
        toast.error(`Error loading rule data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRuleData();
  }, []); // Re-fetch if rule ID or type changes

  const handleActionClick = (action) => {
    if (isReadOnly) {
      return;
    }
    setSelectedAction(action);
    setShowEditModal(true);
  };

  const handleOpenCreateModal = (value) => {
    setCurrentValue(value);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAction(null);
  };

  const handleSubmitAction = (actionData, isEditing) => {
    setIsTested(false);
    if (isEditing) {
      setActions(
        actions.map((action) =>
          action.id === actionData.id ? actionData : action
        )
      );
    } else {
      setActions([...actions, actionData]);
    }
  };

  const handleDeleteAction = (id) => {
    setIsTested(false);
    setActions(actions.filter((action) => action.id !== id));
  };

  const buttonClass =
    "flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium";
  useEffect(() => {
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

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );

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
    try {
      setIsSaving(true);
      const conditions = currentConditions || [];
      const userDetails = getUserDetails();

      // Get actions from your action components if available

      const data = {
        workspace_id: sessionStorage.getItem("workspace_id"),
        decision_id: sessionStorage.getItem("type_id"),
        "Rule Policy": selectedRulePolicy,
        name: sessionStorage.getItem("name"),
        description: sessionStorage.getItem("description") || "",
        rules: conditions,
        actions: actions || [{}],
      };

      const payload = {
        user: userDetails,
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
        setIsReadOnly(true);

        // Fetch updated rule data after saving to get the sub_rule_id
        fetchUpdatedRuleData();
      } else {
        toast.error(response.data.message || "Failed to save rule");
      }
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error(error.message || "An error occurred while saving the rule");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to fetch updated rule data after save (to get sub_rule_id)
  const fetchUpdatedRuleData = async () => {
    try {
      // Get user data from session storage
      const userDetails = getUserDetails();
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_type = sessionStorage.getItem("rule_type");
      const rule_id = sessionStorage.getItem("type_id");

      const payload = {
        user: userDetails,
        workspace,
        workspace_id,
        rule_type,
        rule_id,
      };

      console.log("Fetching updated rule data with payload:", payload);

      const response = await fetch(
        "https://micro-solution-ruleengineprod.mfilterit.net/viewRules_RulesSet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch updated rule data");
      }

      const data = await response.json();

      if (data.status === "success" || data.status === "Success") {
        // Update only the currentConditions with the rules that now have sub_rule_id
        if (data.data?.rules && Array.isArray(data.data.rules)) {
          console.log(
            "Setting updated currentConditions with:",
            data.data.rules
          );
          setCurrentConditions(data.data.rules);
        }
      } else {
        console.error("API response error:", data);
      }
    } catch (error) {
      console.error("Error fetching updated rule data:", error);
    }
  };

  useEffect(() => {
    setIsTested(false);
  }, [currentConditions]);

  /**
   * Validates a rules object checking for empty key-value pairs
   * @param {Object} rulesObj - The rules object to validate
   * @returns {Object} - Result with isValid flag and error messages if any
   */
  function validateRules(rulesObj) {
    const result = {
      isValid: true,
      errors: [],
    };

    // Check if rulesObj exists and is an array
    if (!rulesObj || !Array.isArray(rulesObj)) {
      result.isValid = false;
      result.errors.push("Invalid rules object structure");
      return result;
    }

    // Process each rule
    rulesObj.forEach((rule, ruleIndex) => {
      validateRule(rule, ruleIndex, result, []);
    });

    return result;
  }

  /**
   * Recursive function to validate a rule and its nested rules
   * @param {Object} rule - The rule to validate
   * @param {number} index - Index or identifier for error reporting
   * @param {Object} result - The result object to update
   * @param {Array} path - Current path in the rules hierarchy
   */
  function validateRule(rule, index, result, path = []) {
    const currentPath = [...path, `rule[${index}]`];

    // Check if rule is an object
    if (!rule || typeof rule !== "object") {
      result.isValid = false;
      result.errors.push(
        `${currentPath.join(".")}: Rule is not a valid object`
      );
      return;
    }

    // Check each key-value pair in the rule
    Object.entries(rule).forEach(([key, value]) => {
      // Skip id checking since it's typically a unique identifier
      if (key === "id") return;

      // Check for empty keys
      if (key === "") {
        result.isValid = false;
        result.errors.push(`${currentPath.join(".")}: Empty key found`);
      }

      // Special handling for "result" object
      if (key === "result") {
        // Empty result object is allowed
        if (Object.keys(value).length === 0) {
          return;
        }

        // Check if result has keys with empty values
        Object.entries(value).forEach(([resultKey, resultValue]) => {
          // Boolean values are valid even if false
          if (
            resultKey !== "" &&
            resultValue !== false &&
            resultValue !== 0 &&
            (resultValue === "" ||
              resultValue === null ||
              resultValue === undefined)
          ) {
            result.isValid = false;
            result.errors.push(
              `${currentPath.join(".")}.result.${resultKey}: Has empty value`
            );
          }
        });
        return;
      }

      // Special handling for array values with operators like between, in, not in
      if (
        key === "value" &&
        Array.isArray(value) &&
        ["between", "in", "not in"].includes(rule.operator)
      ) {
        // Check if array is empty
        if (value.length === 0) {
          result.isValid = false;
          result.errors.push(
            `${currentPath.join(".")}.${key}: Empty array for ${
              rule.operator
            } operator`
          );
          return;
        }

        // Check if any value in the array is empty
        for (let i = 0; i < value.length; i++) {
          const arrayValue = value[i];
          if (
            arrayValue !== false &&
            arrayValue !== 0 &&
            (arrayValue === "" ||
              arrayValue === null ||
              arrayValue === undefined)
          ) {
            result.isValid = false;
            result.errors.push(
              `${currentPath.join(
                "."
              )}.${key}[${i}]: Empty value in array for ${
                rule.operator
              } operator`
            );
          }
        }
        return;
      }

      // Check for empty values with exceptions for Any/Exists operators
      if (
        value !== false &&
        value !== 0 &&
        (value === "" || value === null || value === undefined) &&
        !(rule.operator === "Any" || rule.operator === "Exists")
      ) {
        result.isValid = false;
        result.errors.push(
          `${currentPath.join(".")}.${key}: Empty value found`
        );
      }

      // Process nested rules in conditions
      if (key === "conditions" && Array.isArray(value)) {
        value.forEach((condition, condIndex) => {
          if (condition.rules && Array.isArray(condition.rules)) {
            condition.rules.forEach((nestedRule, nestedIndex) => {
              validateRule(nestedRule, nestedIndex, result, [
                ...currentPath,
                `conditions[${condIndex}]`,
              ]);
            });
          }
        });
      }

      // Process nested rule groups
      if (key === "rules" && Array.isArray(value)) {
        value.forEach((nestedRule, nestedIndex) => {
          validateRule(nestedRule, nestedIndex, result, currentPath);
        });
      }
    });
  }

  const validateAndOpenTestRule = () => {
    const validation = validateRules(currentConditions);
    console.log("currentConditions final chcekj", currentConditions);
    if (!selectedRulePolicy) {
      toast.error("Please select a rule policy before testing.");
      return;
    }
    // setIsTestRule(true);
    if (validation.isValid) {
      setIsTestRule(true);
    } else {
      toast.error(
        "Please fill in all fields in Condition Builder before testing."
      );
      sessionStorage.setItem("conditionsModified", "true");
      setConditionsModified(true);
    }
  };

  console.log("selectedRulePolicy", selectedRulePolicy);
  console.log("currentConditions", currentConditions);

  useEffect(() => {
    // Function to check sessionStorage and update local state
    const checkConditionsModified = () => {
      const isModified =
        sessionStorage.getItem("conditionsModified") === "true";
      setConditionsModified(isModified);
    };

    // Check immediately
    checkConditionsModified();

    // Listen for the custom event
    const handleConditionsModifiedEvent = (event) => {
      console.log("Conditions modified event received", event.detail);
      setConditionsModified(event.detail);
    };

    // Add the event listener
    window.addEventListener(
      "conditionsModified",
      handleConditionsModifiedEvent
    );

    // Clean up on unmount
    return () => {
      window.removeEventListener(
        "conditionsModified",
        handleConditionsModifiedEvent
      );
    };
  }, []);

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-[5%] h-full flex items-center justify-center"
        // onClick={handleClose}
      ></div>
      <div
        className={`w-[95%] p-6 h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="mt-4 text-lg">Loading rule data...</p>
          </div>
        ) : (
          <>
            <div className="topBar flex justify-between items-center">
              <div className="label text-2xl font-bold">
                Edit Decision Table
              </div>
              <div className="leftBox flex justify-center items-center gap-6">
                <div className="btns space-x-4 text-white">
                  <button
                    disabled={isReadOnly}
                    onClick={() => setIsInputAttribute(true)}
                    className={`bg-blue-600 p-3 cursor-pointer font-bold rounded-xl hover:bg-blue-500`}
                  >
                    Add Input Attributes
                  </button>
                  <button
                    disabled={isReadOnly}
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
              <div className="condition w-[70%] h-full pt-2 pb-10 overflow-auto [&::-webkit-scrollbar]:hidden">
                <div
                  className={`mb-4 p-4 border rounded-md flex items-center space-x-3 w-fit ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-300"
                  }`}
                >
                  <label
                    htmlFor="rulePolicySelect"
                    className={`text-sm font-medium whitespace-nowrap ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Rule Policy:
                  </label>
                  <RulePolicyDropdown
                    value={selectedRulePolicy}
                    onChange={setSelectedRulePolicy}
                    isReadOnly={isReadOnly}
                  />
                </div>
                <div className="builder-section h-[75%] overflow-auto">
                  <DecisionBuilderContainer
                    conditions={currentConditions}
                    onUpdate={setCurrentConditions}
                    isInputAttribute={isInputAttribute}
                    isReadOnly={isReadOnly}
                    decision_id={sessionStorage.getItem("type_id")}
                  />
                </div>
                <div className="action-section p-6">
                  <div className="btnsclass flex justify-between items-center">
                    <div className="label text-2xl font-bold">Actions</div>
                    <button
                      disabled={isReadOnly}
                      className={`${buttonClass} cursor-pointer`}
                      onClick={() => handleOpenCreateModal(true)}
                    >
                      <Plus size={18} className="text-red-500" /> Add Action
                    </button>
                  </div>

                  {actions.length > 0 && (
                    <div
                      className="mt-4 mb-4 overflow-y-auto"
                      style={{ maxHeight: "160px" }}
                    >
                      {actions.map((action, index) => (
                        <div
                          disabled={isReadOnly}
                          key={action.id}
                          className={`flex justify-between items-center p-2 mb-2 rounded-md ${inputBg} ${borderColor} border cursor-pointer hover:opacity-80`}
                          onClick={() => handleActionClick(action)}
                        >
                          <div className={`flex items-center ${textColor}`}>
                            <span className="font-medium mr-2">
                              Action {index + 1}:
                            </span>
                            <span>{action.name}</span>
                          </div>
                          <button
                            disabled={isReadOnly}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAction(action.id);
                            }}
                            className="text-red-500 hover:text-red-600 p-1 rounded-md"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="condition w-[30%] h-full">
                <TriggerSchedular
                  theme={theme}
                  workspace={workspace}
                  workspace_id={workspace_id}
                  isSaved={isSaved}
                />
                <div className="btns w-full flex justify-end gap-4 h-16 p-2">
                  {isReadOnly && (
                    <button
                      onClick={() => {
                        setIsReadOnly(false);
                        setIsSaved(false);
                      }}
                      className="px-6 py-2 cursor-pointer font-bold rounded-xl h-10 text-white bg-blue-600 hover:bg-blue-500"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={validateAndOpenTestRule}
                    disabled={isReadOnly || (isTested && !conditionsModified)}
                    className={`px-6 py-2 cursor-pointer font-bold rounded-xl h-10 text-white ${
                      isReadOnly || (isTested && !conditionsModified)
                        ? "bg-gray-400"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {isTested && !conditionsModified ? "Tested" : "Test"}
                  </button>
                  <button
                    onClick={saveRule}
                    disabled={
                      isReadOnly || !isTested || isSaving || conditionsModified
                    }
                    className={`px-5 py-2 cursor-pointer font-bold rounded-xl h-10 text-white ${
                      !isTested || isSaving || conditionsModified || isReadOnly
                        ? "bg-gray-400"
                        : "bg-blue-600 hover:bg-blue-500"
                    }`}
                  >
                    {isSaving
                      ? "Saving..."
                      : conditionsModified
                      ? "Test Required"
                      : "Save"}
                  </button>
                  {/* Debug info */}
                  {console.log("Button states:", {
                    isTested,
                    isSaving,
                    conditionsModified,
                  })}
                </div>
              </div>
            </div>
          </>
        )}
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
      <TestDecisionRule
        isOpen={isTestRule}
        setIsOpen={setIsTestRule}
        theme={theme}
        currentConditions={currentConditions}
        actions={actions}
        isTested={isTested}
        setIsTested={setIsTested}
        selectedRulePolicy={selectedRulePolicy}
        onClose={() => {
          console.log("Test modal closed, current states:", {
            isTested,
            conditionsModified,
          });
        }}
      />
      <CreateActionModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitAction}
        currentValue={currentValue}
        theme={theme}
        isTested={isTested}
        setIsTested={setIsTested}
      />

      {selectedAction && (
        <EditActionModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleSubmitAction}
          initialData={selectedAction}
          theme={theme}
          isTested={isTested}
          setIsTested={setIsTested}
        />
      )}
    </div>
  );
};

export default EditDecisionTable;
