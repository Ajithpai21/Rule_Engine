import React, { useState, useEffect } from "react";
import { Trash2, Link, Save } from "lucide-react";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DependancyMapping from "@/components/DependancyMapping";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const GlobalAttribute = () => {
  const theme = useSelector((state) => state.theme.mode);
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const [selectedAttribute, setSelectedAttibute] = useState(null);
  const [isDependency, setIsDependency] = useState(null);
  const queryClient = useQueryClient();
  const fetchType = async () => {
    const response = await axios.post(
      "https://micro-solution-ruleengineprod.mfilterit.net/getDatatypes",
      {
        collection_id: "attribute_datatype",
      }
    );
    return response.data.DataTypes || [];
  };

  const {
    data: typeOptions,
    isLoading: typeLoading,
    error: typeError,
    refetch: refetchType,
  } = useQuery({
    queryKey: ["typeOptions"],
    queryFn: fetchType,
    staleTime: 60000,
  });

  const fetchDependencyData = async () => {
    const response = await axios.post(
      "https://micro-solution-ruleengineprod.mfilterit.net/dependancyMapping",
      {
        user: user,
        workspace: workspace,
        workspace_id: workspace_id,
        attribute_name: selectedAttribute.name,
      }
    );
    return response.data;
  };

  const {
    data: dependancyData,
    isLoading: dependancyLoading,
    isError: dependancyError,
    refetch: depedancyFetch,
  } = useQuery({
    queryKey: ["dependencyData"],
    queryFn: fetchDependencyData,
    enabled: false,
    staleTime: 0,
    cacheTime: 0,
  });

  const setDependencyMapping = (row) => {
    setIsDependency((prev) => !prev);
    if (!!selectedAttribute) {
      setSelectedAttibute(null);
    } else {
      setSelectedAttibute({ name: row?.name, datatype: row?.type });
      queryClient.setQueryData(["dependencyData"], undefined);
      depedancyFetch();
    }
  };

  const fetchGlobalAttributes = async () => {
    const response = await axios.post(
      "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
      {
        user: user,
        workspace: workspace,
        workspace_id: workspace_id,
        rule_type: "",
        rule_id: "",
      }
    );
    return response.data.data.global_attributes || [];
  };

  const {
    data: globalAttributes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["globalAttributes", workspace],
    queryFn: fetchGlobalAttributes,
    staleTime: 60000,
  });

  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (Array.isArray(globalAttributes) && globalAttributes.length > 0) {
      const formattedRows = globalAttributes.map((attr) => ({
        id: attr._id || uuidv4(),
        type: attr.data_type || "String",
        name: attr.attribute || "",
        value: attr.test_value || "",
        isAPI: !!attr._id,
      }));
      setRows(formattedRows);
    } else {
      setRows([
        { id: uuidv4(), type: "String", name: "", value: "", isAPI: false },
      ]);
    }
  }, [globalAttributes]);

  const handleTypeChange = (id, newType) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              type: newType,
              value: newType === "Boolean" ? "True" : "",
            }
          : row
      )
    );
  };

  const handleInputChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows([
      ...rows,
      { id: uuidv4(), type: "String", name: "", value: "", isAPI: false },
    ]);
  };

  const deleteRow = async (id, isAPI) => {
    if (!isAPI) {
      const updatedRows = rows.filter((row) => row.id !== id);

      if (updatedRows.length === 0) {
        setRows([
          { id: uuidv4(), type: "String", name: "", value: "", isAPI: false },
        ]);
      } else {
        setRows(updatedRows);
      }
      return;
    }

    if (!window.confirm("Are you sure you want to delete?")) return;
    const updatedRows = rows.filter((row) => row.id !== id);

    if (updatedRows.length === 0) {
      setRows([
        { id: uuidv4(), type: "String", name: "", value: "", isAPI: false },
      ]);
    } else {
      setRows(updatedRows);
    }

    try {
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/deleteDatatypes",
        {
          workspace_id: workspace_id,
          attribute_id: id,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
      } else {
        toast.error(response.data.message || "Failed to delete.");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Something went wrong. Try again!");
    }
  };

  const saveRow = async (row) => {
    if (
      !row.name.trim() ||
      (typeof row.value === "string" && !row.value.trim())
    ) {
      toast.error("Name and Value fields cannot be empty.");
      return;
    }

    try {
      const endpoint = row.isAPI
        ? "https://micro-solution-ruleengineprod.mfilterit.net/editDatatypes"
        : "https://micro-solution-ruleengineprod.mfilterit.net/generateAttribute";

      const payload = row.isAPI
        ? {
            user: user,
            workspace: workspace,
            workspace_id: workspace_id,
            attribute_id: row.id,
            value: row.value.trim(),
          }
        : {
            user: user,
            workspace: workspace,
            workspace_id: workspace_id,
            attributeName: row.name,
            datatype: row.type,
            test_value: row.value.trim(),
          };

      const response = await axios.post(endpoint, payload);

      if (response.data.status === "Success") {
        toast.success(response.data.message || "Successfully saved!");
        refetch();
      } else {
        toast.error(response.data.message || "Failed to save.");
      }
    } catch (error) {
      console.error("Error saving record:", error);
      toast.error(
        error?.response?.data?.message || "Something went wrong. Try again!"
      );
    }
  };

  return (
    <div
      className={`h-[88.8vh] w-full flex flex-col items-center p-6 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <h2 className="text-2xl font-semibold mb-6">Global Attributes</h2>

      <div className="w-full max-w-6xl overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className={`flex flex-wrap items-center gap-4 p-2 mb-3 rounded-lg shadow-md ${
                theme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-black"
              }`}
            >
              <select
                value={row.type}
                onChange={(e) => handleTypeChange(row.id, e.target.value)}
                disabled={row.isAPI}
                className={`p-3 rounded-md w-36 ${
                  theme === "dark"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                {typeLoading ? (
                  <option>Loading...</option>
                ) : typeError ? (
                  <option>Error loading types</option>
                ) : (
                  typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                )}
              </select>

              <input
                type="text"
                placeholder="Enter name"
                value={row.name}
                onChange={(e) =>
                  handleInputChange(row.id, "name", e.target.value)
                }
                className={`p-3  rounded-md flex-1 ${
                  theme === "dark"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-black"
                }`}
                disabled={row.isAPI}
              />

              {row.type === "Boolean" ? (
                <select
                  value={row.value}
                  onChange={(e) =>
                    handleInputChange(row.id, "value", e.target.value)
                  }
                  className={`p-3  rounded-md w-48 ${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              ) : row.type === "Numeric" ? (
                <input
                  type="number"
                  placeholder="Enter value"
                  value={row.value}
                  onChange={(e) =>
                    handleInputChange(row.id, "value", e.target.value)
                  }
                  className={`p-3  rounded-md w-48 ${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                />
              ) : row.type === "Date" ? (
                <input
                  type="date"
                  value={row.value}
                  onChange={(e) =>
                    handleInputChange(row.id, "value", e.target.value)
                  }
                  className={`p-3 border rounded-md w-48 ${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                />
              ) : row.type === "DateTime" ? (
                <input
                  type="datetime-local"
                  value={row.value}
                  onChange={(e) =>
                    handleInputChange(row.id, "value", e.target.value)
                  }
                  className={`p-3  rounded-md w-48 ${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                />
              ) : (
                <input
                  type="text"
                  placeholder="Enter value"
                  value={row.value}
                  onChange={(e) =>
                    handleInputChange(row.id, "value", e.target.value)
                  }
                  className={`p-3  rounded-md w-48 ${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                />
              )}

              <button
                className={`p-2 text-blue-400 ${
                  !row.isAPI ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={(event) => setDependencyMapping(row, event)}
                disabled={!row.isAPI}
              >
                <Link size={20} />
              </button>

              <button
                onClick={() => deleteRow(row.id, row.isAPI)}
                className="p-2 cursor-pointer text-red-400"
              >
                <Trash2 size={20} />
              </button>

              <button
                onClick={() => saveRow(row)}
                className={`w-16 ${
                  !row.name.trim() ||
                  (typeof row.value === "string" && !row.value.trim())
                    ? "cursor-not-allowed"
                    : "text-purple-600 cursor-pointer"
                } font-semibold flex items-center gap-2`}
                disabled={
                  !row.name.trim() ||
                  (typeof row.value === "string" && !row.value.trim())
                }
              >
                {row.isAPI ? "Update" : "Save"}
              </button>
            </div>
          ))
        )}

        <div className="mt-4 flex justify-start">
          <button
            onClick={addRow}
            className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700"
          >
            Add Row
          </button>
        </div>
      </div>

      {isDependency && (
        <DependancyMapping
          setDependencyMapping={setDependencyMapping}
          attribute={selectedAttribute}
          isLoading={dependancyLoading}
          isError={dependancyError}
          data={dependancyData}
          theme={theme}
        />
      )}
    </div>
  );
};

export default GlobalAttribute;
