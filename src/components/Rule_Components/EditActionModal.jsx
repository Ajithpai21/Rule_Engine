import React, { useState, useEffect } from "react";
import { X, ExternalLink, ChevronUp, ChevronDown, Folder } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
const EditActionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  theme,
  isTested,
  setIsTested,
}) => {
  const [actionData, setActionData] = useState({
    platformName: "",
    platformType: "",
    action_query: "",
    icon: "",
    integration_id: "",
    name: "",
  });

  const [openTables, setOpenTables] = useState({});
  const navigate = useNavigate();

  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";
  const modalBg =
    theme === "dark" ? "bg-gray-900 bg-opacity-90" : "bg-white bg-opacity-90";
  const modalTextColor = theme === "dark" ? "text-white" : "text-gray-800";

  useEffect(() => {
    if (isOpen && initialData) {
      const formData = {
        platformName: initialData.platformName || initialData.name || "",
        platformType: initialData.platformType || initialData.platform || "",
        action_query: initialData.action_query || "",
        icon: initialData.icon || "",
        connectionString: initialData.connectionString || "",
        integration_id: initialData.integration_id || "",
        name: initialData.name || "",
      };
      setActionData(formData);
      refetchTables();
    }
  }, [isOpen]);

  const fetchTableDetails = async (table_name, connectionString, platform) => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/showData";
    const requestBody = {
      platform,
      connectionString,
      table_name,
    };
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch table details");
      }
      const data = await response.json();
      return data.columns || [`No details available for ${table_name}`];
    } catch (error) {
      console.error("Error fetching table details:", error);
      return [`Error fetching details for ${table_name}`];
    }
  };

  const toggleTable = async (tableName) => {
    if (openTables[tableName]) {
      setOpenTables((prev) => ({ ...prev, [tableName]: null }));
    } else {
      const details = await fetchTableDetails(
        tableName,
        actionData.connectionString,
        actionData.platformType
      );
      setOpenTables((prev) => ({ ...prev, [tableName]: details }));
    }
  };

  const fetchTablesCollection = async () => {
    if (
      !initialData?.platform?.trim() ||
      !initialData?.connectionString?.trim()
    ) {
      return [];
    }

    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/showTables_collection";
    const requestBody = {
      platform: initialData.platform,
      connectionString: initialData.connectionString,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        toast.error(errorResult?.message || "Failed");
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      return result?.collections || [];
    } catch (error) {
      console.error("API call failed:", error.message);
      return [];
    }
  };

  const {
    data: tables = [],
    refetch: refetchTables,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTablesCollection,
    enabled:
      !!actionData?.platformType?.trim() &&
      !!actionData?.connectionString?.trim(),
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActionData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNavigateToIntegration = () => {
    navigate("/integrations");
  };

  const handleSubmit = () => {
    if (!actionData.name || !actionData.action_query) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsTested(false);

    const actionToSubmit = {
      id: initialData.id,
      platform: actionData.platformType || "",
      action_query: actionData.action_query,
      icon: actionData.icon,
      value: initialData.value,
      connectionString: actionData.connectionString || "",
      integration_id: actionData.integration_id || "",
      name: actionData.name,
    };

    onSubmit(actionToSubmit, true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <div
        className={`${modalBg} rounded-lg p-6 w-[90%] max-w-5xl ${modalTextColor} backdrop-filter backdrop-blur-lg flex gap-4`}
      >
        {/* Left side - Form */}
        <div className="w-[65%]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Edit Action ({initialData?.value ? "Then" : "Else"})
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Name *</label>
              <div
                className={`flex-1 p-2 rounded-md ${inputBg} ${borderColor} border`}
              >
                {actionData.name}
              </div>
            </div>

            <div>
              <label className="block mb-1">Actions</label>
              <div
                className={`flex-1 p-2 rounded-md ${inputBg} ${borderColor} border`}
              >
                INSERT or UPDATE Query
              </div>
            </div>

            <div>
              <label className="block mb-1">Platform</label>
              <div className="flex space-x-2">
                <div
                  className={`flex-1 p-2 rounded-md ${inputBg} ${borderColor} border`}
                >
                  {actionData.platformType}
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1">Action Query *</label>
              <textarea
                name="action_query"
                value={actionData.action_query}
                onChange={handleInputChange}
                className={`w-full p-2 rounded-md ${inputBg} ${borderColor} border h-32`}
                placeholder="INSERT INTO table_name (column1, column2) VALUES (value1, value2)"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600"
            >
              Update Action
            </button>
          </div>
        </div>

        {/* Right side - Schema */}
        <div
          className={`w-[35%] flex flex-col rounded-sm px-4 py-3 h-[500px] ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-100"
          }`}
        >
          <div className="topBox flex justify-between items-center">
            <div className="title text-xl font-bold">Schema</div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 p-2 cursor-pointer rounded-sm"
            >
              <X size={20} />
            </button>
          </div>
          <hr
            className={`${
              theme === "dark" ? "border-white" : "border-black"
            } my-2`}
          />
          <div
            className={`rounded-md flex-1 overflow-y-auto max-h-[450px] [&::-webkit-scrollbar]:hidden ${
              theme === "dark" ? "bg-gray-800 " : "bg-gray-100 "
            }`}
          >
            <div
              className={`inTitle text-sm font-bold sticky top-0 p-2 px-4 rounded-t-md ${
                theme === "dark" ? "bg-black" : "bg-gray-300 "
              }`}
            >
              Available Tables
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-64 flex-col">
                <div className="w-12 h-64 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-base">Loading tables...</p>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 flex-col">
                <div className="text-red-500 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-red-500 text-center px-4">
                  Failed to load tables. Please check your connection settings.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 truncate">
                {tables.length > 0 ? (
                  tables.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-md ${
                        theme === "dark" ? "bg-gray-600 " : "bg-gray-200 "
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between p-2 cursor-pointer  rounded-md ${
                          theme === "dark"
                            ? "hover:bg-gray-500 "
                            : "hover:bg-gray-300"
                        }`}
                        onClick={() => toggleTable(item)}
                        title={item}
                      >
                        <span>{item}</span>
                        {openTables[item] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                      {openTables[item] && (
                        <div
                          className={`truncate ${
                            theme === "dark" ? "bg-gray-800" : "bg-gray-300"
                          } p-2 rounded-md`}
                        >
                          {openTables[item].map((detail, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center rounded-sm gap-2 p-1 ${
                                theme === "dark"
                                  ? "hover:bg-gray-500"
                                  : "hover:bg-blue-500"
                              }`}
                            >
                              <Folder size={13} />
                              <span className="text-sm">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div>Loading...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditActionModal;
