import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Check } from "lucide-react";
import axios from "axios";
import TestResultsDisplay from "./TestResultsDisplay ";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const TestRule = ({
  isOpen,
  setIsOpen,
  theme,
  currentConditions,
  actions,
  thenResult,
  elseResult,
  isTested,
  setIsTested,
}) => {
  const createRef = useRef(null);
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingRule, setTestingRule] = useState(false);

  // New state variables for Add Test Data functionality
  const [showAddTestData, setShowAddTestData] = useState(false);
  const [dataTypes, setDataTypes] = useState([]);
  const [selectedDataType, setSelectedDataType] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [loadingDataTypes, setLoadingDataTypes] = useState(false);

  const testDataDict = useMemo(() => {
    const dict = {};
    testData.forEach((item) => {
      let formattedValue = item.value;

      if (item.data_type === "Numeric" && formattedValue !== "") {
        formattedValue = Number(formattedValue);
      } else if (item.data_type === "Boolean") {
        formattedValue = Boolean(formattedValue);
      }

      dict[item.name] = formattedValue;
    });
    return dict;
  }, [testData]);

  // Convert thenResult and elseResult arrays into dictionaries
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      fetchAttributes();
      setTestResult(null);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch data types from API
  const fetchDataTypes = async () => {
    setLoadingDataTypes(true);
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/getDatatypes",
        { collection_id: "attribute_datatype" }
      );

      if (response.data.status === "Success" && response.data.DataTypes) {
        setDataTypes(response.data.DataTypes);
        setSelectedDataType(response.data.DataTypes[0] || "");
      } else {
        console.error("Failed to fetch data types:", response.data);
        toast.error("Failed to fetch data types");
      }
    } catch (error) {
      console.error("Error fetching data types:", error);
      toast.error("Error fetching data types");
    } finally {
      setLoadingDataTypes(false);
    }
  };

  // Handle showing the add test data form
  const handleShowAddTestData = () => {
    setShowAddTestData(true);
    fetchDataTypes();
    setCustomKey("");
    setCustomValue("");
  };

  // Add custom test data
  const handleAddCustomTestData = () => {
    if (!customKey.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    // Generate a unique ID for the new test data entry
    const newId = `custom_${Date.now()}`;

    // Format the value based on the data type
    let formattedValue = customValue;
    if (selectedDataType === "Numeric" && customValue !== "") {
      formattedValue = customValue; // Keep as string for input field
    } else if (selectedDataType === "Boolean") {
      formattedValue = customValue === "True";
    }

    // Create the new test data entry
    const newTestData = {
      id: newId,
      name: customKey,
      value: formattedValue,
      data_type: selectedDataType,
      source_type: "custom",
    };

    // Add to test data
    setTestData([...testData, newTestData]);

    // Reset form
    setCustomKey("");
    setCustomValue("");
    setShowAddTestData(false);

    toast.success("Test data added successfully");
  };

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const payload = {
        user: user,
        workspace: sessionStorage.getItem("workspace"),
        workspace_id: sessionStorage.getItem("workspace_id"),
        rule_type: sessionStorage.getItem("rule_type"),
        rule_id: sessionStorage.getItem("type_id"),
      };

      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
        payload
      );

      if (response.data.status === "Success") {
        // Only process input attributes
        const inputAttributes = response.data.data.input_attributes || [];

        // Format attributes for test data
        const formattedData = inputAttributes.map((attr, index) => {
          // Process value based on data type
          let processedValue;
          switch (attr.data_type) {
            case "Numeric":
              // Store numeric values as strings for editing
              processedValue =
                attr.test_value === null || attr.test_value === undefined
                  ? ""
                  : String(attr.test_value);
              break;
            case "Boolean":
              processedValue =
                attr.test_value === true || attr.test_value === "True";
              break;
            case "Date":
            case "DateTime":
              processedValue = attr.test_value || "";
              break;
            default:
              processedValue = attr.test_value || "";
          }

          // Ensure we have a unique identifier for each attribute
          const uniqueId = attr._id || `attr_${attr.attribute}_${index}`;

          return {
            id: uniqueId,
            name: attr.attribute,
            value: processedValue,
            data_type: attr.data_type,
            source_type: "input_attributes",
          };
        });

        setTestData(formattedData);
      } else {
        console.error("Failed to fetch attributes:", response.data);
        // Allow testing even if attribute fetch fails
        setTestData([]);
      }
    } catch (error) {
      console.error("Error fetching attributes:", error);
      // Allow testing even if attribute fetch fails
      setTestData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatValueByType = (value, dataType) => {
    if (value === undefined || value === null) return "";

    switch (dataType) {
      case "Numeric":
        return value === "" ? "" : Number(value);
      case "Boolean":
        return typeof value === "boolean" ? value : value === "True";
      case "Date":
      case "DateTime":
        return value || "";
      default:
        return value;
    }
  };

  const handleValueChange = (id, newValue, dataType, attributeName) => {
    setTestData((prevData) =>
      prevData.map((item) => {
        const isTargetItem =
          item.id === id || (id === undefined && item.name === attributeName);

        if (isTargetItem) {
          return {
            ...item,
            value: formatInputValueByType(newValue, dataType),
          };
        }
        return item;
      })
    );
  };

  const formatInputValueByType = (value, dataType) => {
    if (value === undefined || value === null) return "";

    switch (dataType) {
      case "Numeric":
        return value;
      case "Boolean":
        return typeof value === "boolean" ? value : value === "True";
      case "Date":
      case "DateTime":
        return value;
      default:
        return value;
    }
  };

  const renderInputByType = (attribute, index) => {
    const { id, data_type, value, name } = attribute;
    const inputId = id || `input_${name}_${index}`;

    switch (data_type) {
      case "Boolean":
        return (
          <select
            id={inputId}
            value={value === true ? "True" : "False"}
            onChange={(e) =>
              handleValueChange(
                inputId,
                e.target.value === "True",
                data_type,
                name
              )
            }
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        );
      case "Numeric":
        return (
          <input
            id={inputId}
            type="number"
            value={value !== undefined && value !== null ? value : ""}
            onChange={(e) => {
              const inputValue = e.target.value;
              handleValueChange(inputId, inputValue, data_type, name);
            }}
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      case "Date":
        return (
          <input
            id={inputId}
            type="date"
            value={value || ""}
            onChange={(e) =>
              handleValueChange(inputId, e.target.value, data_type, name)
            }
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      case "DateTime":
        return (
          <input
            id={inputId}
            type="datetime-local"
            value={value || ""}
            onChange={(e) =>
              handleValueChange(inputId, e.target.value, data_type, name)
            }
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      default:
        return (
          <input
            id={inputId}
            type="text"
            value={value !== undefined && value !== null ? value : ""}
            onChange={(e) =>
              handleValueChange(inputId, e.target.value, data_type, name)
            }
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
    }
  };

  // Render custom value input based on data type
  const renderCustomValueInput = () => {
    switch (selectedDataType) {
      case "Boolean":
        return (
          <select
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            <option value="">Select a value</option>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        );
      case "Numeric":
        return (
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter a numeric value"
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      case "Date":
        return (
          <input
            type="date"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      case "DateTime":
        return (
          <input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
      default: // String and other types
        return (
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter a value"
            className={`p-3 w-full border rounded-md ${
              theme === "dark"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-black"
            }`}
          />
        );
    }
  };

  const testRule = async () => {
    setTestingRule(true);
    try {
      const test_data = { input: [testDataDict] };
      const conditions = [currentConditions];
      const updated_thenResult =
        thenResult.length > 0 ? { ...thenResultDict, value: true } : "";
      const updated_elseResult =
        elseResult.length > 0 ? { ...elseResultDict, value: false } : "";

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
        rule_type: sessionStorage.getItem("rule_type"),
        data: data,
        test_data: test_data,
      };

      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/testRules_Rulesets",
        payload
      );

      // if (response.data.status === "Success") {
      //   console.log("Received response:", response.data);
      //   setIsTested(true);
      // } else {
      //   console.log("Received response in else:", response.data);
      // }

      setIsTested(true);
      setTestResult(response.data);
      toast.success("Rule tested successfully");
    } catch (error) {
      console.error("API call failed:", error);
      setTestResult({
        error: error.message || "An error occurred while testing the rule",
      });
    } finally {
      setTestingRule(false);
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 w-full md:w-2/3 lg:w-1/2 h-full z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ boxShadow: "-5px 0 15px rgba(0, 0, 0, 0.1)" }}
    >
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme === "dark" ? "#1a1a1a" : "#f1f1f1"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === "dark" ? "#444" : "#888"};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark" ? "#555" : "#777"};
        }
      `}</style>
      <div
        className={`w-full h-full p-8 overflow-auto custom-scrollbar ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
        ref={createRef}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Test Rule</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 cursor-pointer rounded-md hover:bg-red-500 dark:hover:bg-blue-600"
          >
            <X size={24} />
          </button>
        </div>

        <hr
          className={`${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />

        <div className="mb-6">
          <p className="mb-4">Enter test values for input attributes:</p>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {testData.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {testData.map((attribute, index) => (
                    <div
                      key={`input_${attribute.name}_${index}`}
                      className="mb-4 flex flex-col md:flex-row md:items-center"
                    >
                      <div className="md:w-1/3 mb-2 md:mb-0">
                        <label className="block font-medium">
                          {attribute.name}
                        </label>
                        <span className="text-xs text-gray-500">
                          ({attribute.data_type})
                        </span>
                      </div>
                      <div className="md:w-2/3">
                        {renderInputByType(attribute, index)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    No input attributes found. Please add input attributes
                    first.
                  </p>
                </div>
              )}

              {/* Add Test Data Button and Form */}
              {!showAddTestData ? (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleShowAddTestData}
                    className={`flex items-center px-4 py-2 rounded-md text-white ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Test Data
                  </button>
                </div>
              ) : (
                <div
                  className={`mt-6 p-4 rounded-md ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <h3 className="text-lg font-medium mb-4">
                    Add Custom Test Data
                  </h3>

                  {loadingDataTypes ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 border-solid"></div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">
                          Data Type
                        </label>
                        <select
                          value={selectedDataType}
                          onChange={(e) => setSelectedDataType(e.target.value)}
                          className={`p-3 w-full border rounded-md ${
                            theme === "dark"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-black"
                          }`}
                        >
                          {dataTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block mb-1 font-medium">Key</label>
                        <input
                          type="text"
                          value={customKey}
                          onChange={(e) => setCustomKey(e.target.value)}
                          placeholder="Enter key name"
                          className={`p-3 w-full border rounded-md ${
                            theme === "dark"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-black"
                          }`}
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block mb-1 font-medium">Value</label>
                        {renderCustomValueInput()}
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowAddTestData(false)}
                          className={`px-4 py-2 rounded-md ${
                            theme === "dark"
                              ? "bg-gray-600 hover:bg-gray-700"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCustomTestData}
                          className={`flex items-center px-4 py-2 rounded-md text-white ${
                            theme === "dark"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          <Check size={16} className="mr-2" />
                          Add
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <TestResultsDisplay testResult={testResult} theme={theme} />

        <div className="flex justify-end mt-6">
          <button
            onClick={testRule}
            disabled={testingRule}
            className={`px-6 py-2 font-bold rounded-xl ${
              testingRule
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
            } text-white`}
          >
            {testingRule ? "Testing..." : "Test Rule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRule;
