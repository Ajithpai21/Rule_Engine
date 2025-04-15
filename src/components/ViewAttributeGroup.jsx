import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import TableComp from "./TableComp";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CreateAttributeValue from "./CreateAttributeValue";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const ViewAttributeGroup = ({
  theme,
  setIsOpen,
  isOpen,
  workspace,
  workspace_id,
  group_id,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const pageRef = useRef(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [valueIsOpen, setValueIsOpen] = useState(false);
  const api_key = useSelector((state) => state.apiDetails.api_key);

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      queryClient.removeQueries(["rows", page, limit, workspace, "value"]);
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const fetchTable = async () => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/viewAttributeValue";
    const requestBody = {
      user: user,
      workspace,
      workspace_id,
      api_key,
      group_id,
      page,
      limit,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok)
        throw new Error(`Error: ${response.status} - ${response.statusText}`);

      const result = await response.json();
      setTotalPages(result?.total_pages || 1);
      return result?.data || [];
    } catch (error) {
      console.error("API call failed:", error.message);
      return [];
    }
  };

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rows", page, limit, workspace, "value"],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });
  const handleAttributeDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    const deleteRow = rows[index] ?? null;
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/deleteAttributeValue",
        {
          user: user,
          api_key,
          workspace: workspace,
          workspace_id: workspace_id,
          name: deleteRow.name,
          attribute_id: deleteRow._id,
          group_id: deleteRow.group_id,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        refetch();
      } else {
        toast.error(error?.response.data.message || "Failed to delete.");
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
  const onSaveAttributeValue = async (data) => {
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/createAttributeValue",
        {
          user: user,
          api_key,
          workspace: workspace,
          workspace_id: workspace_id,
          group_id,
          data,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setValueIsOpen(false);
        refetch();
      } else {
        toast.error(error?.response.data.message || "Failed to delete.");
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

  const handleCreate = () => {
    setValueIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(), 300);
  };

  const columns = [
    { label: "Name", value: "name" },
    { label: "Data Type", value: "data_type" },
  ];

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-30 overflow-hidden"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        onClick={handleClose}
        className="w-[50%] h-full flex items-center justify-center"
      ></div>

      <div
        ref={pageRef}
        className={`w-[50%] h-full transition-transform duration-300 ease-in-out px-4 fixed top-0 right-0 
    ${isVisible ? "translate-x-0" : "translate-x-full"}  
    ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        <div className="topbox flex items-center justify-between pt-4">
          <div className="font-bold text-xl">Attribute Details</div>
          <button
            onClick={handleClose}
            className={`p-2 ${
              theme === "dark" ? "hover:bg-blue-600" : "hover:bg-red-500"
            } rounded cursor-pointer`}
          >
            <X size={24} />
          </button>
        </div>
        <hr
          className={`border my-4 ${
            theme === "dark" ? "border-white" : "border-black"
          }`}
        />
        <div
          className={`p-4 rounded-lg shadow ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <TableComp
            key={"value"}
            rows={rows}
            isLoading={isLoading}
            page={page}
            limit={limit}
            totalPages={totalPages}
            handleLimitChange={handleLimitChange}
            setPage={setPage}
            columns={columns}
            actionVisbility={true}
            editVisbility={false}
            viewVisbility={false}
            tableSize={"400px"}
            handleDelete={handleAttributeDelete}
            onCreate={handleCreate}
            createView={true}
            onView={""}
            onEdit={""}
            isCreateDataSource={false}
            isRulePage={false}
            selectedType={""}
            setSelectedType={""}
            search={""}
            setSearch={""}
            isAuditPage={false}
            typeOptions={""}
            actionOptions={""}
            statusOptions={""}
            selectedTypeOption={""}
            setSelectedTypeOption={""}
            selectedAction={""}
            setSelectedAction={""}
            selectedStatus={""}
            setSelectedStatus={""}
          />
        </div>
      </div>
      {valueIsOpen && (
        <CreateAttributeValue
          isOpen={valueIsOpen}
          setIsOpen={handleCreate}
          theme={theme}
          onSave={onSaveAttributeValue}
        />
      )}
    </div>
  );
};

export default ViewAttributeGroup;
