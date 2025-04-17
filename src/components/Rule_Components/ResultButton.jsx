import React, { useRef, useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Library,
  Folder,
  FolderX,
  Database,
  DatabaseZap,
} from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import getUserDetails from "@/utils/getUserDetails";
import { toast } from "react-toastify";
const user = getUserDetails();

const GET_ATTRIBUTE_URL =
  "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute";
const ATTRIBUTE_LIBRARY_URL =
  "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/attributeLibraryList";
const GET_DATATYPES_URL =
  "https://micro-solution-ruleengineprod.mfilterit.net/getDatatypes";

const ResultButton = ({
  isOpen,
  setIsOpen,
  result,
  setResult,
  section,
  isTested,
  setIsTested,
}) => {
  const createRef = useRef(null);
  const addBtnRef = useRef(null);
  const attributeSelectorRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isAttributeSelectorOpen, setIsAttributeSelectorOpen] = useState(false);
  const [selectedRowIndexForAttribute, setSelectedRowIndexForAttribute] =
    useState(null);
  const [isDataTypeModalOpen, setIsDataTypeModalOpen] = useState(false);

  const [fetchedAttributes, setFetchedAttributes] = useState({
    global_attributes: [],
    input_attributes: [],
  });
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [errorAttributes, setErrorAttributes] = useState(null);
  const [expandedAttributeGroups, setExpandedAttributeGroups] = useState({});

  const theme = useSelector((state) => state.theme.mode);

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );

  // Fetch data types from API
  const fetchDataTypes = async () => {
    const response = await axios.post(GET_DATATYPES_URL, {
      collection_id: "attribute_datatype",
    });
    return response.data.DataTypes || [];
  };

  const {
    data: dataTypes = [],
    isLoading: isLoadingDataTypes,
    error: dataTypesError,
  } = useQuery({
    queryKey: ["dataTypes"],
    queryFn: fetchDataTypes,
    staleTime: 3600000, // Cache for 1 hour
  });

  const fetchAPiAttributeLibrary = async () => {
    const response = await axios.post(ATTRIBUTE_LIBRARY_URL, {
      user: user,
      api_key: sessionStorage.getItem("api_key"),
      workspace: workspace,
      workspace_id: workspace_id,
    });
    return response.data.data || {};
  };

  const {
    data: apiAttributeLibrary,
    isLoading: isLoadingApiAttributeLibrary,
    refetch: refetchApiAttributeLibrary,
  } = useQuery({
    queryKey: ["apiAttributeLibrary", workspace],
    queryFn: fetchAPiAttributeLibrary,
    staleTime: 60000,
  });

  const fetchAttributesForData = async () => {
    console.log("Fetching attributes for data dropdown...");
    setIsLoadingAttributes(true);
    setErrorAttributes(null);
    setFetchedAttributes({ global_attributes: [], input_attributes: [] });

    const payload = {
      user: user,
      workspace: sessionStorage.getItem("workspace"),
      workspace_id: sessionStorage.getItem("workspace_id"),
      rule_type: sessionStorage.getItem("rule_type"),
      rule_id: sessionStorage.getItem("type_id"),
    };

    if (
      !payload.user ||
      !payload.workspace ||
      !payload.workspace_id ||
      !payload.rule_type ||
      !payload.rule_id
    ) {
      const errorMsg = "Missing required session information for getAttribute.";
      console.error(errorMsg, payload);
      setErrorAttributes(errorMsg);
      setIsLoadingAttributes(false);
      return;
    }

    try {
      const response = await fetch(GET_ATTRIBUTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultData = await response.json();
      console.log("getAttribute response:", resultData);

      if (
        resultData &&
        resultData.status === "Success" &&
        typeof resultData.data === "object" &&
        resultData.data !== null
      ) {
        setFetchedAttributes({
          global_attributes: resultData.data.global_attributes || [],
          input_attributes: resultData.data.input_attributes || [],
        });
        setExpandedAttributeGroups({
          "Global Attributes": true,
          "Input Attributes": true,
        });
      } else {
        throw new Error(
          resultData.message || "Invalid API response format for getAttribute."
        );
      }
    } catch (error) {
      console.error("Error fetching getAttribute:", error);
      setErrorAttributes(`Failed to load attributes: ${error.message}`);
      setFetchedAttributes({ global_attributes: [], input_attributes: [] });
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen(false);
        setDropdownOpen(false);
        setLibraryOpen(false);
        setIsAttributeSelectorOpen(false);
        setIsDataTypeModalOpen(false);
      }
      if (addBtnRef.current && !addBtnRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        attributeSelectorRef.current &&
        !attributeSelectorRef.current.contains(event.target)
      ) {
        setIsAttributeSelectorOpen(false);
      }
    }

    if (isOpen || isAttributeSelectorOpen || isDataTypeModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    isOpen,
    setIsOpen,
    addBtnRef,
    dropdownOpen,
    libraryOpen,
    isAttributeSelectorOpen,
    isDataTypeModalOpen,
  ]);

  const getThemeClasses = {
    background:
      theme === "dark" ? "bg-black text-white" : "bg-white text-black",
    input:
      theme === "dark"
        ? "bg-gray-800 border-gray-700 text-white"
        : "bg-white border-gray-300 text-black",
    disabledInput:
      theme === "dark"
        ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
        : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed",
    dropdown:
      theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black",
    dropdownHover: theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100",
    button: {
      addResult:
        theme === "dark"
          ? "bg-gray-700 text-white hover:bg-blue-500"
          : "bg-gray-200 text-black hover:bg-blue-500",
      dropdownItem:
        theme === "dark"
          ? "text-white hover:bg-gray-700"
          : "text-black hover:bg-gray-100",
      close: theme === "dark" ? "hover:bg-red-700" : "hover:bg-red-500",
      delete:
        theme === "dark"
          ? "bg-red-800 text-white hover:bg-red-700"
          : "bg-red-500 text-white hover:bg-red-600",
      iconButton:
        theme === "dark"
          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300",
    },
  };

  const addCustomAttributeRow = () => {
    setIsTested(false);
    setResult([
      ...result,
      {
        type: "custom",
        data_type: "String",
        key: "",
        value: "",
        isAttributeData: false,
        isNew: true,
      },
    ]);
  };

  const addCustomAttributeWithDataType = (dataType) => {
    setIsTested(false);
    setResult([
      ...result,
      {
        type: "custom",
        data_type: dataType,
        key: "",
        value: "",
        isAttributeData: false,
        isNew: true,
      },
    ]);
    setIsDataTypeModalOpen(false);
  };

  const updateRow = (index, field, value) => {
    setIsTested(false);
    const newResult = [...result];
    const currentRow = newResult[index];

    // Determine read-only status based on flags
    const isKeyEditable = currentRow.isNew && currentRow.type !== "library"; // Key editable only if new AND not library type
    const isValueEditable = currentRow.isNew && !currentRow.isAttributeData; // Value editable only if new AND no attribute data

    // --- Prevent updates to read-only fields --- START
    if (field === "key" && !isKeyEditable) {
      console.warn(`Attempted to update read-only key for row index ${index}.`);
      return;
    }
    if (field === "value" && !isValueEditable) {
      // Special case: allow internal update ONLY when linking attribute data
      if (typeof value === "object" && value.hasOwnProperty("source_type")) {
        // Allow this specific update to proceed (it marks the value as non-editable afterwards)
      } else {
        console.warn(
          `Attempted to update read-only value for row index ${index}.`
        );
        return; // Prevent other direct value edits
      }
    }
    if (field === "data_type" && !isValueEditable) {
      // Also prevent data_type change if value isn't editable
      console.warn(
        `Attempted to update data_type for read-only row index ${index}.`
      );
      return;
    }
    // --- Prevent updates to read-only fields --- END

    // Handle specific field updates
    if (field === "data_type") {
      newResult[index][field] = value;
      newResult[index].value = ""; // Reset value
    } else if (field === "value") {
      // If value is an object, it's attribute data being set internally
      if (
        typeof value === "object" &&
        value !== null &&
        value.hasOwnProperty("source_type")
      ) {
        newResult[index].value = value;
        newResult[index].isAttributeData = true;
        // Update data_type to match attribute if available
        if (value.data_type) newResult[index].data_type = value.data_type;
      } else {
        // Otherwise, it's a direct value update (only allowed if isValueEditable)
        const dataType = currentRow.data_type;
        let formattedValue = value;
        // (Formatting logic remains)
        switch (dataType) {
          case "Number":
            if (value === "" || isNaN(Number(value))) {
              formattedValue = value;
            } else {
              formattedValue = Number(value);
            }
            break;
          case "Boolean":
            if (typeof value === "boolean") {
              formattedValue = value;
            } else if (value === "true") {
              formattedValue = true;
            } else if (value === "false") {
              formattedValue = false;
            } else {
              formattedValue = null;
            }
            break;
          default:
            formattedValue = value;
        }
        newResult[index][field] = formattedValue;
      }
    } else if (field === "key") {
      // Update key (only allowed if isKeyEditable)
      newResult[index][field] = value;
    }

    setResult(newResult);
  };

  const updateRowWithAttributeData = (attribute, sourceType) => {
    if (selectedRowIndexForAttribute === null) return;
    setIsTested(false);
    // This call will set the value object and mark isAttributeData = true in updateRow
    updateRow(selectedRowIndexForAttribute, "value", {
      source_type: sourceType,
      value: attribute.attribute,
      data_type: attribute.data_type,
    });
    setIsAttributeSelectorOpen(false);
    setSelectedRowIndexForAttribute(null);
  };

  const addLibraryAttribute = (attribute) => {
    setIsTested(false);
    let defaultValue;
    switch (attribute.data_type) {
      case "Numeric":
        defaultValue = null;
        break;
      case "Boolean":
        defaultValue = null;
        break;
      case "Date":
      case "DateTime":
        defaultValue = "";
        break;
      default:
        defaultValue = "";
    }
    setResult([
      ...result,
      {
        type: "library",
        data_type: attribute.data_type,
        key: attribute.name,
        value: defaultValue,
        isAttributeData: false,
        isNew: true,
      },
    ]);
    setLibraryOpen(false);
  };

  const deleteRow = (index) => {
    const newResult = result.filter((_, i) => i !== index);
    setResult(newResult);
    setIsTested(false);
  };

  const renderDataTypeInput = (row, index, isValueReadOnly) => {
    const { data_type, value: currentValue, isAttributeData } = row;

    const getValueString = () => {
      if (currentValue !== undefined && currentValue !== null) {
        if (
          typeof currentValue === "object" &&
          currentValue.hasOwnProperty("value")
        ) {
          return String(currentValue.value); // Attribute name
        } else {
          return String(currentValue); // Primitive value
        }
      }
      return "";
    };

    // --- NEW: If attribute data is linked, always show a read-only text input with the attribute name --- START
    if (isAttributeData) {
      const attributeName = getValueString(); // Get the attribute name string
      return (
        <input
          type="text"
          className={`flex-grow p-2 border rounded ${getThemeClasses.disabledInput} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={attributeName}
          readOnly={true}
          title={`Linked Attribute: ${attributeName}`}
        />
      );
    }
    // --- NEW: If attribute data is linked, always show a read-only text input with the attribute name --- END

    // --- If NOT attribute data, proceed with type-specific editable inputs --- START
    const commonInputProps = {
      className: `flex-grow p-2 border rounded ${
        isValueReadOnly ? getThemeClasses.disabledInput : getThemeClasses.input
      } focus:outline-none focus:ring-2 focus:ring-blue-500`,
      readOnly: isValueReadOnly,
      // Specific value and onChange are set below
    };

    switch (data_type) {
      case "Boolean":
        return (
          <select
            {...commonInputProps}
            value={getValueString()} // Still use primitive string value here
            disabled={isValueReadOnly}
            onChange={
              isValueReadOnly
                ? () => {}
                : (e) => updateRow(index, "value", e.target.value === "true")
            }
          >
            <option
              value=""
              disabled={getValueString() !== "" || isValueReadOnly}
            >
              Select Value
            </option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case "Number":
      case "Numeric":
        return (
          <input
            type="number"
            placeholder={isValueReadOnly ? "" : "Enter number value"}
            title={isValueReadOnly ? getValueString() : undefined}
            {...commonInputProps}
            value={getValueString()} // Use primitive string value here
            onChange={
              isValueReadOnly
                ? () => {}
                : (e) => updateRow(index, "value", e.target.value)
            }
          />
        );

      case "Date":
        return (
          <input
            type="date"
            placeholder={isValueReadOnly ? "" : "Select date"}
            title={isValueReadOnly ? getValueString() : undefined}
            {...commonInputProps}
            value={getValueString()} // Use primitive string value here
            onChange={
              isValueReadOnly
                ? () => {}
                : (e) => updateRow(index, "value", e.target.value)
            }
          />
        );

      case "DateTime":
        return (
          <input
            type="datetime-local"
            placeholder={isValueReadOnly ? "" : "Select date and time"}
            title={isValueReadOnly ? getValueString() : undefined}
            {...commonInputProps}
            value={getValueString()} // Use primitive string value here
            onChange={
              isValueReadOnly
                ? () => {}
                : (e) => updateRow(index, "value", e.target.value)
            }
          />
        );

      case "String":
      default:
        return (
          <input
            type="text"
            placeholder={isValueReadOnly ? "" : "Enter string value"}
            title={isValueReadOnly ? getValueString() : undefined}
            {...commonInputProps}
            value={getValueString()} // Use primitive string value here
            onChange={
              isValueReadOnly
                ? () => {}
                : (e) => updateRow(index, "value", e.target.value)
            }
          />
        );
    }
    // --- If NOT attribute data, proceed with type-specific editable inputs --- END
  };

  const toggleAttributeGroup = (groupName) => {
    setExpandedAttributeGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleOpenAttributeSelector = (index) => {
    setSelectedRowIndexForAttribute(index);
    fetchAttributesForData();
    setIsAttributeSelectorOpen(true);
  };

  const getSelectedRowDataType = () => {
    if (selectedRowIndexForAttribute === null) return null;
    const selectedRow = result[selectedRowIndexForAttribute];
    if (!selectedRow) return null;
    return selectedRow.data_type || "String";
  };

  // --- Validation and Save Logic --- START
  const handleSaveAndClose = () => {
    const seenKeys = new Set();
    for (let i = 0; i < result.length; i++) {
      const row = result[i];
      const key = row.key.trim();
      const value = row.value;

      // 1. Check for empty key
      if (key === "") {
        toast.error(`Row ${i + 1}: Key cannot be empty.`);
        return; // Stop saving
      }

      // 2. Check for duplicate key
      if (seenKeys.has(key)) {
        toast.error(`Row ${i + 1}: Duplicate key "${key}" found.`);
        return; // Stop saving
      }
      seenKeys.add(key);

      // 3. Check for empty value (only if not attribute data)
      if (!row.isAttributeData) {
        // Consider empty string, null, undefined as invalid.
        // Allow boolean false and number 0.
        const isValueEmpty =
          value === "" || value === null || value === undefined;
        if (isValueEmpty) {
          toast.error(`Row ${i + 1}: Value cannot be empty for key "${key}".`);
          return; // Stop saving
        }
      }
      // 4. Check if value is still an object but NOT attribute data (shouldn't happen with current logic, but good check)
      else if (
        typeof value === "object" &&
        value !== null &&
        !value.hasOwnProperty("source_type")
      ) {
        toast.error(
          `Row ${
            i + 1
          }: Invalid value format for key "${key}". Please link attribute data correctly or enter a direct value.`
        );
        return;
      }
    }

    // All validations passed
    console.log("Result validation passed. Closing modal.");
    setIsOpen(false);
  };
  // --- Validation and Save Logic --- END

  return (
    <div
      className={`absolute top-0 left-0 w-full h-full z-60 flex justify-center items-center ${
        isOpen ? "flex" : "hidden"
      }`}
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[90%] xl:w-full flex flex-col max-w-2xl h-[90%] p-8 rounded-lg shadow-lg ${getThemeClasses.background}`}
        ref={createRef}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Result - {section ? "Then" : "Else"}
          </h2>
        </div>
        <hr
          className={theme === "dark" ? "border-gray-700" : "border-gray-300"}
        />

        <div className="space-y-2 mt-4 flex-grow min-h-[370px] overflow-y-auto pr-2">
          {result.length === 0 && (
            <div
              className={`p-8 text-center rounded-lg border ${
                theme === "dark"
                  ? "text-gray-400 border-gray-700 bg-gray-800"
                  : "text-gray-500 border-gray-200 bg-gray-50"
              }`}
            >
              <Database size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium mb-1">No Results Added</p>
              <p className="text-sm">Click "Add Result" to define outcomes.</p>
            </div>
          )}
          {result.map((row, index) => {
            // Determine editable status based on flags
            const isKeyEditable = row.isNew && row.type !== "library";
            const isValueEditable = row.isNew && !row.isAttributeData;
            const keyReadOnly = !isKeyEditable;
            const valueReadOnly = !isValueEditable;

            return (
              <div key={index} className="flex items-center space-x-2">
                <input
                  placeholder="Enter key"
                  value={row.key} // Use value for controlled input
                  readOnly={keyReadOnly}
                  className={`w-1/2 p-2 border rounded ${
                    keyReadOnly
                      ? getThemeClasses.disabledInput
                      : getThemeClasses.input
                  }`}
                  onChange={
                    keyReadOnly
                      ? () => {}
                      : (e) => updateRow(index, "key", e.target.value)
                  }
                  title={keyReadOnly ? row.key : "Enter key"}
                />
                {renderDataTypeInput(row, index, valueReadOnly)}{" "}
                {/* Pass value read-only flag */}
                {/* Attribute Selector Button: Disable if not a new row OR already has attribute data */}
                <button
                  onClick={() => handleOpenAttributeSelector(index)}
                  className={`p-2 rounded cursor-pointer ${
                    getThemeClasses.button.iconButton
                  } ${
                    !row.isNew || row.isAttributeData
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  title={
                    !row.isNew
                      ? "Cannot link initial rows"
                      : row.isAttributeData
                      ? "Attribute already selected"
                      : "Select Attribute Data"
                  }
                  disabled={!row.isNew || row.isAttributeData}
                >
                  <DatabaseZap size={16} />
                </button>
                {/* Delete Button: Allow deleting any row */}
                <button
                  onClick={() => deleteRow(index)}
                  className={`p-2 rounded cursor-pointer ${getThemeClasses.button.delete}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="relative mt-4" ref={addBtnRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center p-2 rounded cursor-pointer ${getThemeClasses.button.addResult}`}
          >
            <Plus className="mr-2" /> Add Result
            <ChevronDown className="ml-2" />
          </button>

          {dropdownOpen && (
            <div
              className={`absolute bottom-full mb-2 w-48 border rounded shadow-lg z-10 ${getThemeClasses.dropdown}`}
            >
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setIsDataTypeModalOpen(true);
                }}
                className={`block w-full text-left px-4 py-2 cursor-pointer ${getThemeClasses.button.dropdownItem}`}
              >
                Custom Attribute
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setLibraryOpen(true);
                }}
                className={`block w-full text-left px-4 py-2 cursor-pointer ${getThemeClasses.button.dropdownItem}`}
              >
                Attribute Library
              </button>
            </div>
          )}
        </div>

        <div className="closeButton flex justify-end mt-auto pt-4">
          <button
            onClick={handleSaveAndClose}
            className={`p-2 cursor-pointer rounded-md px-4 py-2 bg-blue-500 text-white`}
          >
            Save & Close
          </button>
        </div>

        {isAttributeSelectorOpen && (
          <div
            className={`fixed inset-0 z-70 flex items-center justify-center`}
            style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
            ref={attributeSelectorRef}
          >
            <div
              className={`w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] max-w-lg p-6 rounded-lg shadow-lg ${getThemeClasses.background}`}
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
                  className={`p-2 cursor-pointer rounded-md ${getThemeClasses.button.close}`}
                >
                  <X size={20} />
                </button>
              </div>
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
                    {getSelectedRowDataType() && (
                      <div
                        className={`text-sm mb-2 ${
                          theme === "dark" ? "text-blue-300" : "text-blue-600"
                        } px-4`}
                      >
                        Showing attributes with data type:{" "}
                        <strong>{getSelectedRowDataType()}</strong>
                      </div>
                    )}

                    {fetchedAttributes.global_attributes.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            toggleAttributeGroup("Global Attributes")
                          }
                          className={`flex justify-between items-center w-full px-4 py-2 font-semibold text-left ${getThemeClasses.button.dropdownItem}`}
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
                            {fetchedAttributes.global_attributes
                              .filter((attr) => {
                                const requiredDataType =
                                  getSelectedRowDataType();
                                return (
                                  !requiredDataType ||
                                  attr.data_type === requiredDataType
                                );
                              })
                              .map((attr, index) => (
                                <button
                                  key={
                                    attr._id ||
                                    `global-${attr.attribute}-${index}`
                                  }
                                  onClick={() =>
                                    updateRowWithAttributeData(
                                      attr,
                                      "global_attributes"
                                    )
                                  }
                                  className={`block w-full text-left px-4 py-2 cursor-pointer text-sm ${getThemeClasses.button.dropdownItem}`}
                                >
                                  <div className="flex items-center gap-4">
                                    <span
                                      className={`text-lg ${
                                        theme === "dark"
                                          ? "text-blue-300"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {attr.attribute}
                                    </span>
                                    <span
                                      className={`text-gray-500 text-xs ${
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

                            {fetchedAttributes.global_attributes.length > 0 &&
                              fetchedAttributes.global_attributes.filter(
                                (attr) => {
                                  const requiredDataType =
                                    getSelectedRowDataType();
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
                    {fetchedAttributes.input_attributes.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            toggleAttributeGroup("Input Attributes")
                          }
                          className={`flex justify-between items-center w-full px-4 py-2 font-semibold text-left ${getThemeClasses.button.dropdownItem}`}
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
                            {fetchedAttributes.input_attributes
                              .filter((attr) => {
                                const requiredDataType =
                                  getSelectedRowDataType();
                                return (
                                  !requiredDataType ||
                                  attr.data_type === requiredDataType
                                );
                              })
                              .map((attr, index) => (
                                <button
                                  key={
                                    attr._id ||
                                    `input-${attr.attribute}-${index}`
                                  }
                                  onClick={() =>
                                    updateRowWithAttributeData(
                                      attr,
                                      "input_attributes"
                                    )
                                  }
                                  className={`block w-full text-left px-4 py-2 cursor-pointer text-sm ${getThemeClasses.button.dropdownItem}`}
                                >
                                  <div className="flex items-center gap-4">
                                    <span
                                      className={`text-lg ${
                                        theme === "dark"
                                          ? "text-blue-300"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {attr.attribute}
                                    </span>
                                    <span
                                      className={`text-gray-500 text-xs ${
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

                            {fetchedAttributes.input_attributes.length > 0 &&
                              fetchedAttributes.input_attributes.filter(
                                (attr) => {
                                  const requiredDataType =
                                    getSelectedRowDataType();
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

                    {fetchedAttributes.global_attributes.length === 0 &&
                      fetchedAttributes.input_attributes.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No attributes available to link.
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {isDataTypeModalOpen && (
          <div
            className={`fixed inset-0 z-70 flex items-center justify-center`}
            style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
          >
            <div
              className={`w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] max-w-lg p-6 rounded-lg shadow-lg ${getThemeClasses.background}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Data Type</h3>
                <button
                  onClick={() => setIsDataTypeModalOpen(false)}
                  className={`p-2 cursor-pointer rounded-md ${getThemeClasses.button.close}`}
                >
                  <X size={20} />
                </button>
              </div>
              <hr
                className={
                  theme === "dark" ? "border-gray-700" : "border-gray-300"
                }
              />
              <div className="mt-4 max-h-80 overflow-y-auto">
                {isLoadingDataTypes ? (
                  <div className="p-4 text-center">Loading data types...</div>
                ) : dataTypesError ? (
                  <div className="p-4 text-center text-red-500">
                    Error loading data types: {dataTypesError.message}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {dataTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => addCustomAttributeWithDataType(type)}
                        className={`p-3 cursor-pointer rounded text-left ${
                          theme === "dark"
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {libraryOpen && (
          <div
            className={`fixed inset-0 z-70 flex items-center justify-center`}
            style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
          >
            <div
              className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[50%] max-w-2xl p-6 rounded-lg shadow-lg ${getThemeClasses.background}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Attribute Library</h2>
                <button
                  onClick={() => setLibraryOpen(false)}
                  className={`p-2 cursor-pointer rounded-md ${getThemeClasses.button.close}`}
                >
                  <X size={24} />
                </button>
              </div>
              <hr
                className={
                  theme === "dark" ? "border-gray-700" : "border-gray-300"
                }
              />
              <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
                {isLoadingApiAttributeLibrary && (
                  <div className="text-center p-4">Loading Library...</div>
                )}
                {!isLoadingApiAttributeLibrary &&
                Object.entries(apiAttributeLibrary || {}).length > 0
                  ? Object.entries(apiAttributeLibrary).map(
                      ([groupName, attributes]) => (
                        <div key={groupName} className="border rounded">
                          <div
                            className={`flex items-center p-3 font-semibold ${
                              theme === "dark"
                                ? "bg-gray-700 text-white"
                                : "bg-gray-100 text-black"
                            }`}
                          >
                            <Folder className="mr-2" size={20} />
                            {groupName}
                          </div>
                          <div className="p-2 space-y-2">
                            {attributes && attributes.length > 0 ? (
                              attributes.map((attribute, index) => (
                                <div
                                  key={
                                    attribute._id ||
                                    `${groupName}-${attribute.name}-${index}`
                                  }
                                  className={`flex justify-between items-center p-3 rounded cursor-pointer ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-gray-100"
                                  }`}
                                  onClick={() => addLibraryAttribute(attribute)}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {attribute.name}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      {attribute.data_type}
                                    </span>
                                  </div>
                                  <Library
                                    size={20}
                                    className="text-gray-500"
                                  />
                                </div>
                              ))
                            ) : (
                              <div
                                className={`p-4 text-center ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                <FolderX
                                  size={24}
                                  className="mx-auto mb-2 opacity-50"
                                />
                                <p className="text-sm">
                                  No attributes found in this group
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  : !isLoadingApiAttributeLibrary && (
                      <div
                        className={`p-8 text-center rounded-lg border ${
                          theme === "dark"
                            ? "text-gray-400 border-gray-700 bg-gray-800"
                            : "text-gray-500 border-gray-200 bg-gray-50"
                        }`}
                      >
                        <Database
                          size={32}
                          className="mx-auto mb-3 opacity-50"
                        />
                        <p className="text-base font-medium mb-1">
                          No Data Available
                        </p>
                        <p className="text-sm">
                          No attribute groups found in the library
                        </p>
                      </div>
                    )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultButton;
