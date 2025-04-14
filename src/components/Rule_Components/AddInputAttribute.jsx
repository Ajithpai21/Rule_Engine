import React, { useRef, useEffect, useState } from "react";
import { Trash2, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const AddInputAttribute = ({
  isOpen,
  setIsOpen,
  theme,
  workspace,
  workspace_id,
}) => {
  const createRef = useRef(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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

  const fetchInputAttributes = async () => {
    const response = await axios.post(
      "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
      {
        user: user,
        workspace,
        workspace_id,
        rule_type: sessionStorage.getItem("rule_type"),
        rule_id: sessionStorage.getItem("type_id"),
      }
    );
    return response.data.data.input_attributes || [];
  };

  const {
    data: inputAttributes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inputAttributes"],
    queryFn: fetchInputAttributes,
    staleTime: 0,
  });

  useEffect(() => {
    refetch();
    if (Array.isArray(inputAttributes) && inputAttributes.length > 0) {
      const formattedRows = inputAttributes.map((attr) => ({
        id: attr._id || uuidv4(),
        type: attr.data_type || "String",
        name: attr.attribute || "",
        value: attr.test_value || "",
        isNull: attr["Can be Null"] || false,
        isSensitive: attr["Case Sensitive"] || false,
        isOptional: attr["Is Optional"] || false,
        isAPI: !!attr._id,
      }));
      setRows(formattedRows);
    } else {
      setRows([
        {
          id: uuidv4(),
          type: "String",
          name: "",
          value: "",
          isNull: false,
          isSensitive: false,
          isOptional: false,
          isAPI: false,
        },
      ]);
    }
  }, [inputAttributes]);

  const handleInputChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]:
                field === "value" && row.type === "Numeric"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : row
      )
    );
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: uuidv4(),
        type: "String",
        name: "",
        value: "",
        isNull: false,
        isSensitive: false,
        isOptional: false,
        isAPI: false,
      },
    ]);
  };

  const deleteRow = (id) => {
    const updatedRows = rows.filter((row) => row.id !== id);
    if (updatedRows.length === 0) {
      setRows([
        {
          id: uuidv4(),
          type: "String",
          name: "",
          value: "",
          isNull: false,
          isSensitive: false,
          isOptional: false,
          isAPI: false,
        },
      ]);
    } else {
      setRows(updatedRows);
    }
    return;
  };

  const handleCheckboxChange = (id, field) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, [field]: !row[field] } : row
      )
    );
  };

  const handleSaveAttribute = async () => {
    try {
      const formattedData = rows.map((row) => {
        let formattedValue = row.value;

        // Format value based on data type
        switch (row.type) {
          case "Numeric":
            formattedValue = row.value === "" ? "" : Number(row.value);
            break;
          case "Boolean":
            formattedValue = row.value === "True";
            break;
          case "Date":
          case "DateTime":
            formattedValue = row.value || "";
            break;
          default:
            formattedValue =
              typeof row.value === "string" ? row.value.trim() : row.value;
        }

        return {
          attribute: row.name.trim(),
          data_type: row.type,
          test_value: formattedValue,
          "Can be Null": row.isNull,
          "Case Sensitive": row.isSensitive,
          "Is Optional": row.isOptional,
        };
      });

      const hasEmptyValues = formattedData.some(
        (item) =>
          !item.attribute?.trim() ||
          !item.data_type?.trim() ||
          (item.data_type !== "Boolean" && !item.test_value?.toString().trim())
      );

      if (hasEmptyValues) {
        toast.error("Please fill all required fields before saving.");
        return;
      }

      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/insertUserAttribute",
        {
          user: user,
          workspace,
          workspace_id,
          attribute_type: "input_attributes",
          rule_type: sessionStorage.getItem("rule_type"),
          value: sessionStorage.getItem("type_id"),
          data: formattedData,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setIsOpen(false);
      } else {
        toast.error(error?.response.data.message || "Failed to delete.");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Something went wrong. Try again!");
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 w-full h-full z-60 flex justify-center items-center ${
        isOpen ? "flex" : "hidden"
      }`}
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[90%] xl:w-full max-w-5xl h-[90%] p-8 rounded-lg  shadow-lg ${
          theme === "dark"
            ? "bg-black text-white shadow-green-600"
            : "bg-white text-black shadow-blue-400"
        }`}
        ref={createRef}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Input Attributes</h2>
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
        <div className="main h-[80%]">
          <div className="columnNames p-2 flex gap-4 py-4">
            <div className="w-[150px]">Name</div>
            <div className="w-[150px]">Type</div>
            <div className="w-[190px]">Test Value</div>
            <div className="w-[120px]">Can be Null</div>
            <div className="w-[120px]">Case Sensitive</div>
            <div className="w-[120px]">Is Optional</div>
          </div>
          <div className="w-full h-[75%] max-w-6xl overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex flex-wrap items-center gap-4  mb-3 rounded-lg shadow-md ${
                    theme === "dark" ? " text-white" : "bg-white text-black"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={row.name}
                    onChange={(e) =>
                      handleInputChange(row.id, "name", e.target.value)
                    }
                    className={`p-3 w-[150px] border rounded-md ${
                      theme === "dark"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-black"
                    }`}
                    disabled={row.isAPI}
                  />

                  <select
                    value={row.type}
                    onChange={(e) => handleTypeChange(row.id, e.target.value)}
                    disabled={row.isAPI}
                    className={`p-3 w-[150px] border rounded-md ${
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

                  {row.type === "Boolean" ? (
                    <select
                      value={row.value}
                      onChange={(e) =>
                        handleInputChange(row.id, "value", e.target.value)
                      }
                      className={`p-3 w-[190px] border rounded-md ${
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
                      className={`p-3 w-[190px] border rounded-md ${
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
                      className={`p-3 border rounded-md w-[190px] ${
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
                      className={`p-3 border rounded-md w-[190px] ${
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
                      className={`p-3 border rounded-md w-[190px] ${
                        theme === "dark"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-black"
                      }`}
                    />
                  )}

                  <input
                    type="checkbox"
                    checked={row.isNull}
                    onChange={() => handleCheckboxChange(row.id, "isNull")}
                    className="w-5 h-5 mx-10 cursor-pointer"
                  />

                  <input
                    type="checkbox"
                    checked={row.isSensitive}
                    disabled={row.type != "String"}
                    onChange={() => handleCheckboxChange(row.id, "isSensitive")}
                    className="w-5 h-5 mx-12 cursor-pointer"
                  />
                  <input
                    type="checkbox"
                    checked={row.isOptional}
                    onChange={() => handleCheckboxChange(row.id, "isOptional")}
                    className="w-5 h-5 mx-10 cursor-pointer"
                  />
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="p-2 cursor-pointer text-red-400"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}

            <button
              onClick={addRow}
              className="flex justify-center items-center gap-1 text-blue-500 cursor-pointer font-bold"
            >
              <Plus size={18} />
              Add Attribute
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <button
            onClick={handleSaveAttribute}
            className={`px-5 py-2 text-white rounded-lg transition bg-blue-500 hover:bg-blue-700 cursor-pointer font-bold`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInputAttribute;
