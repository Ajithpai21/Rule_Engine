import React, { useState, useEffect } from "react";
import {
  X,
  Quote,
  Hash,
  Check,
  Calendar,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  FolderX,
} from "lucide-react";
import { useSelector } from "react-redux";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const FALLBACK_DATATYPES = ["String", "Numeric", "Boolean", "DateTime", "Date"];

const ResultConfigPopup = ({ onSave, onCancel, initialConfig = {} }) => {
  const theme = useSelector((state) => state.theme.mode);
  const [customKey, setCustomKey] = useState(initialConfig.key || "");
  const [selectedDataType, setSelectedDataType] = useState(
    initialConfig.dataType || "String"
  );
  const [dataTypes, setDataTypes] = useState(FALLBACK_DATATYPES);
  const [attributes, setAttributes] = useState({}); // Store as object { groupName: [items] }
  const [loadingDataTypes, setLoadingDataTypes] = useState(false);
  const [errorDataTypes, setErrorDataTypes] = useState(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [errorAttributes, setErrorAttributes] = useState(null);
  const [isKeyFromLibrary, setIsKeyFromLibrary] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({}); // Track expanded state of groups

  // Initialize expanded state for all groups
  useEffect(() => {
    if (attributes) {
      const initialExpandedState = Object.keys(attributes).reduce(
        (acc, groupName) => {
          acc[groupName] = false; // Start with all groups expanded
          return acc;
        },
        {}
      );
      setExpandedGroups(initialExpandedState);
    }
  }, [attributes]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Get icon based on data type
  const getDataTypeIcon = (dataType) => {
    const iconProps = {
      size: 16,
      className: theme === "dark" ? "text-gray-300" : "text-gray-600",
    };

    switch (dataType?.toLowerCase()) {
      case "string":
        return <Quote {...iconProps} className="text-blue-500" />;
      case "numeric":
      case "number":
      case "integer":
        return <Hash {...iconProps} className="text-green-500" />;
      case "boolean":
        return <Check {...iconProps} className="text-purple-500" />;
      case "datetime":
        return <Clock {...iconProps} className="text-orange-500" />;
      case "date":
        return <Calendar {...iconProps} className="text-yellow-500" />;
      default:
        return <Database {...iconProps} className="text-gray-500" />;
    }
  };

  // Fetch Data Types
  useEffect(() => {
    const fetchDataTypes = async () => {
      setLoadingDataTypes(true);
      setErrorDataTypes(null);
      try {
        const response = await fetch(
          "https://micro-solution-ruleengineprod.mfilterit.net/getDatatypes",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collection_id: "attribute_datatype" }),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (
          result &&
          result.status === "Success" &&
          Array.isArray(result.DataTypes)
        ) {
          setDataTypes(result.DataTypes);
        } else {
          throw new Error("Invalid API response format for data types.");
        }
      } catch (error) {
        console.error("Error fetching data types:", error);
        setErrorDataTypes(`Failed to load: ${error.message}. Using fallback.`);
        setDataTypes(FALLBACK_DATATYPES); // Use fallback on error
      } finally {
        setLoadingDataTypes(false);
      }
    };

    fetchDataTypes();
  }, []);

  // Fetch Attribute Library
  useEffect(() => {
    const fetchAttributes = async () => {
      setLoadingAttributes(true);
      setErrorAttributes(null);
      setAttributes({}); // Reset attributes

      // --- Get payload data from session storage ---
      // NOTE: Ensure these keys match exactly how they are stored!
      const payload = {
        user: user,
        api_key: sessionStorage.getItem("api_key"), // Or however api_key is stored
        workspace: sessionStorage.getItem("workspace"),
        workspace_id: sessionStorage.getItem("workspace_id"),
      };

      // Basic validation
      if (
        !payload.user ||
        !payload.api_key ||
        !payload.workspace ||
        !payload.workspace_id
      ) {
        setErrorAttributes(
          "Missing required session information for attribute library."
        );
        setLoadingAttributes(false);
        return;
      }
      // --------------------------------------------

      try {
        const response = await fetch(
          "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/attributeLibraryList",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (
          result &&
          result.status === "Success" &&
          typeof result.data === "object"
        ) {
          // Check if data is empty
          if (Object.keys(result.data).length === 0) {
            setErrorAttributes("No attributes found in the library.");
            setAttributes({});
          } else {
            setAttributes(result.data); // Store the structured data { group: [items] }
          }
        } else {
          throw new Error("Invalid API response format for attribute library.");
        }
      } catch (error) {
        console.error("Error fetching attribute library:", error);
        setErrorAttributes(`Failed to load attributes: ${error.message}`);
        setAttributes({});
      } finally {
        setLoadingAttributes(false);
      }
    };

    fetchAttributes();
  }, []);

  const handleAttributeClick = (attribute) => {
    console.log("Selected attribute:", attribute); // Debug log

    // Determine the correct data type property from the attribute
    const dataTypeValue = attribute.dataType || attribute.data_type || "String";
    console.log("Using data type:", dataTypeValue); // Debug log

    setCustomKey(attribute.name);
    setSelectedDataType(dataTypeValue);
    setIsKeyFromLibrary(true);

    // Submit automatically when selecting from library
    onSave({
      key: attribute.name,
      name: attribute.name,
      dataType: dataTypeValue, // Use the corrected property
    });
  };

  const handleSave = () => {
    if (!customKey) {
      alert("Please enter a key name");
      return;
    }
    if (!selectedDataType) {
      alert("Please select a data type for the custom key.");
      return;
    }
    onSave({
      key: customKey,
      name: customKey, // Use the same value for name
      dataType: selectedDataType,
    });
  };

  return (
    <div
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className={`${
          theme === "dark"
            ? "bg-gray-800 text-gray-100"
            : "bg-white text-gray-800"
        } rounded-lg shadow-xl p-6 w-full max-w-md relative`}
      >
        {/* Header */}
        <div className="flex  justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Result Key for Column</h2>
          <button
            onClick={onCancel}
            className={`cursor-pointer ${
              theme === "dark"
                ? "text-gray-300 hover:text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Custom Key Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Custom Key</h3>
          <label
            htmlFor="custom-key-input"
            className={`block text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            } mb-1`}
          >
            Key
          </label>
          <input
            id="custom-key-input"
            type="text"
            value={customKey}
            onChange={(e) => {
              setCustomKey(e.target.value);
              setSelectedDataType("");
              setIsKeyFromLibrary(false);
            }}
            placeholder="# Enter custom key name"
            className={`w-full px-3 py-2 border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                : "bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            } rounded-md shadow-sm focus:outline-none`}
          />
          {!isKeyFromLibrary && (
            <div className="mt-3">
              <label
                htmlFor="custom-key-datatype"
                className={`block text-sm font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                } mb-1`}
              >
                Data Type
              </label>
              <select
                id="custom-key-datatype"
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800"
                    : "bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                }`}
                disabled={!customKey || isKeyFromLibrary}
              >
                <option value="">Select Data Type</option>
                {loadingDataTypes && <option disabled>Loading...</option>}
                {errorDataTypes && (
                  <option disabled>Error loading types</option>
                )}
                {Array.isArray(dataTypes) &&
                  dataTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
              {errorDataTypes && (
                <p className="text-xs text-red-500 mt-1">{errorDataTypes}</p>
              )}
            </div>
          )}
        </div>

        {/* Attributes Library Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Attributes Library</h3>
          <div
            className={`border rounded-md max-h-60 overflow-y-auto p-3 ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            {loadingAttributes ? (
              <p
                className={`text-center ${
                  theme === "dark" ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Loading Attributes...
              </p>
            ) : errorAttributes ? (
              <p className="text-center text-red-500">{errorAttributes}</p>
            ) : Object.keys(attributes).length === 0 ? (
              <p
                className={`text-center ${
                  theme === "dark" ? "text-gray-300" : "text-gray-500"
                }`}
              >
                No attributes found in library.
              </p>
            ) : (
              Object.entries(attributes).map(([groupName, items]) => (
                <div key={groupName} className="mb-3 last:mb-0">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className={`w-full cursor-pointer   flex items-center justify-between px-2 py-2 rounded-md ${
                      theme === "dark"
                        ? "bg-gray-600 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    <p
                      className={`text-md font-bold ${
                        theme === "dark" ? " text-gray-100" : "text-gray-800"
                      }`}
                    >
                      {groupName}
                    </p>
                    {expandedGroups[groupName] ? (
                      <ChevronUp
                        size={20}
                        className={
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }
                      />
                    ) : (
                      <ChevronDown
                        size={20}
                        className={
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }
                      />
                    )}
                  </button>
                  {expandedGroups[groupName] && (
                    <div className="border-l-2 border-blue-500 pl-2 mt-1">
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map((attr) => (
                          <button
                            key={attr._id || attr.id || attr.name}
                            onClick={() => handleAttributeClick(attr)}
                            className={`cursor-pointer w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md ${
                              customKey === attr.name && isKeyFromLibrary
                                ? theme === "dark"
                                  ? "bg-blue-800 text-blue-100 font-medium"
                                  : "bg-blue-100 text-blue-800 font-medium"
                                : theme === "dark"
                                ? "text-gray-200 hover:bg-gray-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {getDataTypeIcon(attr.data_type)}
                            <span className="text-md">{attr.name}</span>
                            <span className="text-xs opacity-75">
                              {attr.data_type}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p
                          className={`text-xs px-2 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          No items in this group.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        {!isKeyFromLibrary && (
          <div>
            <button
              onClick={handleSave}
              disabled={!customKey || !selectedDataType}
              className={`w-full px-4 py-2 rounded-md text-white font-semibold ${
                !customKey || !selectedDataType
                  ? theme === "dark"
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-400 cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              }`}
            >
              Save Custom Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultConfigPopup;
