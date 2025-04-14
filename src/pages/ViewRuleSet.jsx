import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import RulePolicyDropdown from "@/components/Rule_Components/RulePolicyDropdown";
import RuleSetBuilder from "@/components/Rule_Components/RuleSetBuilder";
import RuleSetScheduleViewer from "@/components/Rule_Components/RuleSetScheduleViewer";
import getUserDetails from "@/utils/getUserDetails";


const ViewRuleSet = ({ setOnClose }) => {
  const userDetails = getUserDetails();

  const theme = useSelector((state) => state.theme.mode);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConditions, setCurrentConditions] = useState([]);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [selectedRulePolicy, setSelectedRulePolicy] = useState("");
  const [dataSources, setDataSources] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isMapped, setIsMapped] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [rules, setRules] = useState([]);
  const [isReadOnly] = useState(true); // Always read-only

  // Update the scrollbar styles to make them more visible
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #6b7280;
      border-radius: 4px;
      border: 2px solid #f1f1f1;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #4b5563;
    }
  `;

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";
  const cardStyle =
    theme === "dark"
      ? "bg-gray-800 text-white border-gray-700"
      : "bg-white text-black border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const labelColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-gray-100";

  const handleClose = (e) => {
    // Stop event propagation to prevent bubbling
    if (e) {
      e.stopPropagation();
    }

    console.log("Close button clicked");

    // Use a direct approach to exit
    setIsVisible(false);

    // Call parent handler to ensure exit
    setTimeout(() => setOnClose(), 300);
  };

  const fetchRuleSet = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching rule set data for view...");

      // User and workspace info
      const user = userDetails;
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_type = sessionStorage.getItem("rule_type");
      const rule_id = sessionStorage.getItem("type_id");

      // Base payload for API requests
      const basePayload = {
        user,
        workspace,
        workspace_id,
        rule_type,
        rule_id,
      };

      // 1. Fetch main rule set data
      const ruleSetResponse = await axios.post(
        `https://micro-solution-ruleengineprod.mfilterit.net/viewRules_RulesSet`,
        basePayload
      );

      console.log("Rule Set API Response:", ruleSetResponse.data);

      if (
        ruleSetResponse.data.status === "Success" &&
        ruleSetResponse.data.data
      ) {
        const ruleSetData = ruleSetResponse.data.data;

        // Set rule set name and description
        setRuleName(ruleSetData.name || "");
        setRuleDescription(ruleSetData.description || "");

        // Set rule policy after a small delay to ensure dropdown is initialized
        setTimeout(() => {
          console.log("Setting Rule Policy to:", ruleSetData["Rule Policy"]);
          setSelectedRulePolicy(ruleSetData["Rule Policy"] || "");
        }, 500);

        // Set mapped and scheduled status
        setIsMapped(ruleSetResponse.data.mapped_datasource || false);
        setIsScheduled(ruleSetResponse.data.scheduled || false);

        // Set conditions/rules
        if (
          ruleSetData["rules enabled"] &&
          Array.isArray(ruleSetData["rules enabled"])
        ) {
          setCurrentConditions(ruleSetData["rules enabled"]);
        }

        // Set available rules if present in the response
        if (ruleSetData.rules && Array.isArray(ruleSetData.rules)) {
          setRules(ruleSetData.rules);
        }
      } else {
        console.error("No valid data in rule set API response");
        toast.error("Failed to load rule set data");
      }

      // 2. Fetch mapped data sources if applicable
      if (ruleSetResponse.data.mapped_datasource) {
        try {
          const dataSourcesResponse = await axios.post(
            `https://micro-solution-ruleengine-datasource_prod.mfilterit.net/viewMappedDataSource`,
            {
              user,
              workspace,
              workspace_id,
              rule_type,
              type_id: rule_id,
            }
          );

          console.log("Data Sources API Response:", dataSourcesResponse.data);

          const sourcesData = dataSourcesResponse.data;
          if (Array.isArray(sourcesData)) {
            setDataSources(sourcesData);
          } else {
            // If it's an object, wrap it in an array
            setDataSources([sourcesData]);
          }
        } catch (error) {
          console.error("Error fetching data sources:", error);
          setDataSources([]);
        }
      }

      // 3. Fetch schedule data if applicable
      if (ruleSetResponse.data.scheduled) {
        try {
          const scheduleResponse = await axios.post(
            "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/getTriggerScheduleData",
            {
              user,
              workspace,
              workspace_id,
              rule_type,
              type_id: rule_id,
            }
          );

          console.log("Schedule API Response:", scheduleResponse.data);

          if (
            scheduleResponse.data &&
            scheduleResponse.data.status === "Success"
          ) {
            // Set scheduleData directly, the component will handle arrays or objects
            setScheduleData(scheduleResponse.data.data);
            setIsScheduled(true);
          } else {
            setScheduleData(null);
            setIsScheduled(false);
          }
        } catch (error) {
          console.error("Error fetching schedule data:", error);
          setScheduleData(null);
          setIsScheduled(false);
        }
      }
    } catch (error) {
      console.error("Error in main fetchRuleSet function:", error);
      toast.error("Error fetching rule set data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuleSet();
    setIsVisible(true);
  }, []);

  // Allow conditions to change but not actually update
  const handleConditionsChange = useCallback((newConditions) => {
    // In view mode, we don't update conditions
    console.log("Conditions change attempted in view mode");
  }, []);

  // Render the data sources section
  const renderDataSources = () => {
    if (!isMapped || !dataSources || dataSources.length === 0) {
      return (
        <div className={`text-center py-4 ${labelColor}`}>
          No data sources mapped to this rule set.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {dataSources.map((source, index) => (
          <div
            key={index}
            className={`p-4 border rounded-md ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between mb-2">
              <h4 className={`font-medium ${textColor}`}>
                {source.source_name || "Unnamed Source"}
              </h4>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  theme === "dark"
                    ? "bg-blue-900 text-blue-100"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {source.source_type || "Unknown Type"}
              </span>
            </div>
            <div className={`text-sm ${secondaryTextClass}`}>
              {source.description || "No description available"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Secondary text style for labels
  const secondaryTextClass =
    theme === "dark" ? "text-gray-400" : "text-gray-600";

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
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-2">Loading rule set data...</p>
          </div>
        ) : (
          <>
            <div className="topBar flex justify-between items-center">
              <div className="label text-2xl font-bold">
                View Rule Set: {ruleName}
              </div>
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
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
              <div className="condition w-[30%] h-full">
                <RuleSetScheduleViewer
                  theme={theme}
                  scheduleData={scheduleData}
                  isScheduled={isScheduled}
                />
                <div className="btns w-full flex justify-end gap-4 h-16 p-2 mt-4">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 cursor-pointer font-bold rounded-xl h-10 text-white bg-blue-600 hover:bg-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewRuleSet;
