import TriggerSchedular from "@/components/Rule_Components/TriggerSchedular";
import { X } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import TestRuleSet from "@/components/Rule_Components/TestRuleSet";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import RulePolicyDropdown from "@/components/Rule_Components/RulePolicyDropdown";
import RuleSetBuilder from "@/components/Rule_Components/RuleSetBuilder";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const CreateRuleSet = ({ setOnClose }) => {
  const theme = useSelector((state) => state.theme.mode);
  const [firstSave, setFirstSave] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isTestRule, setIsTestRule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentConditions, setCurrentConditions] = useState([]);
  const latestConditionsRef = useRef(currentConditions);
  const [lastAction, setLastAction] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isTested, setIsTested] = useState(false);

  const [selectedRulePolicy, setSelectedRulePolicy] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const buttonClass =
    "flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium";
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-gray-100";

  const handleClose = (e) => {
    // Stop event propagation to prevent bubbling
    if (e) {
      e.stopPropagation();
    }

    console.log("Close button clicked");

    // Use a direct approach to exit
    setIsVisible(false);
    setIsTestRule(false); // Ensure test modal is closed too

    // Call parent handler immediately to ensure exit
    setOnClose();
  };

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

  useEffect(() => {
    setIsVisible(true);
    latestConditionsRef.current = currentConditions;
  }, []);

  // Update the ref whenever currentConditions changes
  useEffect(() => {
    latestConditionsRef.current = currentConditions;

    // If the last action was "Test" and we just updated the conditions, run validation now
    if (lastAction === "test" && currentConditions) {
      runValidation();
      setLastAction(null);
    }
  }, [currentConditions]);

  const handleConditionsChange = useCallback((newConditions) => {
    // Set the current conditions in state
    setCurrentConditions(newConditions);
    // Also update the ref immediately
    latestConditionsRef.current = newConditions;
  }, []);

  const saveRule = async () => {
    if (firstSave) {
      try {
        setIsSaving(true);

        const data = {
          user: user,
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
          ruleset_id: sessionStorage.getItem("type_id"),
          "Rule Policy": selectedRulePolicy,
          name: sessionStorage.getItem("name"),
          group: "Advanced ID Scan",
          description: sessionStorage.getItem("description") || "",
          "rules enabled": currentConditions,
        };

        const payload = {
          user: user,
          api_key: sessionStorage.getItem("api_key"),
          rule_type: sessionStorage.getItem("rule_type"),
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
          data: data,
        };

        // Make the API call
        const response = await axios.post(
          "https://micro-solution-ruleengineprod.mfilterit.net/addRules_RuleSet",
          payload
        );

        if (response.data.status === "Success") {
          toast.success(response.data.message || "Rule saved!");
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
        const data = {
          ruleset_id: sessionStorage.getItem("type_id"),
          name: sessionStorage.getItem("name"),
          "Rule Policy": selectedRulePolicy,
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
          api_key: sessionStorage.getItem("api_key"),
          "rules enabled": currentConditions,
        };

        const payload = {
          user: user,
          api_key: sessionStorage.getItem("api_key"),
          rule_type: sessionStorage.getItem("rule_type"),
          workspace: sessionStorage.getItem("workspace"),
          workspace_id: sessionStorage.getItem("workspace_id"),
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

  // Function to check if rules array has empty rule_ids
  function hasEmptyRuleIds(rulesArray) {
    if (!rulesArray || !Array.isArray(rulesArray)) return true;
    return rulesArray.some((rule) => !rule.rule_id || rule.rule_id === "");
  }

  // Function to check if at least one rule is enabled
  function hasEnabledRules(rulesArray) {
    if (!rulesArray || !Array.isArray(rulesArray)) return false;
    return rulesArray.some((rule) => rule.enabled === true);
  }

  // The actual validation logic, separated out for clarity
  const runValidation = () => {
    // Read the latest conditions from the ref
    const rulesToValidate = latestConditionsRef.current;

    console.log(
      "Validating conditions:",
      JSON.stringify(rulesToValidate, null, 2)
    );

    // Run validation immediately using the ref's value
    if (!rulesToValidate || rulesToValidate.length === 0) {
      console.log("Validation Failed: No rules added.");
      toast.error("Please add at least one rule!");
      return false;
    }

    if (hasEmptyRuleIds(rulesToValidate)) {
      console.log("Validation Failed: Found empty rule_id.");
      toast.error(
        "Please select a rule for each row. Empty rules are not allowed."
      );
      return false;
    }

    if (!hasEnabledRules(rulesToValidate)) {
      console.log("Validation Failed: No enabled rules found.");
      toast.error("Please enable at least one rule in the rule set.");
      return false;
    }

    console.log("Validation Passed. Opening TestRule.");
    return true;
  };

  // The handler that gets called when the Test button is clicked
  const validateAndOpenTestRule = () => {
    // Set the last action to 'test' to trigger validation after state update if needed
    setLastAction("test");

    // Run the validation now in case it works immediately
    if (runValidation()) {
      setIsTestRule(true);
    }
  };

  useEffect(() => {
    setIsTested(false);
    setIsSaved(false);
  }, [selectedRulePolicy, currentConditions]);
  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-[10%] h-full flex items-center justify-center cursor-pointer"
        onClick={handleClose}
      ></div>
      <div
        className={`w-[90%] p-6 h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        <div className="topBar flex justify-between items-center">
          <div className="label text-2xl font-bold">Create Rule Set</div>
          {/* Make button larger and more obvious */}
          <button
            onClick={(e) => handleClose(e)}
            className={`p-1 cursor-pointer rounded-lg transition-colors duration-200 ${
              theme === "dark"
                ? " hover:bg-blue-600 text-white"
                : " hover:bg-red-600 text-black"
            }`}
            aria-label="Close"
          >
            <X size={28} strokeWidth={2.5} />
          </button>
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
            <div className="builder-section">
              <RuleSetBuilder
                currentRules={currentConditions}
                onChange={handleConditionsChange}
              />
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

      <TestRuleSet
        isOpen={isTestRule}
        setIsOpen={setIsTestRule}
        theme={theme}
        currentConditions={latestConditionsRef.current}
        selectedRulePolicy={selectedRulePolicy}
        setIsTested={setIsTested}
      />
    </div>
  );
};

export default CreateRuleSet;
