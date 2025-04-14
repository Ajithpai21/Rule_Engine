import React, { useState, useEffect } from "react";
import { X, Plus, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const EditAPIIntegration = ({
  isOpen,
  setIsOpen,
  theme,
  workspace,
  workspace_id,
  apiPlatformData,
  setApiPlatformData,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTestSuccess, setIsTestSuccess] = useState(false);
  const [expandedIP, setExpandedIP] = useState(false);
  const [expandedAuth, setExpandedAuth] = useState(false);



  const api_key = useSelector((state) => state.apiDetails.api_key);

  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    headers: [{ key: "", value: "" }],
    preset_query_params: [{ key: "", value: "" }],
    ipAddresses: [""],
    isProduction: false,
    authType: "none",
    authData: {
      username: "",
      password: "",
      token: "",
      apiKey: "",
      apiKeyName: "x-api-key",
    },
  });

  useEffect(() => {
    // Initialize form data with apiPlatformData if available
    if (apiPlatformData) {
      setFormData({
        name: apiPlatformData.name || "",
        baseUrl: apiPlatformData.base_url || "",
        headers: apiPlatformData.preset_headers
          ? Object.entries(apiPlatformData.preset_headers).map(
              ([key, value]) => ({ key, value })
            )
          : [{ key: "", value: "" }],
        preset_query_params: apiPlatformData.preset_query_params
          ? Object.entries(apiPlatformData.preset_query_params).map(
              ([key, value]) => ({ key, value })
            )
          : [{ key: "", value: "" }],
        ipAddresses: apiPlatformData.allowed_server_ips || [""],
        isProduction: apiPlatformData.is_production || false,
        authType: getAuthType(apiPlatformData.authentication),
        authData: {
          username: apiPlatformData.authentication?.username || "",
          password: apiPlatformData.authentication?.password || "",
          token: apiPlatformData.authentication?.token || "",
          apiKey: apiPlatformData.authentication?.key_value || "",
          apiKeyName: apiPlatformData.authentication?.key_name || "x-api-key",
        },
      });
      // Expand authentication section if auth_type is set
      if (
        apiPlatformData.authentication &&
        Object.keys(apiPlatformData.authentication).length > 0
      ) {
        setExpandedAuth(true);
      }
      // Expand IP addresses section if any IPs are present
      if (
        apiPlatformData.allowed_server_ips &&
        apiPlatformData.allowed_server_ips.length > 0
      ) {
        setExpandedIP(true);
      }
    }
    setTimeout(() => setIsVisible(true), 10);
  }, [apiPlatformData]);

  // Function to determine auth type from authentication object
  const getAuthType = (authentication) => {
    if (!authentication || Object.keys(authentication).length === 0)
      return "none";
    if (authentication.type === "basic") return "basic";
    if (authentication.type === "bearer") return "bearer";
    if (
      authentication.type === "apiKey" ||
      (authentication.key_name && authentication.key_value)
    )
      return "apiKey";
    return "none";
  };

  const handleClose = () => {
    setIsVisible(false);
    setApiPlatformData("");
    setTimeout(() => setIsOpen(), 300);
  };

  const handleInputChange = (field, value) => {
    setIsTestSuccess(false);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHeaderChange = (index, field, value) => {
    setIsTestSuccess(false);
    const newHeaders = [...formData.headers];
    newHeaders[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      headers: newHeaders,
    }));
  };

  const handleQueryParamChange = (index, field, value) => {
    setIsTestSuccess(false);
    const newParams = [...formData.preset_query_params];
    newParams[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      preset_query_params: newParams,
    }));
  };

  const handleIpAddressChange = (index, value) => {
    setIsTestSuccess(false);
    const newIps = [...formData.ipAddresses];
    newIps[index] = value;
    setFormData((prev) => ({
      ...prev,
      ipAddresses: newIps,
    }));
  };

  const addHeader = () => {
    setFormData((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }],
    }));
  };

  const addQueryParam = () => {
    setFormData((prev) => ({
      ...prev,
      preset_query_params: [
        ...prev.preset_query_params,
        { key: "", value: "" },
      ],
    }));
  };

  const addIpAddress = () => {
    setFormData((prev) => ({
      ...prev,
      ipAddresses: [...prev.ipAddresses, ""],
    }));
  };

  const removeHeader = (index) => {
    const newHeaders = formData.headers.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      headers: newHeaders,
    }));
  };

  const removeQueryParam = (index) => {
    const newParams = formData.preset_query_params.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      preset_query_params: newParams,
    }));
  };

  const removeIpAddress = (index) => {
    const newIps = formData.ipAddresses.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      ipAddresses: newIps,
    }));
  };

  const handleAuthDataChange = (field, value) => {
    setIsTestSuccess(false);
    setFormData((prev) => ({
      ...prev,
      authData: {
        ...prev.authData,
        [field]: value,
      },
    }));
  };

  const validateFormData = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.baseUrl.trim()) {
      toast.error("Base URL is required");
      return false;
    }
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateFormData()) return;

    try {
      const dataPayload = {
        name: formData.name,
        base_url: formData.baseUrl,
        preset_headers: formData.headers.reduce((acc, curr) => {
          if (curr.key && curr.value) acc[curr.key] = curr.value;
          return acc;
        }, {}),
        preset_query_params: formData.preset_query_params.reduce(
          (acc, curr) => {
            if (curr.key && curr.value) acc[curr.key] = curr.value;
            return acc;
          },
          {}
        ),
        allowed_server_ips: formData.ipAddresses.filter((ip) => ip.trim()),
      };

      // Add authentication data based on type
      if (formData.authType === "basic") {
        dataPayload.authentication = {
          type: "basic",
          username: formData.authData.username,
          password: formData.authData.password,
        };
      } else if (formData.authType === "bearer") {
        dataPayload.authentication = {
          type: "bearer",
          token: formData.authData.token,
        };
      } else if (formData.authType === "apiKey") {
        // Add apiKey to headers
        dataPayload.preset_headers[formData.authData.apiKeyName] =
          formData.authData.apiKey;
        dataPayload.authentication = {
          type: "apiKey",
          key_name: formData.authData.apiKeyName,
          key_value: formData.authData.apiKey,
        };
      } else {
        dataPayload.authentication = {};
      }

      const payload = {
        user: user,
        workspace,
        workspace_id,
        api_key,
        platform: apiPlatformData?.platform,
        integration_id: apiPlatformData?.integration_id || "",
        ...dataPayload,
      };

      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/testConnectionString",
        payload
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "Connection tested successfully!");
        setIsTestSuccess(true);
      } else {
        toast.error(response.data.message || "Failed to test connection");
        setIsTestSuccess(false);
      }
    } catch (error) {
      setIsTestSuccess(false);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleSave = async () => {
    if (!validateFormData()) return;

    try {
      const dataPayload = {
        name: formData.name,
        base_url: formData.baseUrl,
        preset_headers: formData.headers.reduce((acc, curr) => {
          if (curr.key && curr.value) acc[curr.key] = curr.value;
          return acc;
        }, {}),
        preset_query_params: formData.preset_query_params.reduce(
          (acc, curr) => {
            if (curr.key && curr.value) acc[curr.key] = curr.value;
            return acc;
          },
          {}
        ),
        allowed_server_ips: formData.ipAddresses.filter((ip) => ip.trim()),
        is_production: formData.isProduction,
        platform: "restAPI",
        integration_id: apiPlatformData.integration_id, // Important: include integration_id for edit
        authentication: {},
      };

      // Add authentication data based on type
      if (formData.authType === "basic") {
        dataPayload.authentication = {
          type: "basic",
          username: formData.authData.username,
          password: formData.authData.password,
        };
      } else if (formData.authType === "bearer") {
        dataPayload.authentication = {
          type: "bearer",
          token: formData.authData.token,
        };
      } else if (formData.authType === "apiKey") {
        dataPayload.authentication = {
          type: "apiKey",
          key_name: formData.authData.apiKeyName,
          key_value: formData.authData.apiKey,
        };
      }

      const payload = {
        user: user,
        workspace,
        workspace_id,
        api_key,
        platform: apiPlatformData?.platform,
        integration_id: apiPlatformData?.integration_id || "",
        ...dataPayload,
      };

      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/createConnectionString",
        payload
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        handleClose();
      } else {
        toast.error(response.data.message || "Failed to update integration");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div
      className={`h-full w-full ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
      } transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit REST API</h2>
          <div
            onClick={handleClose}
            className="cursor-pointer p-2 hover:bg-blue-500 rounded-md"
          >
            <X size={18} />
          </div>
        </div>

        {/* Name */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="text-base font-medium">Name</label>
          </div>
          <input
            type="text"
            value={formData.name}
            disabled={true}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`w-full p-3 rounded-md ${
              theme === "dark"
                ? "bg-gray-700 border-none"
                : "bg-gray-100 border-none"
            }`}
            placeholder="Enter API name"
          />
        </div>

        {/* Base URL */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="text-base font-medium">Base URL</label>
            <Info size={16} className="ml-2 text-gray-500" />
          </div>
          <input
            type="text"
            value={formData.baseUrl}
            onChange={(e) => handleInputChange("baseUrl", e.target.value)}
            className={`w-full p-3 rounded-md ${
              theme === "dark"
                ? "bg-gray-700 border-none"
                : "bg-gray-100 border-none"
            }`}
            placeholder="Enter base URL"
          />
        </div>

        {/* Authentication (collapsible) */}
        <div className="mb-6">
          <div
            onClick={() => setExpandedAuth(!expandedAuth)}
            className="flex items-center justify-between mb-2 cursor-pointer"
          >
            <div className="flex items-center">
              <label className="text-base font-medium">Authentication</label>
              <span className="ml-2 text-xs text-gray-500">(optional)</span>
            </div>
            {expandedAuth ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {expandedAuth && (
            <div
              className={`p-4 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Authentication Type
                </label>
                <select
                  value={formData.authType}
                  onChange={(e) =>
                    handleInputChange("authType", e.target.value)
                  }
                  className={`w-full p-3 rounded-md ${
                    theme === "dark"
                      ? "bg-gray-800 border-none text-white"
                      : "bg-white border-none text-black"
                  }`}
                >
                  <option value="none">No Authentication</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apiKey">API Key</option>
                </select>
              </div>

              {formData.authType === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.authData.username}
                      onChange={(e) =>
                        handleAuthDataChange("username", e.target.value)
                      }
                      className={`w-full p-3 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 border-none text-white"
                          : "bg-white border-none text-black"
                      }`}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.authData.password}
                      onChange={(e) =>
                        handleAuthDataChange("password", e.target.value)
                      }
                      className={`w-full p-3 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 border-none text-white"
                          : "bg-white border-none text-black"
                      }`}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              )}

              {formData.authType === "bearer" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Token
                  </label>
                  <input
                    type="text"
                    value={formData.authData.token}
                    onChange={(e) =>
                      handleAuthDataChange("token", e.target.value)
                    }
                    className={`w-full p-3 rounded-md ${
                      theme === "dark"
                        ? "bg-gray-800 border-none text-white"
                        : "bg-white border-none text-black"
                    }`}
                    placeholder="Enter bearer token"
                  />
                </div>
              )}

              {formData.authType === "apiKey" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Key Name
                    </label>
                    <input
                      type="text"
                      value={formData.authData.apiKeyName}
                      onChange={(e) =>
                        handleAuthDataChange("apiKeyName", e.target.value)
                      }
                      className={`w-full p-3 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 border-none text-white"
                          : "bg-white border-none text-black"
                      }`}
                      placeholder="e.g. x-api-key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={formData.authData.apiKey}
                      onChange={(e) =>
                        handleAuthDataChange("apiKey", e.target.value)
                      }
                      className={`w-full p-3 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-800 border-none text-white"
                          : "bg-white border-none text-black"
                      }`}
                      placeholder="Enter API key"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preset Headers */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="text-base font-medium">Preset Headers</label>
            <span className="ml-2 text-xs text-gray-500">(optional)</span>
          </div>
          {formData.headers.map((header, index) => (
            <div key={index} className="flex mb-2 space-x-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) =>
                  handleHeaderChange(index, "key", e.target.value)
                }
                className={`flex-1 w-[50px] p-3 rounded-l-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-none"
                    : "bg-gray-100 border-none"
                }`}
                placeholder="key"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) =>
                  handleHeaderChange(index, "value", e.target.value)
                }
                className={`flex-1 p-3 ${
                  theme === "dark"
                    ? "bg-gray-700 border-none"
                    : "bg-gray-100 border-none"
                }`}
                placeholder="value"
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-3 rounded-r-md bg-gray-200 dark:bg-gray-600 text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={addHeader}
            className="flex items-center text-blue-500 hover:text-blue-600 mt-2"
          >
            <Plus size={16} className="mr-1" /> Add Preset Headers
          </button>
        </div>

        {/* Preset Query Params */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="text-base font-medium">Preset Query Params</label>
            <span className="ml-2 text-xs text-gray-500">(optional)</span>
          </div>
          {formData.preset_query_params.map((param, index) => (
            <div key={index} className="flex mb-2 space-x-2">
              <input
                type="text"
                value={param.key}
                onChange={(e) =>
                  handleQueryParamChange(index, "key", e.target.value)
                }
                className={`flex-1 w-[50px] p-3 rounded-l-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-none"
                    : "bg-gray-100 border-none"
                }`}
                placeholder="key"
              />
              <input
                type="text"
                value={param.value}
                onChange={(e) =>
                  handleQueryParamChange(index, "value", e.target.value)
                }
                className={`flex-1 p-3 ${
                  theme === "dark"
                    ? "bg-gray-700 border-none"
                    : "bg-gray-100 border-none"
                }`}
                placeholder="value"
              />
              <button
                onClick={() => removeQueryParam(index)}
                className="p-3 rounded-r-md bg-gray-200 dark:bg-gray-600 text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={addQueryParam}
            className="flex items-center text-blue-500 hover:text-blue-600 mt-2"
          >
            <Plus size={16} className="mr-1" /> Add Preset Query Params
          </button>
        </div>

        {/* IP Addresses (collapsible) */}
        <div className="mb-6">
          <div
            onClick={() => setExpandedIP(!expandedIP)}
            className="flex items-center justify-between mb-2 cursor-pointer"
          >
            <div className="flex items-center">
              <span className="text-base font-medium">
                IP Addresses to add to your allow-list
              </span>
              <Info
                size={16}
                className={`ml-2 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
            {expandedIP ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedIP && (
            <div
              className={`p-4 rounded-md ${
                theme === "dark" ? "bg-gray-700" : "bg-blue-50"
              }`}
            >
              {formData.ipAddresses.map((ip, index) => (
                <div key={index} className="flex mb-2 space-x-2">
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) =>
                      handleIpAddressChange(index, e.target.value)
                    }
                    className={`flex-1 p-3 rounded-l-md ${
                      theme === "dark"
                        ? "bg-gray-800 border-none text-white"
                        : "bg-white border-none text-black"
                    }`}
                    placeholder="Enter IP address"
                  />
                  <button
                    onClick={() => removeIpAddress(index)}
                    className="p-3 rounded-r-md bg-gray-200 dark:bg-gray-600 text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={addIpAddress}
                className="flex items-center text-blue-500 hover:text-blue-600 mt-2"
              >
                <Plus size={16} className="mr-1" /> Add IP Address
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={handleTestConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={!isTestSuccess}
            className={`px-4 py-2 rounded-md text-white ${
              isTestSuccess
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAPIIntegration;
