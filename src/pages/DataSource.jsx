import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import TableComp from "../components/TableComp";
import CreateDataSource from "@/components/CreateDataSource";
import ViewDataSource from "@/components/ViewDataSource";
import EditDataSource from "@/components/EditDataSource";
import { setDataSorceData } from "@/redux/dataSourceDeatils/dataSourceDeatilsSlice";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const DataSource = () => {
  const [limit, setLimit] = useState(10);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dataSourceData, setDataSourceData] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(null);
  const dataDetails = useSelector((state) => state.dataSourceDetails);
  const [isCreateOpen, setIsCreateOpen] = useState(
    dataDetails?.isSelected || false
  );

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const theme = useSelector((state) => state.theme.mode);

  useEffect(() => {
    setIsCreateOpen(dataDetails?.isSelected || false);
  }, [dataDetails?.isSelected]);

  const fetchTable = async () => {
    const API_URL =
      "https://rule-engine-datasource-test.mfilterit.net/datasource/view";
    const requestBody = {
      user: user,
      workspace: workspace,
      workspace_id: workspace_id,
      page_number: page,
      record_limit: limit,
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
      setTotalPages(result?.result?.total_pages || 1);
      return result?.result?.data || [];
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
    queryKey: ["rows", page, limit, workspace, "datasource-page"],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const onSaveCreate = () => {
    const resetData = { data: {}, isSelected: false };
    dispatch(setDataSorceData(resetData));
    refetch();
  };

  const handleEditSave = () => {
    refetch();
    setIsEditOpen(false);
  };

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    const deleteRow = rows[index] ?? null;
    try {
      const response = await axios.post(
        "https://rule-engine-datasource-test.mfilterit.net/datasource/delete",
        {
          datasource_id: deleteRow?.datasource_id,
          workspace_id: workspace_id,
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

  const setViewOn = (ind) => {
    const datasource_data = rows[ind];
    setIsViewOpen(true);
    setDataSourceData(datasource_data);
  };

  const handleEdit = (ind) => {
    const datasource_data = rows[ind];
    setIsEditOpen(true);
    setDataSourceData(datasource_data);
  };

  const columns = [
    "datasource_name",
    "platform",
    "name",
    "table_name",
    "created_at",
    "updated_at",
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
        Data Source
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
          actionVisbility={true}
          editVisbility={true}
          viewVisbility={true}
          tableSize={"400px"}
          handleDelete={handleDelete}
          onCreate={""}
          createView={false}
          onView={setViewOn}
          onEdit={handleEdit}
          isCreateDataSource={true}
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
      {isCreateOpen && (
        <CreateDataSource
          setIsOpen={setIsCreateOpen}
          isOpen={isCreateOpen}
          theme={theme}
          workspace={workspace}
          workspace_id={workspace_id}
          onSave={onSaveCreate}
        />
      )}
      {isViewOpen && (
        <ViewDataSource
          setIsOpen={setIsViewOpen}
          isOpen={isViewOpen}
          theme={theme}
          data={dataSourceData}
          setDataSourceData={setDataSourceData}
        />
      )}
      {isEditOpen && (
        <EditDataSource
          setIsOpen={setIsEditOpen}
          isOpen={isEditOpen}
          theme={theme}
          workspace={workspace}
          workspace_id={workspace_id}
          onSave={handleEditSave}
          data={dataSourceData}
          setDataSourceData={setDataSourceData}
        />
      )}
    </div>
  );
};

export default DataSource;
