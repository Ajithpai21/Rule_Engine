import React, { useRef, useEffect, useState } from "react";
import { Trash2, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const AddDataSource = ({
  isOpen,
  setIsOpen,
  theme,
  workspace,
  workspace_id,
}) => {
  const createRef = useRef(null);
  const [payloadData, setPayloadData] = useState({
    datasource_id: "",
    datasource_name: "",
    name: "Select Dataset",
    platform: "",
  });

  const fetchInitialData = async () => {
    const payload = {
      user: user,
      workspace,
      workspace_id,
      rule_type: sessionStorage.getItem("rule_type"),
      type_id: sessionStorage.getItem("type_id"),
    };

    const response = await axios.post(
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/viewMappedDataSource",
      payload
    );

    return response.data;
  };

  const fetchNameOptions = async () => {
    const payload = {
      user: user,
      workspace,
      workspace_id,
      rule_type: sessionStorage.getItem("rule_type"),
      rule_id: sessionStorage.getItem("type_id"),
    };

    const response = await axios.post(
      "https://micro-solution-ruleengineprod.mfilterit.net/getAttribute",
      payload
    );

    return response.data.data.input_attributes || [];
  };

  const fetchKeyOptions = async () => {
    const payload = {
      user: user,
      workspace,
      workspace_id,
      name: payloadData.name,
      platform: payloadData.platform,
      datasource_name: payloadData.datasource_name,
      datasource_id: payloadData.datasource_id,
    };

    const response = await axios.post(
      "https://rule-engine-datasource-test.mfilterit.net/datasource/list_mapped_columns",
      payload
    );

    return response.data.result || [];
  };

  const fetchDataset = async () => {
    const payload = {
      user: user,
      workspace,
      workspace_id,
      page_number: 1,
      record_limit: 5,
    };

    const response = await axios.post(
      "https://rule-engine-datasource-test.mfilterit.net/datasource/view",
      payload
    );

    return response.data.result.data || [];
  };

  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["initialData"],
    queryFn: fetchInitialData,
  });

  const { data: nameOptions = [], isLoading: loadingNames } = useQuery({
    queryKey: ["nameOptions"],
    queryFn: fetchNameOptions,
  });

  const { data: keyOptions = [], isLoading: loadingKeys } = useQuery({
    queryKey: ["keyOptions", payloadData],
    queryFn: fetchKeyOptions,
    enabled: !!payloadData?.datasource_name && !!payloadData?.datasource_id,
  });

  const { data: dataset = [], isLoading: loadingdataset } = useQuery({
    queryKey: ["dataset"],
    queryFn: fetchDataset,
  });

  const [inputRows, setInputRows] = useState([]);

  const handleInputChange = (index, field, value) => {
    const updatedRows = inputRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setInputRows(updatedRows);
  };

  const addRow = () => {
    setInputRows([...inputRows, { key: "Select Name", value: "Select Key" }]);
  };

  const deleteRow = (index) => {
    setInputRows(inputRows.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (apiData?.datasource_name) {
      setPayloadData((prevData) => ({
        ...prevData,
        datasource_name: apiData.datasource_name,
      }));
    }
    if (apiData?.datasource_id) {
      setPayloadData((prevData) => ({
        ...prevData,
        datasource_id: apiData.datasource_id,
      }));
    }
    if (apiData?.platform) {
      setPayloadData((prevData) => ({
        ...prevData,
        platform: apiData.platform,
      }));
    }

    if (apiData?.name) {
      setPayloadData((prevData) => ({
        ...prevData,
        name: apiData.name,
      }));
    }

    if (apiData?.input_data_map) {
      setInputRows(
        Object.entries(apiData.input_data_map).map(([key, value]) => ({
          key,
          value,
        }))
      );
    } else {
      setInputRows([{ key: "Select Name", value: "Select Key" }]);
    }
  }, [apiData]);

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

  const handleDataSetChange = (selectedName) => {
    const selectedItem = dataset.find((item) => item.name === selectedName);
    if (selectedItem) {
      setPayloadData({
        platform: selectedItem.platform,
        name: selectedItem.name,
        datasource_id: selectedItem.datasource_id,
        datasource_name: selectedItem.datasource_name,
      });
      setInputRows([{ key: "Select Name", value: "Select Key" }]);
    }
  };

  const handleSaveDataSource = async () => {
    try {
      const formattedData = inputRows.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});

      const hasInvalidKey = Object.keys(formattedData).includes("Select Name");
      const hasInvalidValue =
        Object.values(formattedData).includes("Select Key");

      if (hasInvalidKey || hasInvalidValue) {
        toast.error("Please Fill all the Required Value!");
        return;
      }

      const rule_type = sessionStorage.getItem("rule_type");
      const type_id = sessionStorage.getItem("type_id");

      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/mappDataSource",
        {
          user: user,
          workspace,
          workspace_id,
          name: payloadData.name,
          platform: payloadData.platform,
          datasource_name: payloadData.datasource_name,
          datasource_id: payloadData.datasource_id,
          rule_type,
          decision_id: rule_type === "Decision Table" ? type_id : "",
          rule_id: rule_type === "Simple Rule" ? type_id : "",
          ruleset_id: rule_type === "Rule Set" ? type_id : "",
          created_by: "ajith",
          input_mapping: formattedData,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setIsOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete.");
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
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[90%] xl:w-full max-w-xl h-[90%] p-8 rounded-lg  shadow-lg ${
          theme === "dark"
            ? "bg-black text-white shadow-green-600"
            : "bg-white text-black shadow-blue-400"
        }`}
        ref={createRef}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Map with Data Source</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 cursor-pointer rounded-md hover:bg-red-500 dark:hover:bg-blue-600"
          >
            <X size={24} />
          </button>
        </div>
        <hr
          className={`border-1 ${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />
        <div className="main h-[80%]">
          <div className="datasetBox flex gap-4 items-center">
            <div className="label font-bold text-sm">Select Dataset:</div>
            <select
              onChange={(e) => handleDataSetChange(e.target.value)}
              className={`border p-2 rounded-md min-w-[180px] ${
                theme === "dark" ? "bg-gray-800 text-white" : "text-black"
              }`}
              value={payloadData.name}
            >
              <option>Select Dataset</option>
              {loadingdataset ? (
                <option>Loading....</option>
              ) : (
                dataset.map((item, ind) => (
                  <option key={ind} value={item.name}>
                    {item.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="columnNames p-2 flex gap-4 py-4 font-bold">
            <div className="w-[225px]">Name</div>
            <div className="w-[225px]">Primary Key</div>
          </div>
          <div className="w-full h-[70%] max-w-6xl overflow-y-auto">
            {isLoading ? (
              <p>Loading...</p>
            ) : isError ? (
              <p>Error loading data</p>
            ) : (
              <div className=" py-1">
                {inputRows.map((row, index) => (
                  <div key={index} className="flex gap-10 mb-2">
                    <select
                      className={`border p-2 rounded-md min-w-[200px] ${
                        theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "text-black"
                      }`}
                      value={row.key}
                      onChange={(e) =>
                        handleInputChange(index, "key", e.target.value)
                      }
                    >
                      <option>Select Name</option>
                      {loadingNames ? (
                        <option>Loading...</option>
                      ) : (
                        nameOptions.map((item, ind) => (
                          <option key={ind} value={item.attribute}>
                            {item.attribute}
                          </option>
                        ))
                      )}
                    </select>

                    <select
                      className={`border p-2 rounded-md min-w-[180px] ${
                        theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "text-black"
                      }`}
                      value={row.value}
                      onChange={(e) =>
                        handleInputChange(index, "value", e.target.value)
                      }
                    >
                      <option>Select Key</option>
                      {loadingKeys ? (
                        <option>Loading...</option>
                      ) : (
                        keyOptions.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))
                      )}
                    </select>

                    <button
                      onClick={() => deleteRow(index)}
                      className="p-2 cursor-pointer text-red-400"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addRow}
                  className="flex text-sm justify-center items-center gap-1 text-blue-500 cursor-pointer font-bold"
                >
                  <Plus size={18} />
                  Add Row
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <button
            onClick={handleSaveDataSource}
            className={`px-5 py-2 text-white rounded-lg transition bg-blue-500 hover:bg-blue-700 cursor-pointer font-bold`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDataSource;
