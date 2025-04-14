import React, { useState, useEffect } from "react";
import TableComp from "../components/TableComp";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CreateAttributeGroup from "@/components/CreateAttributeGroup";
import ViewAttributeGroup from "@/components/ViewAttributeGroup";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const AttributeLibrary = () => {
  const [PageIsOpen, setPageIsOpen] = useState(false);
  const [isView, setPageIsView] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [group_id, setGroup_id] = useState("");
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const theme = useSelector((state) => state.theme.mode);
  const api_key = useSelector((state) => state.apiDetails.api_key);

  const fetchTable = async () => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/viewAttributeGroup";
    const requestBody = {
      user: user,
      workspace,
      workspace_id,
      api_key,
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

  const handleCreateGroup = async (name) => {
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/createAttributeGroup",
        {
          user: user,
          api_key,
          workspace: workspace,
          workspace_id: workspace_id,
          name: name,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setPageIsOpen((prev) => !prev);
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
    setPageIsOpen(true);
  };

  const setViewOn = (ind) => {
    setPageIsView((prev) => !prev);
    const filter = rows[ind];
    setGroup_id(filter?._id);
    refetch();
  };

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rows", page, limit, workspace, "attribute-page"],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    const deleteRow = rows[index] ?? null;
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/deleteAttributeGroup",
        {
          user: user,
          api_key,
          workspace,
          workspace_id,
          group_id: deleteRow._id,
          name: deleteRow.name,
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

  const columns = ["name", "attribute_count", "created_at", "updated_at"];

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
        Attribute Library
      </div>
      <div
        className={`p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <TableComp
          key={"atrribute"}
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
          viewVisbility={true}
          tableSize={"400px"}
          handleDelete={handleDelete}
          onCreate={handleCreate}
          createView={true}
          onView={setViewOn}
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

      {PageIsOpen && (
        <CreateAttributeGroup
          setIsOpen={setPageIsOpen}
          isOpen={PageIsOpen}
          theme={theme}
          handleCreateGroup={handleCreateGroup}
        />
      )}

      {isView && (
        <ViewAttributeGroup
          theme={theme}
          setIsOpen={setViewOn}
          isOpen={isView}
          workspace={workspace}
          workspace_id={workspace_id}
          group_id={group_id}
        />
      )}
    </div>
  );
};

export default AttributeLibrary;
