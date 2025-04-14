import React from "react";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useSelector } from "react-redux";
import "../index.css";
import CreateDropDown from "./CreateDropDown";

const TableComp = ({
  rows,
  isLoading,
  page,
  limit,
  totalPages,
  handleLimitChange,
  setPage,
  columns,
  actionVisbility,
  editVisbility,
  viewVisbility,
  tableSize,
  handleDelete,
  onCreate,
  createView,
  onView,
  onEdit,
  isCreateDataSource,
  isRulePage = false,
  selectedType,
  setSelectedType,
  search = "",
  setSearch,
  isAuditPage = false,
  typeOptions = [],
  actionOptions = [],
  statusOptions = [],
  selectedTypeOption,
  setSelectedTypeOption,
  selectedAction,
  setSelectedAction,
  selectedStatus,
  setSelectedStatus,
}) => {
  const theme = useSelector((state) => state.theme.mode);

  const handleChange = (e) => {
    setSelectedType(e.target.value);
  };

  const bgColor =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-300";
  const loaderColor = theme === "dark" ? "bg-gray-600" : "bg-gray-300";
  const hoverColor =
    theme === "dark"
      ? "hover:bg-gray-700 hover:text-gray-300"
      : "hover:bg-gray-100 hover:text-gray-900";

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center">
            <label className="mr-1 text-gray-800 dark:text-white">
              Rows per page:
            </label>
            <select
              className={`px-2 py-1 rounded border ${borderColor} ${bgColor}`}
              value={limit}
              onChange={handleLimitChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          {createView && (
            <button
              onClick={onCreate}
              className={`px-6 py-1.5 text-sm font-bold rounded-sm cursor-pointer border flex items-center gap-1 ${borderColor} ${bgColor} ${hoverColor}`}
            >
              <Plus size={14} /> Create
            </button>
          )}
          {isRulePage && (
            <div className="max-w-md flex items-center gap-2">
              <select
                id="rule-type"
                value={selectedType}
                onChange={handleChange}
                className={`font-bold w-full p-2  text-sm border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === "dark"
                    ? "text-white bg-gray-900"
                    : "text-black bg-white"
                }`}
              >
                <option value="">Select Type</option>
                <option value="Simple Rule">Simple Rule</option>
                <option value="Rule Set">Rule Set</option>
                <option value="Decision Table">Decision Table</option>
              </select>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full p-2 border border-black text-sm  rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === "dark"
                    ? "text-white bg-gray-900"
                    : "text-black bg-white"
                }`}
              />
            </div>
          )}
          {isCreateDataSource && <CreateDropDown />}
          {isAuditPage && (
            <div className="flex flex-wrap gap-2">
              {/* Type Dropdown */}
              <div className="relative">
                <select
                  className={`appearance-none text-sm border rounded px-4 py-2 pr-8 w-48  focus:outline-none ${
                    theme === "dark"
                      ? "text-white bg-gray-900"
                      : "text-black bg-white"
                  }`}
                  value={selectedTypeOption}
                  onChange={(e) => setSelectedTypeOption(e.target.value)}
                >
                  {typeOptions.map((option, index) => {
                    const key = Object.keys(option)[0];
                    const value = option[key];
                    return (
                      <option key={index} value={value}>
                        {key}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none  absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Action Dropdown */}
              <div className="relative">
                <select
                  className={`appearance-none text-sm border rounded px-4 py-2 pr-8 w-48  focus:outline-none ${
                    theme === "dark"
                      ? "text-white bg-gray-900"
                      : "text-black bg-white"
                  }`}
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  {actionOptions.map((option, index) => {
                    const key = Object.keys(option)[0];
                    const value = option[key];
                    return (
                      <option key={index} value={value}>
                        {key}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  className={`appearance-none text-sm border rounded px-4 py-2 pr-8 w-48  focus:outline-none ${
                    theme === "dark"
                      ? "text-white bg-gray-900"
                      : "text-black bg-white"
                  }`}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statusOptions.map((option, index) => {
                    const key = Object.keys(option)[0];
                    const value = option[key];
                    return (
                      <option key={index} value={value}>
                        {key}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            className={`px-3 py-1 border rounded ${borderColor} ${bgColor} ${
              page === 1 ? "opacity-50 cursor-not-allowed" : hoverColor
            }`}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-gray-800 dark:text-white">
            Page {page} of {totalPages}
          </span>
          <button
            className={`px-3 py-1 border rounded ${borderColor} ${bgColor} ${
              page >= totalPages ? "opacity-50 cursor-not-allowed" : hoverColor
            }`}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <div
        className={`w-full border-2 rounded-md overflow-hidden ${borderColor}`}
      >
        <div
          className="overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ maxHeight: tableSize || "calc(100vh - 220px)" }}
        >
          <table
            className={`w-full text-left divide-y border-collapse border ${borderColor} ${bgColor}`}
          >
            <thead
              className={`sticky top-0 z-10 ${bgColor} border-b-2 ${borderColor} shadow-md`}
            >
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-4 text-xs font-medium uppercase tracking-wider`}
                  >
                    {column}
                  </th>
                ))}
                {actionVisbility && (
                  <th
                    className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-center border-r ${borderColor}`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className={`divide-y ${borderColor}`}>
              {isLoading ? (
                [...Array(limit)].map((_, index) => (
                  <tr key={index} className="h-12">
                    {columns.map((_, i) => (
                      <td
                        key={i}
                        className={`px-6 py-4 border-r ${borderColor}`}
                      >
                        <div
                          className={`h-4 ${loaderColor} rounded w-28`}
                        ></div>
                      </td>
                    ))}
                    {actionVisbility && (
                      <td className={`px-6 py-4 border-r ${borderColor}`}>
                        <div
                          className={`h-6 ${loaderColor} rounded w-16`}
                        ></div>
                      </td>
                    )}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr className="h-16 border-b-2">
                  <td
                    colSpan={columns.length + 1}
                    className="text-center py-10 text-gray-400"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={index}
                    className={`${hoverColor} transition duration-200 h-12`}
                  >
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className={`px-6 py-4 border-r ${borderColor} max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap`}
                      >
                        {row[col]}
                      </td>
                    ))}
                    {actionVisbility && (
                      <td
                        className={`px-2 py-4 flex space-x-1 justify-center gap-2 border-r ${borderColor}`}
                      >
                        {viewVisbility && (
                          <button
                            onClick={() => onView(index)}
                            className="p-1 text-blue-400 hover:text-blue-500 cursor-pointer"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {editVisbility && (
                          <button
                            onClick={() => onEdit(index)}
                            className="p-1 text-yellow-400 hover:text-yellow-500 cursor-pointer"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button
                          className="p-1 text-red-400 hover:text-red-500 cursor-pointer"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableComp;
