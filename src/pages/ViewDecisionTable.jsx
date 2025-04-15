import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DecisionBuilderContainer from "@/components/Rule_Components/DecisionBuilderContainer";
import TriggerSchedular from "@/components/Rule_Components/TriggerSchedular";
import getUserDetails from "@/utils/getUserDetails";

const ViewDecisionTable = ({ setOnClose }) => {
  const userDetails = getUserDetails();
  const theme = useSelector((state) => state.theme.mode);
  const [isVisible, setIsVisible] = useState(false);
  const [actions, setActions] = useState([]);
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const [selectedRulePolicy, setSelectedRulePolicy] = useState("");
  const [currentConditions, setCurrentConditions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [inputAttributes, setInputAttributes] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [triggerData, setTriggerData] = useState({});

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

  useEffect(() => {
    console.log("Component mounted");

    // Fetch rule data when component mounts
    const fetchRuleData = async () => {
      try {
        setIsLoading(true);

        // Normal fetch attempt first
        try {
          // Get user data from session storage
          const user = userDetails;
          const workspace = sessionStorage.getItem("workspace");
          const workspace_id = sessionStorage.getItem("workspace_id");

          // Get rule_type and rule_id from sessionStorage
          const rule_type = sessionStorage.getItem("rule_type");
          const rule_id = sessionStorage.getItem("type_id");

          const payload = {
            user,
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

          // Log the entire response structure to understand the field names
          console.log("Complete API response:", JSON.stringify(data));
          console.log(
            "Data structure:",
            data.data ? Object.keys(data.data) : "No data object"
          );

          // Add more detailed logging for input attributes
          console.log("Full data object:", data.data);
          console.log("Input attributes directly:", data.data.input_attributes);

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

            // Set rule name and description
            if (data.data && data.data.name) {
              setRuleName(data.data.name);
            }

            if (data.data && data.data.description) {
              setRuleDescription(data.data.description);
            }

            // More comprehensive check for data sources
            let extractedSources = [];
            if (
              data.data?.data_sources &&
              Array.isArray(data.data.data_sources)
            ) {
              extractedSources = data.data.data_sources;
            } else if (
              data.data?.dataSources &&
              Array.isArray(data.data.dataSources)
            ) {
              extractedSources = data.data.dataSources;
            } else if (data.data?.sources && Array.isArray(data.data.sources)) {
              extractedSources = data.data.sources;
            }

            console.log("Data sources extracted:", extractedSources);
            setDataSources(extractedSources);

            // More comprehensive check for trigger scheduler data
            let scheduler = {};
            if (data.data?.trigger_scheduler) {
              scheduler = data.data.trigger_scheduler;
            } else if (data.data?.triggerScheduler) {
              scheduler = data.data.triggerScheduler;
            } else if (data.data?.scheduler) {
              scheduler = data.data.scheduler;
            }

            console.log("Trigger scheduler data extracted:", scheduler);
            setTriggerData(scheduler);
          } else {
            console.error("API response error:", data);
            throw new Error(data.message || "Failed to load rule data");
          }
        } catch (error) {
          console.error("Error in primary fetch:", error);
        }
      } catch (outerError) {
        console.error("Outer error fetching rule data:", outerError);
        toast.error(`Error loading rule data: ${outerError.message}`);
      } finally {
        setIsLoading(false);

        // Sequence the API calls with delays to ensure stable rendering
        setTimeout(() => {
          console.log(
            "Now fetching input attributes after main data is loaded"
          );
          fetchInputAttributes();

          setTimeout(() => {
            console.log(
              "Now fetching mapped data sources after input attributes"
            );
            fetchMappedDataSources();
          }, 500);
        }, 300);
      }
    };

    fetchRuleData();
  }, []);

  // Update the fetchInputAttributes function to have better handling
  const fetchInputAttributes = async () => {
    try {
      console.log("Starting input attributes fetch...");

      // Get user data from session storage
      const user = userDetails;
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_id = sessionStorage.getItem("type_id");
      const rule_type = sessionStorage.getItem("rule_type");

      if (!user || !workspace || !workspace_id || !rule_type || !rule_id) {
        console.error(
          "Missing required session data for input attributes fetch"
        );
        return;
      }

      const payload = {
        user,
        workspace,
        workspace_id,
        rule_id,
        rule_type,
      };

      console.log(
        "Fetching input attributes with payload:",
        JSON.stringify(payload)
      );

      try {
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

        if (!response.ok) {
          throw new Error(
            `Failed to fetch input attributes: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(
          "Input attributes API full response:",
          JSON.stringify(data)
        );

        if (data === null || data === undefined) {
          console.log("Empty response from input attributes API");
          setInputAttributes([]);
          return;
        }

        if (data.status === "Success" || data.status === "success") {
          // Check for input_attributes in the response
          if (
            data.data?.input_attributes &&
            Array.isArray(data.data.input_attributes)
          ) {
            console.log(
              "✅ Setting input attributes from API:",
              data.data.input_attributes
            );
            if (data.data.input_attributes.length > 0) {
              setInputAttributes(data.data.input_attributes);
            } else {
              console.log("Empty input_attributes array");
              setInputAttributes([]);
            }
          } else if (
            data.data?.global_attributes &&
            Array.isArray(data.data.global_attributes)
          ) {
            // If input_attributes is not available, try global_attributes
            console.log(
              "✅ Setting global attributes as input attributes:",
              data.data.global_attributes
            );
            if (data.data.global_attributes.length > 0) {
              setInputAttributes(data.data.global_attributes);
            } else {
              console.log("Empty global_attributes array");
              setInputAttributes([]);
            }
          } else {
            console.log("No recognizable attributes in API response");
            setInputAttributes([]);
          }
        } else {
          console.error("getAttribute API response error:", data);
          setInputAttributes([]);
        }
      } catch (error) {
        console.error("API call error in fetchInputAttributes:", error);
        setInputAttributes([]);
      }
    } catch (error) {
      console.error("Error in fetchInputAttributes:", error);
      setInputAttributes([]);
    }
  };

  // Enhance the fetchMappedDataSources function with better validation
  const fetchMappedDataSources = async () => {
    try {
      // Get user data from session storage
      const user = userDetails;
      const workspace = sessionStorage.getItem("workspace");
      const workspace_id = sessionStorage.getItem("workspace_id");
      const rule_type = sessionStorage.getItem("rule_type");
      const type_id = sessionStorage.getItem("type_id");

      if (!user || !workspace || !workspace_id || !rule_type || !type_id) {
        console.error("Missing required session data for data source fetch");
        return;
      }

      const payload = {
        user: userDetails,
        workspace,
        workspace_id,
        rule_type,
        type_id,
      };

      console.log(
        "Fetching mapped data sources with payload:",
        JSON.stringify(payload)
      );

      try {
        const response = await fetch(
          "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/viewMappedDataSource",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch mapped data sources: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log(
          "Mapped data sources API full response:",
          JSON.stringify(data)
        );

        // If no data or empty response, clear the data sources array
        if (data === null || data === undefined) {
          console.log("Empty response from mapped data sources API");
          setDataSources([]);
          return;
        }

        // Helper function to validate if a data source object has useful data
        const isValidDataSource = (src) => {
          if (!src || typeof src !== "object") return false;

          // Consider a data source valid only if it has a proper name and platform
          // OR if it has input_data_map with actual mappings
          const hasNameAndPlatform =
            src.datasource_name &&
            src.datasource_name !== "Unnamed Data Source";

          const hasMappings =
            src.input_data_map &&
            typeof src.input_data_map === "object" &&
            Object.keys(src.input_data_map).length > 0;

          return hasNameAndPlatform || hasMappings;
        };

        // Process direct data source object format
        if (data.datasource_name) {
          console.log("✅ Direct data source object received");
          if (isValidDataSource(data)) {
            setDataSources([data]);
          } else {
            console.log(
              "⚠️ Direct data source object doesn't contain useful data"
            );
            setDataSources([]);
          }
          return;
        }

        // Process standard response format
        if (data.status === "Success" || data.status === "success") {
          console.log("✅ Standard success response format");
          const sourceData = Array.isArray(data.data) ? data.data : [data.data];
          if (sourceData && sourceData.length > 0) {
            // Filter out any invalid data sources
            const validSources = sourceData.filter(isValidDataSource);
            if (validSources.length > 0) {
              setDataSources(validSources);
            } else {
              console.log("⚠️ No valid data sources found in response");
              setDataSources([]);
            }
          } else {
            console.log("No data sources found in standard response");
            setDataSources([]);
          }
        }

        // Process array format
        if (Array.isArray(data)) {
          console.log("✅ Direct array response format");
          const validSources = data.filter(isValidDataSource);
          if (validSources.length > 0) {
            setDataSources(validSources);
          } else {
            console.log("⚠️ No valid data sources found in array");
            setDataSources([]);
          }
          return;
        }

        // If we reach here, try to use the data directly as a last resort
        console.log("⚠️ Unrecognized format - attempting to use direct data");
        if (
          typeof data === "object" &&
          data !== null &&
          isValidDataSource(data)
        ) {
          setDataSources([data]);
        } else {
          console.log("❌ No usable data in response");
          setDataSources([]);
        }
      } catch (error) {
        console.error("API call error in fetchMappedDataSources:", error);
        setDataSources([]);
      }
    } catch (error) {
      console.error("Error in fetchMappedDataSources:", error);
      setDataSources([]);
    }
  };

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setOnClose(), 300);
  };

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Add the useEffect for fetchInputAttributes as a fallback
  useEffect(() => {
    // This is a fallback in case the sequenced call in the main useEffect fails
    const timer = setTimeout(() => {
      // Only run if inputAttributes is still empty after main loading
      if (inputAttributes.length === 0 && !isLoading) {
        console.log(
          "Fallback: Fetching input attributes since array is still empty"
        );
        fetchInputAttributes();
      }
    }, 1500); // Wait 1.5 seconds after component mount

    return () => clearTimeout(timer);
  }, [inputAttributes.length, isLoading]);

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <style>{scrollbarStyles}</style>
      <div className="w-[5%] h-full flex items-center justify-center"></div>
      <div
        className={`w-[95%] p-6 h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle} overflow-y-auto`}
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
                View Decision Table
              </div>
              <div className="leftBox flex justify-center items-center gap-6">
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

            {/* Rule Details */}
            <div
              className={`mb-4 p-4 rounded-md ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <h2 className="text-xl font-bold mb-2">{ruleName}</h2>
              {ruleDescription && (
                <p
                  className={`${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {ruleDescription}
                </p>
              )}
              <div className="mt-3 text-sm">
                <span
                  className={`font-medium mr-2 ${
                    theme === "dark" ? "text-gray-200" : ""
                  }`}
                >
                  Rule Policy:
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    theme === "dark"
                      ? "bg-blue-900 text-blue-100"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {selectedRulePolicy || "Not specified"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Input Attributes Section */}
              <div
                className={`p-4 rounded-md shadow h-full flex flex-col ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-700"
                  }`}
                >
                  Input Attributes
                </h3>
                {inputAttributes && inputAttributes.length > 0 ? (
                  <div
                    className="flex-1 overflow-y-auto custom-scrollbar"
                    style={{ maxHeight: "250px" }}
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
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-500"
                            }`}
                          >
                            Name
                          </th>
                          <th
                            className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-500"
                            }`}
                          >
                            Type
                          </th>
                          <th
                            className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-500"
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
                        {inputAttributes.map((attr, index) => (
                          <tr key={index}>
                            <td
                              className={`px-3 py-2 whitespace-nowrap text-sm ${
                                theme === "dark"
                                  ? "text-gray-200"
                                  : "text-gray-900"
                              }`}
                            >
                              {attr.attribute}
                            </td>
                            <td
                              className={`px-3 py-2 whitespace-nowrap text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {attr.data_type}
                            </td>
                            <td
                              className={`px-3 py-2 whitespace-nowrap text-sm ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
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

              {/* Data Sources Section */}
              <div
                className={`p-4 rounded-md shadow h-full flex flex-col ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-700"
                  }`}
                >
                  Data Sources
                </h3>
                {/* Modified check: Only show list if at least one source has mappings */}
                {dataSources &&
                dataSources.length > 0 &&
                dataSources.some(
                  (source) =>
                    source.input_data_map &&
                    Object.keys(source.input_data_map).length > 0
                ) ? (
                  <div
                    className="flex-1 overflow-y-auto custom-scrollbar"
                    style={{ maxHeight: "250px" }}
                  >
                    {dataSources.map((source, index) => (
                      <div
                        key={index}
                        className={`border-b pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0 ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        <div
                          className={`font-medium text-lg mb-2 ${
                            theme === "dark" ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          {source.datasource_name || "Unnamed Data Source"}
                        </div>
                        <div className="mb-2">
                          <span
                            className={`font-medium ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            Platform:{" "}
                          </span>
                          <span
                            className={
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-600"
                            }
                          >
                            {source.platform || "Not specified"}
                          </span>
                        </div>
                        {source.input_data_map &&
                        Object.keys(source.input_data_map).length > 0 ? (
                          <div>
                            <div
                              className={`font-medium mb-1 ${
                                theme === "dark"
                                  ? "text-gray-300"
                                  : "text-gray-700"
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
                      Data sources will appear here when they are mapped to this
                      rule
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mainBox flex h-full">
              <div className="condition w-[70%] h-full pt-2 pb-10 overflow-auto [&::-webkit-scrollbar]:hidden">
                <div className="builder-section h-[75%] overflow-auto mb-6">
                  <DecisionBuilderContainer
                    conditions={currentConditions}
                    onUpdate={setCurrentConditions}
                    isReadOnly={true} // Always read-only in view mode
                    decision_id={sessionStorage.getItem("type_id")}
                  />
                </div>

                {/* Actions Section - Always visible with message when empty */}
                <div
                  className={`action-section p-6 rounded-md shadow ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="btnsclass flex justify-between items-center mb-4">
                    <div
                      className={`label text-xl font-bold flex items-center ${
                        theme === "dark" ? "text-blue-400" : "text-blue-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Actions
                    </div>
                    {actions.length > 0 && (
                      <div
                        className={
                          theme === "dark"
                            ? "text-sm text-gray-400"
                            : "text-sm text-gray-500"
                        }
                      >
                        {actions.length} action{actions.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {actions.length > 0 ? (
                    <div
                      className={`overflow-y-auto custom-scrollbar border rounded-md shadow-inner ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                      style={{ maxHeight: "400px", display: "block" }}
                    >
                      {actions.map((action, index) => (
                        <div
                          key={action.id || index}
                          className={`p-5 ${
                            index !== actions.length - 1
                              ? theme === "dark"
                                ? "border-b border-gray-700"
                                : "border-b border-gray-200"
                              : ""
                          } ${inputBg} ${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          } transition-colors`}
                        >
                          <div className="flex items-center mb-3">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3 ${
                                theme === "dark"
                                  ? "bg-blue-900 text-blue-200"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <span
                              className={`font-bold text-lg ${
                                theme === "dark"
                                  ? "text-blue-400"
                                  : "text-blue-700"
                              }`}
                            >
                              {action.name}
                            </span>
                          </div>

                          <div
                            className={`p-4 rounded-lg ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div className="flex items-start">
                                <span
                                  className={`flex-shrink-0 font-medium mr-2 ${
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-700"
                                  }`}
                                >
                                  Platform:
                                </span>
                                <span
                                  className={`px-2 py-1 rounded ${
                                    theme === "dark"
                                      ? "bg-blue-900 text-blue-200"
                                      : "bg-blue-50 text-blue-800"
                                  }`}
                                >
                                  {action.platform || "Not specified"}
                                </span>
                              </div>
                            </div>

                            {action.action_query && (
                              <div className="mt-3">
                                <div className="flex items-center mb-2">
                                  <span
                                    className={`font-medium mr-2 ${
                                      theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    Action Query:
                                  </span>
                                  <div
                                    className={`flex-grow h-px ${
                                      theme === "dark"
                                        ? "bg-gray-600"
                                        : "bg-gray-200"
                                    }`}
                                  ></div>
                                </div>
                                <div
                                  className={`p-3 rounded-md border overflow-x-auto custom-scrollbar ${
                                    theme === "dark"
                                      ? "bg-gray-800 border-gray-600"
                                      : "bg-gray-100 border-gray-300"
                                  }`}
                                >
                                  <pre
                                    className={`text-sm whitespace-pre-wrap ${
                                      theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {typeof action.action_query === "object"
                                      ? JSON.stringify(
                                          action.action_query,
                                          null,
                                          2
                                        )
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
                      className={`py-10 text-center rounded-md border ${
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
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 110 20 10 10 0 010-20z"
                        />
                      </svg>
                      <p
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        No actions defined for this rule
                      </p>
                      <p
                        className={
                          theme === "dark"
                            ? "text-gray-400 text-sm mt-1"
                            : "text-gray-400 text-sm mt-1"
                        }
                      >
                        Actions will appear here when they are added to the rule
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar with TriggerSchedular */}
              <div className="condition w-[30%] h-full">
                <TriggerSchedular
                  theme={theme}
                  workspace={workspace}
                  workspace_id={workspace_id}
                  isSaved={true} // Always view as saved
                  readOnly={true} // Use the proper prop name
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewDecisionTable;
