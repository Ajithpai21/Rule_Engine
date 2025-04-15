import React, { useRef, useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp, Folder } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const fetchTableDetails = async (table_name, platform, connectionString) => {
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

const EditDataSource = ({
  isOpen,
  setIsOpen,
  theme,
  workspace,
  workspace_id,
  onSave,
  data,
  setDataSourceData,
}) => {
  const createRef = useRef(null);
  const [openTables, setOpenTables] = useState({});
  const [query, setQuery] = useState("");
  const [testQueryButton, setTestQueryButton] = useState(false);
  const [publishButton, setPublishButton] = useState(true);
  const [datasourceId, setDatasourceId] = useState("");
  const [tableData, setTableData] = useState({
    datasource_name: "",
    name: "",
    row_limit: "",
  });

  const [platform, setPlatform] = useState("");
  const [connectionString, setConnectionString] = useState("");

  useEffect(() => {
    setQuery(data?.query);
    setTableData({
      datasource_name: data?.datasource_name,
      name: data?.name,
      row_limit: data?.row_limit,
    });
    setDatasourceId(data?.datasource_id);
    setPlatform(data?.platform);
    setConnectionString(data?.connection_string);
  }, []);

  const toggleTable = async (tableName) => {
    if (openTables[tableName]) {
      setOpenTables((prev) => ({ ...prev, [tableName]: null }));
    } else {
      const details = await fetchTableDetails(
        tableName,
        platform,
        connectionString
      );
      setOpenTables((prev) => ({ ...prev, [tableName]: details }));
    }
  };

  const handleDataChange = (e, field) => {
    const newData = { ...tableData, [field]: e.target.value };
    setTableData(newData);
  };

  const handleQueryChange = (e) => {
    if (testQueryButton) {
      setTestQueryButton(false);
      setPublishButton(true);
    }
    const newVal = e.target.value;
    setQuery(newVal);
  };

  const handleTest = async () => {
    if (!query.trim()) {
      toast.error("Query Cannot be Empty" || "Failed");
      return;
    }
    try {
      const response = await axios.post(
        "https://rule-engine-datasource-test.mfilterit.net/datasource/testquery",
        {
          connection_string: connectionString,
          platform,
          query: query.trim(),
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setTestQueryButton(true);
        setPublishButton(false);
      } else {
        toast.error(error?.response.data.message || "Failed");
      }
    } catch (error) {
      if (error.response) {
        toast.error(
          error.response.data?.message ||
            `Server Error: ${error.response.status}`
        );
      } else {
        toast.error("Something went wrong. Try again!");
      }
    }
  };

  const handleSave = async () => {
    if (!tableData?.name.trim() || !tableData?.row_limit) {
      const emptyFields = [];
      if (!tableData?.name.trim()) emptyFields.push("Name");
      if (!tableData?.row_limit) emptyFields.push("Row Limit");
      toast.error(`${emptyFields.join(" and ")} cannot be empty!`);
      return;
    }

    const payload = {
      user: user,
      workspace,
      workspace_id,
      datasource_name: "SQL",
      datasource_id: datasourceId,
      query: query.trim(),
      columns: [],
      table_name: "",
      row_limit: tableData?.row_limit,
      name: tableData?.name.trim(),
    };

    try {
      const response = await axios.post(
        "https://rule-engine-datasource-test.mfilterit.net/datasource/edit",
        payload
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setTestQueryButton(true);
        setPublishButton(false);
        onSave();
      } else {
        toast.error(error?.response.data.message || "Failed");
      }
    } catch (error) {
      if (error.response) {
        toast.error(
          error.response.data?.message ||
            `Server Error: ${error.response.status}`
        );
      } else {
        toast.error("Something went wrong. Try again!");
      }
    }
  };

  const fetchTablesCollection = async () => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/showTables_collection";
    const requestBody = {
      platform: platform,
      connectionString: connectionString,
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
    error,
    isLoading,
  } = useQuery({
    queryKey: ["tables", platform, connectionString],
    queryFn: fetchTablesCollection,
    enabled: Boolean(platform && connectionString), // Only run when these values exist
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen(false);
        setDataSourceData(null);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isOpen ? "flex" : "hidden"
      }`}
    >
      <div
        ref={createRef}
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-full max-w-4xl p-8 rounded-lg  shadow-lg ${
          theme === "dark"
            ? "bg-black text-white shadow-green-600"
            : "bg-white text-black shadow-blue-400"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold ml-4">Edit Data-Source</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setDataSourceData(null);
            }}
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
        <div className="w-full h-full flex ">
          <div className="w-[65%] space-y-2 pl-4 h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden ">
            <div className="integartionId space-y-2 w-[90%]">
              <div className="txt px-1 font-bold w-full">Integration</div>
              <input
                type="text"
                value={tableData.datasource_name}
                disabled={true}
                className={`w-full p-2 rounded-sm text-sm ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            </div>
            <div className="Action space-y-2 w-[90%]">
              <div className="txt w-full px-1 font-bold">Action</div>
              <input
                type="text"
                disabled={true}
                value={"SELECT Query"}
                className={`w-full p-2 rounded-sm text-sm ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            </div>
            <div className="RowLimit space-y-2 w-[90%]">
              <div className="txt w-full px-1 font-bold">Row Limit</div>
              <input
                onChange={(e) => handleDataChange(e, "row_limit")}
                type="number"
                value={tableData.row_limit}
                placeholder="Enter Row Limit"
                className={`w-full p-2 rounded-sm text-sm ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-100"
                }`}
              />
            </div>
            <div className="Name space-y-2 w-[90%]">
              <div className="txt w-full px-1 font-bold">Name</div>
              <input
                type="text"
                value={tableData.name}
                disabled={true}
                onChange={(e) => handleDataChange(e, "name")}
                placeholder="Enter Name"
                className={`w-full p-2 rounded-sm text-sm ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-100"
                }`}
              />
            </div>
            <div className="Query space-y-2 w-[90%]">
              <div className="txt w-full px-1 font-bold">Query</div>
              <textarea
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e)}
                placeholder="Enter your Query Here...."
                className={`w-full h-22 p-2 px-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-100"
                }`}
              />
            </div>
            <div className="flex justify-end w-[90%] gap-3">
              <button
                onClick={handleTest}
                disabled={!query.trim() || testQueryButton}
                className={`px-5 py-2 rounded-3xl my-5 ${
                  !query.trim() || testQueryButton
                    ? "bg-gray-400 cursor-not-allowed "
                    : "bg-purple-500 cursor-pointer "
                }  text-white`}
              >
                Test Query
              </button>
              <button
                onClick={handleSave}
                disabled={publishButton}
                className={`px-5 py-2 rounded-3xl my-5 text-white ${
                  publishButton
                    ? "bg-gray-400 cursor-not-allowed "
                    : "bg-purple-500 cursor-pointer "
                } `}
              >
                Publish
              </button>
            </div>
          </div>
          <div
            className={`w-[35%] flex flex-col rounded-sm px-4 py-3 h-[500px] ${
              theme === "dark" ? "bg-gray-900" : "bg-gray-100"
            }`}
          >
            <div className="title text-xl font-bold">Schema</div>
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
                <div className="flex justify-center items-center h-64">
                  Loading....
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tables.map((item, index) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDataSource;
