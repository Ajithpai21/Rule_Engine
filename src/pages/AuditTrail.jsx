import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import TableComp from "@/components/TableComp";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const AuditTrail = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const theme = useSelector((state) => state.theme.mode);
  const api_key = useSelector((state) => state.apiDetails.api_key);

  const typeOptions = [
    { Type: "" },
    { "Simple Rule": "Simple Rule" },
    { "Rule Set": "Rule Set" },
    { "Decision Table": "Decision Table" },
  ];

  const actionOptions = [
    { Action: "" },
    { Create: "create" },
    { Edit: "edit" },
    { Delete: "delete" },
    { "API Rule Execution": "API Rule Execution" },
    { "Scheduler Rule Execution": "Scheduler Rule Execution" },
  ];

  const statusOptions = [
    { Status: "" },
    { Success: "Success" },
    { Error: "Error" },
  ];

  // State to track selected values
  const [selectedType, setSelectedType] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const handleCreate = () => {
    alert("create");
  };
  const fetchTable = async () => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/filterLogs";
    const requestBody = {
      user: user,
      workspace,
      workspace_id,
      api_key,
      action: selectedAction ? selectedAction : "",
      log_type: selectedType ? selectedType : "",
      status: selectedStatus ? selectedStatus : "",
      start_date: "",
      end_date: "",
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
    queryKey: ["rows", page, limit, workspace, "audit-page", selectedType, selectedAction, selectedStatus],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  useEffect(() => {
    refetch();
  }, [limit, page, refetch, workspace]);

  useEffect(() => {
    setPage(1);
  }, [workspace]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const columns = [
    "action",
    "action_by",
    "rule_type",
    "status",
    "result",
    "insert_time",
  ];

  return (
    <div
      className={`flex flex-col h-full px-6 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className={` w-full text-center font-bold text-2xl py-4 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
        }`}
      >
        Audit Trail
      </div>
      <div
        className={`p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <TableComp
          key={"audit"}
          rows={rows}
          isLoading={isLoading}
          page={page}
          limit={limit}
          totalPages={totalPages}
          handleLimitChange={handleLimitChange}
          setPage={setPage}
          columns={columns}
          actionVisbility={false}
          editVisbility={false}
          viewVisbility={false}
          tableSize={"400px"}
          handleDelete={""}
          onCreate={handleCreate}
          createView={false}
          onView={""}
          onEdit={""}
          isCreateDataSource={false}
          isRulePage={false}
          selectedType={""}
          setSelectedType={""}
          search={""}
          setSearch={""}
          isAuditPage={true}
          typeOptions={typeOptions}
          actionOptions={actionOptions}
          statusOptions={statusOptions}
          selectedTypeOption={selectedType}
          setSelectedTypeOption={setSelectedType}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
      </div>
    </div>
  );
};

export default AuditTrail;
