import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import TriggerSchedular from "@/components/Rule_Components/TriggerSchedular";
import ConditionBuilder from "@/components/Rule_Components/ConditionBuilder";
import getUserDetails from "@/utils/getUserDetails";

// Helper function to transform result details into thenResult and elseResult arrays
function transformData(details) {
  // Separate data based on 'value'
  const thenResult = [];
  const elseResult = [];

  // Generate a random ID for each result item
  const generateRandomId = () => Math.random().toString(36).substr(2, 9);

  // Iterate through the details
  details.forEach((item) => {
    // Determine target array based on 'value'
    const targetArray = item.value ? thenResult : elseResult;

    // Extract key-value pairs (excluding 'value' key)
    Object.entries(item)
      .filter(([key]) => key !== "value")
      .forEach(([key, value]) => {
        targetArray.push({
          id: generateRandomId(),
          key: key,
          value: value,
        });
      });
  });

  return { thenResult, elseResult };
}

// Read-only view for InputAttribute
const ReadOnlyInputAttribute = ({ attributes, theme }) => {
  return (
    <div
      className={`p-4 rounded-md shadow h-full flex flex-col ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      {attributes && attributes.length > 0 ? (
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ height: "calc(100% - 40px)" }}
        >
          <table
            className={`min-w-full divide-y ${
              theme === "dark" ? "divide-gray-700" : "divide-gray-200"
            }`}
          >
            <thead
              className={`sticky top-0 ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <tr>
                <th
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === "dark" ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Name
                </th>
                <th
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === "dark" ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Type
                </th>
                <th
                  className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                    theme === "dark" ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  Test Value
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                theme === "dark"
                  ? "bg-gray-800 divide-gray-700"
                  : "bg-white divide-gray-200"
              }`}
            >
              {attributes.map((attr, index) => (
                <tr key={index}>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm ${
                      theme === "dark" ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {attr.attribute}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {attr.data_type}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {attr.test_value !== undefined
                      ? String(attr.test_value)
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={`py-8 text-center rounded-md border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-12 w-12 mx-auto mb-3 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p
            className={`font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            No input attributes defined
          </p>
          <p
            className={
              theme === "dark"
                ? "text-gray-400 text-sm mt-1"
                : "text-gray-400 text-sm mt-1"
            }
          >
            Input attributes will appear here when they are defined
          </p>
        </div>
      )}
    </div>
  );
};

// Read-only view for DataSource
const ReadOnlyDataSource = ({ dataSources, theme }) => {
  console.log("DataSources in component:", dataSources);

  // Check if dataSources is an array or a single object
  const dataSourcesArray = Array.isArray(dataSources)
    ? dataSources
    : dataSources && typeof dataSources === "object"
    ? [dataSources]
    : [];

  // Improved check: Ensure there's at least one valid source object
  const hasValidDataSources =
    dataSourcesArray &&
    dataSourcesArray.length > 0 &&
    dataSourcesArray.some(
      (source) =>
        source && (source.datasource_name || source.name || source.platform)
    );

  return (
    <div
      className={`p-4 rounded-md shadow h-full flex flex-col ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}
    >
      {hasValidDataSources ? ( // Use the improved check here
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ height: "calc(100% - 40px)" }}
        >
          {dataSourcesArray.map((source, index) => (
            <div
              key={index}
              className={`border-b pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0 ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div
                className={`font-medium text-lg mb-2 ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {source.datasource_name || source.name || "Unnamed Data Source"}
              </div>
              <div className="mb-2">
                <span
                  className={`font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Platform:{" "}
                </span>
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  {source.platform || source.type || "Not specified"}
                </span>
              </div>
              {source.input_data_map &&
              Object.keys(source.input_data_map).length > 0 ? (
                <div>
                  <div
                    className={`font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Mapped Fields:
                  </div>
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th
                            className={`text-left text-xs font-medium uppercase tracking-wider pb-2 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Input Attribute
                          </th>
                          <th
                            className={`text-left text-xs font-medium uppercase tracking-wider pb-2 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            Data Source Field
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(source.input_data_map).map(
                          ([key, value], idx) => (
                            <tr key={idx}>
                              <td
                                className={`pr-4 py-1 text-sm ${
                                  theme === "dark"
                                    ? "text-gray-200"
                                    : "text-gray-900"
                                }`}
                              >
                                {key}
                              </td>
                              <td
                                className={`py-1 text-sm ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {value}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p
                  className={
                    theme === "dark"
                      ? "text-gray-400 italic"
                      : "text-gray-500 italic"
                  }
                >
                  No field mappings defined
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`py-8 text-center rounded-md border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-12 w-12 mx-auto mb-3 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          <p
            className={`font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            No data sources connected
          </p>
          <p
            className={
              theme === "dark"
                ? "text-gray-400 text-sm mt-1"
                : "text-gray-400 text-sm mt-1"
            }
          >
            Data sources will appear here when they are mapped to this rule
          </p>
        </div>
      )}
    </div>
  );
};

const ViewSimpleRule = ({ setOnClose }) => {
  const userDetails = getUserDetails();
  const theme = useSelector((state) => state.theme.mode);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentConditions, setCurrentConditions] = useState(null);
  const [thenResult, setThenResult] = useState([]);
  const [elseResult, setElseResult] = useState([]);
  const [actions, setActions] = useState([]);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [inputAttributes, setInputAttributes] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);

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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setOnClose(), 300);
  };

  const fetchRule = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching rule data for view...");

      // User and workspace info
      const user = userDetails;
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_type = sessionStorage.getItem("rule_type");
      const rule_id = sessionStorage.getItem("type_id");

      // Base payload for all requests
      const basePayload = {
        user,
        workspace,
        workspace_id,
        rule_type,
        rule_id,
      };

      // 1. Fetch main rule data
      const ruleResponse = await axios.post(
        `https://micro-solution-ruleengineprod.mfilterit.net/viewRules_RulesSet`,
        basePayload
      );

      console.log("Rule API Response:", ruleResponse.data);

      if (ruleResponse.data.status === "Success" && ruleResponse.data.data) {
        // Set rule name and description
        setRuleName(ruleResponse.data.data.name || "");
        setRuleDescription(ruleResponse.data.data.description || "");

        if (
          ruleResponse.data.data.conditions &&
          ruleResponse.data.data.conditions.length > 0
        ) {
          // Create a deep copy to avoid reference issues
          const fetchedCondition = JSON.parse(
            JSON.stringify(ruleResponse.data.data.conditions[0])
          );

          setCurrentConditions(fetchedCondition);
        }

        if (ruleResponse.data.data.actions) {
          setActions(ruleResponse.data.data.actions);
        }

        if (
          ruleResponse.data.data.result &&
          ruleResponse.data.data.result.details
        ) {
          const transformedData = transformData(
            ruleResponse.data.data.result.details
          );
          console.log("Transformed Data:", transformedData);
          setThenResult(transformedData.thenResult);
          setElseResult(transformedData.elseResult);
        }
      } else {
        console.error("No valid data in rule API response");
        toast.error("Failed to load rule data");
      }

      // 2. Fetch input attributes
      try {
        const inputAttributesResponse = await axios.post(
          `https://micro-solution-ruleengineprod.mfilterit.net/getAttribute`,
          basePayload
        );

        console.log(
          "Input Attributes API Response:",
          inputAttributesResponse.data
        );

        if (
          inputAttributesResponse.data.status === "Success" &&
          inputAttributesResponse.data.data
        ) {
          setInputAttributes(
            inputAttributesResponse.data.data?.input_attributes
          );
        } else {
          console.log("No input attributes found or API returned an error");
          setInputAttributes([]);
        }
      } catch (error) {
        console.error("Error fetching input attributes:", error);
        setInputAttributes([]);
      }

      // 3. Fetch mapped data sources
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
        console.log(
          "Data sources set to:",
          Array.isArray(sourcesData) ? sourcesData : [sourcesData]
        );
      } catch (error) {
        console.error("Error fetching data sources:", error);
        setDataSources([]);
      }

      // 4. Fetch schedule data
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
          if (
            scheduleResponse.data.data &&
            Array.isArray(scheduleResponse.data.data) &&
            scheduleResponse.data.data.length > 0
          ) {
            // Data is in array format
            const scheduleData = scheduleResponse.data.data[0];
            setScheduleData(scheduleData);
          } else if (
            scheduleResponse.data.data &&
            scheduleResponse.data.data.start_date
          ) {
            // Data is direct object
            setScheduleData(scheduleResponse.data.data);
          } else {
            setScheduleData(null);
          }
        } else {
          setScheduleData(null);
        }
      } catch (error) {
        console.error("Error fetching schedule data:", error);
        setScheduleData(null);
      }
    } catch (error) {
      console.error("Error in main fetchRule function:", error);
      toast.error("Error fetching rule data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRule();
    setIsVisible(true);
  }, []);

  // Filter actions based on the 'value' property
  const thenActions = useMemo(
    () => actions.filter((action) => action.value === true),
    [actions]
  );
  const elseActions = useMemo(
    () => actions.filter((action) => action.value !== true),
    [actions]
  );

  // Render a set of actions (Then or Else)
  const renderActionSet = (actionList, type) => {
    const title = type === "then" ? "Then Actions" : "Else Actions";
    const titleColor = type === "then" ? "text-green-500" : "text-yellow-500";
    const iconColor = type === "then" ? "text-green-400" : "text-yellow-400";
    const iconBg = type === "then" ? "bg-green-900" : "bg-yellow-900";
    const iconText = type === "then" ? "text-green-200" : "text-yellow-200";

    return (
      <div
        className={`action-set p-4 border rounded-md shadow-sm flex flex-col ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-300"
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className={`text-lg font-semibold flex items-center ${titleColor}`}
          >
            {/* Optional: Add an icon here if desired */}
            {title}
          </div>
          {actionList.length > 0 && (
            <div
              className={
                theme === "dark"
                  ? "text-sm text-gray-400"
                  : "text-sm text-gray-500"
              }
            >
              {actionList.length} action{actionList.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {actionList && actionList.length > 0 ? (
          <div
            className={`flex-1 overflow-y-auto custom-scrollbar border rounded-md shadow-inner ${
              // Added flex-1
              theme === "dark"
                ? "border-gray-700 bg-gray-900"
                : "border-gray-200 bg-gray-50"
            }`}
            style={{ maxHeight: "400px" }} // Max height for scroll
          >
            {actionList.map((action, index) => (
              <div
                key={action.id || index} // Prefer a unique action id if available
                className={`p-4 ${
                  index !== actionList.length - 1
                    ? theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                    : ""
                } ${
                  theme === "dark" ? "hover:bg-gray-750" : "hover:bg-gray-100"
                } transition-colors`}
              >
                <div className="flex items-center mb-3">
                  {/* Numbering based on the filtered list index */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mr-2 ${
                      theme === "dark"
                        ? `${iconBg} ${iconText}`
                        : `${
                            type === "then"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`font-semibold text-md ${iconColor}`}>
                    {action.name || action.action_name || "Action"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-600/10"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div className="flex items-start text-sm">
                      <span
                        className={`flex-shrink-0 font-medium mr-1.5 ${labelColor}`}
                      >
                        Platform:
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          theme === "dark"
                            ? `${iconBg} ${iconText}`
                            : `${
                                type === "then"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`
                        }`}
                      >
                        {action.platform || "N/A"}
                      </span>
                    </div>
                    {/* Display Integration ID if available */}
                    {action.integration_id && (
                      <div className="flex items-start text-sm">
                        <span
                          className={`flex-shrink-0 font-medium mr-1.5 ${labelColor}`}
                        >
                          Integration ID:
                        </span>
                        <span className={textColor}>
                          {action.integration_id}
                        </span>
                      </div>
                    )}
                  </div>

                  {action.action_query && (
                    <div className="mt-2">
                      <div className={`text-sm font-medium mb-1 ${labelColor}`}>
                        Action Query:
                      </div>
                      <div
                        className={`p-2 rounded-md border overflow-x-auto custom-scrollbar ${
                          theme === "dark"
                            ? "bg-gray-900 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <pre
                          className={`text-xs whitespace-pre-wrap ${textColor}`}
                        >
                          {typeof action.action_query === "object"
                            ? JSON.stringify(action.action_query, null, 2)
                            : action.action_query}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`py-8 text-center rounded-md border flex-1 flex flex-col justify-center items-center ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {/* Simplified No Actions message */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-10 w-10 mb-2 ${
                theme === "dark" ? "text-gray-600" : "text-gray-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <p
              className={`font-medium text-sm ${
                theme === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              No {type} actions defined
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render results in read-only mode
  const renderResults = (results, type) => {
    const headerBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";
    const resultType = type === "then" ? "THEN" : "ELSE";
    const resultColor = type === "then" ? "text-green-500" : "text-yellow-500";

    return (
      <div
        className={`border rounded-md ${
          theme === "dark" ? "border-gray-700" : "border-gray-300"
        } shadow-sm overflow-hidden flex flex-col`}
      >
        <div className={`p-3 ${headerBg} flex items-center`}>
          <div className={`font-medium ${textColor}`}>
            <span className={`${resultColor} font-semibold`}>{resultType}</span>{" "}
            Results
          </div>
        </div>

        <div
          className={`p-4 flex-1 overflow-y-auto custom-scrollbar max-h-80 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          {results && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-md ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-750"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className={`text-sm font-medium ${labelColor}`}>
                        Key
                      </div>
                      <div
                        className={`p-2 rounded bg-opacity-20 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                        } ${textColor}`}
                      >
                        {item.key}
                      </div>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${labelColor}`}>
                        Value
                      </div>
                      <div
                        className={`p-2 rounded bg-opacity-20 ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                        } ${textColor}`}
                      >
                        {item.value !== undefined && item.value !== null
                          ? typeof item.value === "object" &&
                            item.value.value !== undefined
                            ? String(item.value.value) // Display nested value if object with value key
                            : String(item.value) // Otherwise, display the stringified value
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-3 italic ${labelColor} text-center`}>
              No {resultType.toLowerCase()} results defined
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render schedule data in a read-only view
  const renderScheduleData = () => {
    if (!scheduleData) {
      return (
        <div
          className={`flex flex-col items-center justify-center h-full p-6 border rounded-md ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-12 w-12 mx-auto mb-3 ${
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p
            className={`font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            No schedule configured
          </p>
          <p
            className={
              theme === "dark"
                ? "text-gray-400 text-sm mt-1"
                : "text-gray-400 text-sm mt-1"
            }
          >
            This rule has no automated execution schedule
          </p>
        </div>
      );
    }

    // Convert API data type to human-readable format
    const getScheduleTypeLabel = (type) => {
      const typeMapping = {
        Minutes: "Every Minute",
        Hours: "Every Hour",
        Daily: "Daily",
        Weekly: "Weekly",
        Monthly: "Monthly",
        Cron: "Cron Expression",
      };
      return typeMapping[type] || type;
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return "Not set";

      // Handle ISO format
      if (dateString.includes("T")) {
        const date = new Date(dateString);
        return date.toLocaleString();
      }

      // Handle "YYYY-MM-DD HH:MM:SS" format
      return dateString;
    };

    // Format schedule value based on type
    const formatScheduleValue = (type, value) => {
      if (!value) return "Not configured";

      switch (type) {
        case "Minutes":
          return `Every ${value} minute(s)`;
        case "Hours":
          return `Every ${value} hour(s)`;
        case "Daily":
          if (value.includes(":")) {
            return `Daily at ${value}`;
          }
          return `Daily at ${value}`;
        case "Weekly":
          try {
            let days = value;
            if (typeof value === "string") {
              try {
                days = JSON.parse(value);
              } catch {
                days = value.split(",").map((d) => d.trim());
              }
            }
            if (Array.isArray(days) && days.length > 0) {
              return `Weekly on ${days.join(", ")}`;
            }
            return "Weekly (days not specified)";
          } catch {
            return value;
          }
        case "Monthly":
          try {
            let dates = value;
            if (typeof value === "string") {
              try {
                dates = JSON.parse(value);
              } catch {
                dates = value.split(",").map((d) => parseInt(d.trim()));
              }
            }
            if (Array.isArray(dates) && dates.length > 0) {
              return `Monthly on day(s): ${dates.join(", ")}`;
            }
            return "Monthly (dates not specified)";
          } catch {
            return value;
          }
        case "Cron":
          return scheduleData.Cron_Expression || value;
        default:
          return String(value);
      }
    };

    const borderColor =
      theme === "dark" ? "border-gray-700" : "border-gray-300";
    const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white";
    const labelColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const valueColor = theme === "dark" ? "text-white" : "text-gray-800";
    const sectionBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";

    return (
      <div
        className={`h-full flex flex-col border ${borderColor} rounded-md overflow-hidden ${bgColor}`}
      >
        <div className={`p-3 ${sectionBg} flex items-center`}>
          <div className={`font-medium ${valueColor}`}>
            <span
              className={`${
                theme === "dark" ? "text-emerald-400" : "text-emerald-600"
              } font-semibold`}
            >
              {scheduleData.scheduler ? "ENABLED" : "DISABLED"}
            </span>
            {" Schedule Configuration"}
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`text-sm font-medium ${labelColor}`}>
                  Start Date
                </div>
                <div
                  className={`p-2 rounded ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  } ${valueColor}`}
                >
                  {formatDate(scheduleData.start_date)}
                </div>
              </div>

              <div>
                <div className={`text-sm font-medium ${labelColor}`}>
                  End Date
                </div>
                <div
                  className={`p-2 rounded ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  } ${valueColor}`}
                >
                  {formatDate(scheduleData.end_date)}
                </div>
              </div>
            </div>

            <div>
              <div className={`text-sm font-medium ${labelColor}`}>
                Schedule Type
              </div>
              <div
                className={`p-2 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } ${valueColor}`}
              >
                {getScheduleTypeLabel(scheduleData.data_type)}
              </div>
            </div>

            <div>
              <div className={`text-sm font-medium ${labelColor}`}>
                Schedule Configuration
              </div>
              <div
                className={`p-2 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                } ${valueColor}`}
              >
                {formatScheduleValue(
                  scheduleData.data_type,
                  scheduleData.data_value
                )}
              </div>
            </div>

            {/* {scheduleData.Cron_Expression && (
              <div>
                <div className={`text-sm font-medium ${labelColor}`}>
                  Cron Expression
                </div>
                <div
                  className={`p-2 rounded font-mono ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  } ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                >
                  {scheduleData.Cron_Expression}
                </div>
              </div>
            )} */}

            <div
              className={`p-3 rounded ${
                theme === "dark"
                  ? "bg-blue-900/30 border border-blue-800"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 mr-2 mt-0.5 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p
                    className={`${
                      theme === "dark" ? "text-blue-300" : "text-blue-700"
                    } text-sm`}
                  >
                    This rule will execute automatically based on the schedule
                    above.
                  </p>
                  {scheduleData.scheduler ? (
                    <p
                      className={`text-sm mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        Active
                      </span>
                    </p>
                  ) : (
                    <p
                      className={`text-sm mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          theme === "dark"
                            ? "text-yellow-400"
                            : "text-yellow-600"
                        }`}
                      >
                        Inactive
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 overflow-auto ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        className={`relative ${backStyle} w-[90%] h-[90%] rounded-lg shadow-lg overflow-hidden flex flex-col`}
      >
        <style>{scrollbarStyles}</style>
        {/* <ToastContainer position="top-right" autoClose={5000} /> */}

        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className={`text-xl font-semibold ${textColor}`}>
            View Simple Rule: {ruleName}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className={textColor} size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-2">Loading rule data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Rule Details */}
              <div>
                <h3 className={`text-lg font-medium ${textColor} mb-2`}>
                  Rule Information
                </h3>
                <div
                  className={`border rounded-md ${
                    theme === "dark" ? "border-gray-700" : "border-gray-300"
                  } shadow-sm overflow-hidden`}
                >
                  <div
                    className={`p-3 ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    } flex items-center`}
                  >
                    <div className={`font-medium ${textColor}`}>
                      <span className="text-cyan-500 font-semibold">
                        RULE DETAILS
                      </span>{" "}
                      and metadata
                    </div>
                  </div>

                  <div
                    className={`p-4 ${
                      theme === "dark" ? "bg-gray-800" : "bg-white"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={`text-sm font-medium ${labelColor}`}>
                            Rule Name
                          </div>
                          <div
                            className={`p-2 rounded bg-opacity-20 ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                            } ${textColor}`}
                          >
                            {ruleName || "Unnamed Rule"}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${labelColor}`}>
                            Workspace
                          </div>
                          <div
                            className={`p-2 rounded bg-opacity-20 ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                            } ${textColor}`}
                          >
                            {workspace || "Unknown Workspace"}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${labelColor}`}>
                          Description
                        </div>
                        <div
                          className={`p-2 rounded bg-opacity-20 ${
                            theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                          } ${textColor} min-h-[60px]`}
                        >
                          {ruleDescription || "No description provided"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Attributes and Data Sources - Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Attributes */}
                <div className="h-[300px]">
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-700"
                    }`}
                  >
                    Input Attributes
                  </h3>
                  <ReadOnlyInputAttribute
                    attributes={inputAttributes}
                    theme={theme}
                  />
                </div>

                {/* Data Sources */}
                <div className="h-[300px]">
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-700"
                    }`}
                  >
                    Data Sources
                  </h3>
                  <ReadOnlyDataSource dataSources={dataSources} theme={theme} />
                </div>
              </div>

              {/* Conditions and Schedule - Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {/* Conditions */}
                <div className="h-[500px] md:col-span-2">
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-700"
                    }`}
                  >
                    Conditions
                  </h3>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      <span className="ml-3">Loading conditions...</span>
                    </div>
                  ) : (
                    <div
                      className={`condition-builder-readonly custom-scrollbar rounded-md shadow ${
                        theme === "dark" ? "bg-gray-800" : "bg-white"
                      }`}
                      style={{
                        height: "calc(100% - 40px)",
                        overflowY: "auto",
                        overflowX: "auto",
                        padding: "16px",
                      }}
                    >
                      <style>
                        {`
                          .condition-builder-readonly select,
                          .condition-builder-readonly input,
                          .condition-builder-readonly button {
                            pointer-events: none;
                            opacity: 0.8;
                            cursor: not-allowed;
                          }
                          
                          .condition-builder-readonly > div {
                            padding: 0 !important;
                            background: transparent !important;
                            box-shadow: none !important;
                          }
                          
                          .condition-builder-readonly > div > div {
                            max-width: none !important;
                            margin: 0 !important;
                            display: block !important;
                          }
                        `}
                      </style>
                      <ConditionBuilder
                        theme={theme}
                        currentConditions={currentConditions}
                        onConditionChange={() => {}} // Empty function since we're in read-only mode
                        isTested={true} // Always true in view mode
                        setIsTested={() => {}} // Empty function since we're in read-only mode
                      />
                    </div>
                  )}
                </div>

                {/* Schedule (Read-only) */}
                <div className="h-[500px]">
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-700"
                    }`}
                  >
                    Schedule
                  </h3>
                  {renderScheduleData()}
                </div>
              </div>

              {/* Results */}
              <div>
                <h3 className={`text-lg font-medium ${textColor} mb-2`}>
                  Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Then Results Section */}
                  <div>
                    <h4
                      className={`text-md font-semibold mb-2 ${
                        theme === "dark" ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      Then Results
                    </h4>
                    {renderResults(thenResult, "then")}
                  </div>
                  {/* Else Results Section */}
                  <div>
                    <h4
                      className={`text-md font-semibold mb-2 ${
                        theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      Else Results
                    </h4>
                    {renderResults(elseResult, "else")}
                  </div>
                </div>
              </div>

              {/* Actions - Separated into Then/Else */}
              <div>
                <h3 className={`text-lg font-medium ${textColor} mb-2`}>
                  Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Then Actions Section */}
                  {renderActionSet(thenActions, "then")}
                  {/* Else Actions Section */}
                  {renderActionSet(elseActions, "else")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSimpleRule;
