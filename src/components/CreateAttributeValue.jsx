import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const CreateAttributeValue = ({ isOpen, setIsOpen, theme, onSave }) => {
  const createRef = useRef(null);
  const [attributeValues, setAttributeValues] = useState([
    { id: Date.now(), name: "", data_type: "String" },
  ]);

  const handleSelectChange = (e, index) => {
    const newValues = [...attributeValues];
    newValues[index].data_type = e.target.value;
    setAttributeValues(newValues);
  };

  const handleInputChange = (e, index) => {
    {
      const newValues = [...attributeValues];
      newValues[index].name = e.target.value;
      setAttributeValues(newValues);
    }
  };

  const deleteRow = (index) => {
    if (attributeValues.length > 1) {
      setAttributeValues(attributeValues.filter((_, i) => i !== index));
    }
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

  const addNewRow = (index) => {
    setAttributeValues([
      ...attributeValues,
      { id: index, name: "", data_type: "" },
    ]);
  };

  const handleSave = () => {
    onSave(attributeValues);
    setIsOpen();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-30 overflow-hidden"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div className="py-20 px-4 md:px-10 lg:px-20 xl:px-32 w-full h-full flex justify-center items-center">
        <div
          className={`main flex flex-col ${
            theme === "dark" ? "bg-black text-white" : "bg-white text-black"
          } w-full max-w-4xl h-auto rounded-xl px-8 py-4`}
          ref={createRef}
        >
          <div className="topbox flex items-center justify-between">
            <div className="font-bold text-xl">Add Attributes</div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          <hr
            className={`border my-4 ${
              theme === "dark" ? "border-white" : "border-black"
            }`}
          />

          <div className="mainBox relative">
            <div className="body relative w-full h-[310px] overflow-y-auto scrollbar-show ">
              <div
                className={`flex flex-col md:flex-row justify-between sticky top-0 mb-3 py-2 ${
                  theme === "dark" ? "bg-black" : "bg-white"
                }`}
              >
                <label className="text-sm font-medium md:w-1/3">
                  Data Type
                </label>
                <label className="text-sm font-medium md:w-1/2">Name</label>
              </div>

              <div className="space-y-3">
                {attributeValues.map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col md:flex-row items-center gap-4 p-2 rounded-lg shadow-md ${
                      theme === "dark"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    <div className="w-full md:w-1/3">
                      <select
                        value={item.data_type}
                        onChange={(e) => handleSelectChange(e, index)}
                        className={`p-3 border rounded-md w-full ${
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
                    </div>

                    <div className="w-full md:flex-1">
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={item.name}
                        onChange={(e) => handleInputChange(e, index)}
                        className={`p-3 border rounded-md w-full ${
                          theme === "dark"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-black"
                        }`}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => addNewRow(index)}
                        className="p-2 border cursor-pointer rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        <Plus size={20} />
                      </button>

                      {attributeValues.length > 1 && (
                        <button
                          onClick={() => deleteRow(index)}
                          className="p-2 cursor-pointer border rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 transition"
                        >
                          <Trash size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={attributeValues.some(
                  (item) => !item.data_type || !item.name.trim()
                )}
                className={`px-5 py-2 rounded-3xl my-5 cursor-pointer ${
                  attributeValues.some(
                    (item) => !item.data_type || !item.name.trim()
                  )
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-700"
                } ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAttributeValue;
