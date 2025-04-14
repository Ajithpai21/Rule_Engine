import React, { useRef, useEffect, useState } from "react";
import { X, Menu } from "lucide-react";

import "react-toastify/dist/ReactToastify.css";

const ViewDataSource = ({
  isOpen,
  setIsOpen,
  theme,
  data,
  setDataSourceData,
}) => {
  const createRef = useRef(null);
  const [query, setQuery] = useState("");

  const [tableData, setTableData] = useState({
    datasource_name: "",
    name: "",
    row_limit: "",
  });
  const [schemaData, setSchemaData] = useState([]);

  useEffect(() => {
    setQuery(data?.query);
    setTableData({
      datasource_name: data?.datasource_name,
      name: data?.name,
      row_limit: data?.row_limit,
    });
    setSchemaData(data?.mapped_columns);
  }, []);

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
          <h2 className="text-2xl font-bold ml-4">View Data-Source</h2>
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
                type="number"
                disabled={true}
                value={tableData?.row_limit}
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
                value={tableData?.name}
                disabled={true}
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
                disabled={true}
                placeholder="Enter your Query Here...."
                className={`w-full h-40 p-2 px-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-100"
                }`}
              />
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
                Mapped Columns
              </div>

              <div className="flex flex-col">
                {schemaData.map((item, index) => (
                  <div
                    key={index}
                    className={` ${
                      theme === "dark" ? "bg-gray-600 " : "bg-gray-200 "
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 p-2 cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-gray-500 bg-gray-700"
                          : "hover:bg-gray-300 bg-gray-200"
                      }`}
                    >
                      <Menu size={14} />
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDataSource;
