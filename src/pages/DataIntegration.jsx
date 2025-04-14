import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import AddIntegration from "@/components/AddIntegration";
import EditIntegration from "@/components/EditIntegration";
import AddAPIIntegration from "@/components/AddAPIIntegration";
import EditAPIIntegration from "@/components/EditAPIIntegration";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const API_URL =
  "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/getIntegrationType";

const DataIntegration = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [apiData, setApiData] = useState([]);
  const [isAddApiOpen, setIsAddApiOpen] = useState(false);
  const [isEditApiOpen, setIsEditApiOpen] = useState(false);
  const [apiPlatformData, setApiPlatformData] = useState("");
  const [platformData, setPlatformData] = useState("");

  const theme = useSelector((state) => state.theme.mode);
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const queryClient = useQueryClient();

  const fetchIntegrationTypes = async () => {
    const payload = {
      user: user,
      workspace,
      workspace_id,
    };

    const response = await axios.post(API_URL, payload);
    setApiData(response.data?.restAPI);
    return response.data?.data || [];
  };

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["integrationTypes", workspace],
    queryFn: fetchIntegrationTypes,
  });

  const handleIsAddOpen = () => {
    setIsAddOpen(false);
    refetch();
  };

  const handleIsAddApiOpen = () => {
    setIsAddApiOpen(false);
    setApiPlatformData("");
    refetch();
  };

  const handleIsEditOpen = () => {
    setIsEditOpen(false);
    refetch();
  };

  const handleIsEditApiOpen = () => {
    setIsEditApiOpen(false);
    refetch();
  };

  const handleDelete = async (ind, type) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    let deleteRow;

    if (type === "restAPI") {
      deleteRow = apiData[ind] ?? null;
    } else {
      deleteRow = data[ind] ?? null;
    }

    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/deleteConnection",
        {
          user: user,
          workspace_id,
          workspace,
          name: deleteRow?.name,
          platform: deleteRow?.platform,
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

  const handleAdd = (ind, type) => {
    if (type === "restAPI") {
      setIsAddApiOpen(true);
      setApiPlatformData(apiData[ind]);
    } else {
      setIsAddOpen(true);
      setPlatformData(data[ind]);
    }
  };

  const handleEdit = (ind, type) => {
    if (type === "restAPI") {
      setIsEditApiOpen(true);
      setApiPlatformData(apiData[ind]);
    } else {
      setIsEditOpen(true);
      setPlatformData(data[ind]);
    }
  };

  useEffect(() => {
    refetch();
  }, [workspace, refetch]);

  const LoadingCards = () => {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="p-4 bg-gray-700 animate-pulse rounded-2xl shadow-md border h-[160px]"
          />
        ))}
      </>
    );
  };

  const IntegrationCard = ({ ind, onAdd, onDelete, onEdit, item }) => {
    return (
      <div className="relative p-4 bg-white rounded-2xl shadow-md border">
        {item.status !== "Add" && (
          <>
            {item.platform != "restAPI" && (
              <span className="absolute max-w-[60px] truncate  top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                {item.tag}
              </span>
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <Edit
                onClick={() => {
                  console.log("item", item);
                  item.platform === "restAPI"
                    ? onEdit(ind, "restAPI")
                    : onEdit(ind, "database");
                }}
                className="w-5 h-5 text-gray-600 cursor-pointer"
              />
              <Trash2
                onClick={() =>
                  item.platform === "restAPI"
                    ? onDelete(ind, "restAPI")
                    : onDelete(ind, "database")
                }
                className="w-5 h-5 text-red-500 cursor-pointer"
              />
            </div>
          </>
        )}

        <div className="flex flex-col items-center">
          <img
            src={item.icon}
            alt="Platform Logo"
            className="w-16 h-16 object-contain mb-2"
          />
          <h3 className="text-center font-semibold text-black">{item.name}</h3>
        </div>

        <div className="mt-3 flex justify-center">
          {item.status === "Add" ? (
            <button
              onClick={() =>
                item.name === "restAPI"
                  ? onAdd(ind, "restAPI")
                  : onAdd(ind, "database")
              }
              className="bg-blue-500 cursor-pointer text-white px-4 py-1 rounded-md flex gap-1 items-center"
            >
              <Plus size={14} /> Add
            </button>
          ) : (
            <div className="flex items-center text-green-600 font-semibold">
              <CheckCircle className="w-5 h-5 mr-1" /> {item.status}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[88.8vh] px-16 py-2 flex justify-center items-center">
      <div
        className={`overflow-auto w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-full h-full rounded-md shadow-lg shadow-gray-600 p-4 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
        }`}
      >
        <div className="text-center py-4 text-2xl font-bold ">
          Database Integrations
        </div>
        <hr
          className={`border-1  ${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />
        <div className="max-w-5xl mx-auto p-4">
          <div className="max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {isLoading ? (
                <LoadingCards />
              ) : (
                data.map((item, index) => (
                  <IntegrationCard
                    ind={index}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    key={index}
                    item={item}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="text-center py-4 text-2xl font-bold ">
          API Integrations
        </div>
        <hr
          className={`border-1  ${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />

        <div className="max-w-5xl mx-auto p-4">
          <div className="max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {isLoading ? (
                <LoadingCards />
              ) : (
                apiData.map((item, index) => (
                  <IntegrationCard
                    ind={index}
                    onAdd={handleAdd}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    key={index}
                    item={item}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* API Integration Modal */}
        {isAddApiOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={handleIsAddApiOpen}
            />
            <div className="absolute inset-y-0 right-0">
              <div className="relative h-full w-[480px] transform transition-transform duration-500 ease-in-out translate-x-0 overflow-y-auto overflow-x-hidden">
                <AddAPIIntegration
                  isOpen={isAddApiOpen}
                  setIsOpen={handleIsAddApiOpen}
                  theme={theme}
                  workspace={workspace}
                  workspace_id={workspace_id}
                  apiPlatformData={apiPlatformData}
                  setApiPlatformData={setApiPlatformData}
                />
              </div>
            </div>
          </div>
        )}

        {/* API Integration Edit Modal */}
        {isEditApiOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                setIsEditApiOpen(false);
                setApiPlatformData("");
              }}
            />
            <div className="absolute inset-y-0 right-0">
              <div className="relative h-full w-[480px] transform transition-transform duration-500 ease-in-out translate-x-0 overflow-y-auto overflow-x-hidden">
                <EditAPIIntegration
                  isOpen={isEditApiOpen}
                  setIsOpen={() => {
                    setIsEditApiOpen(false);
                    setApiPlatformData("");
                    refetch();
                  }}
                  theme={theme}
                  workspace={workspace}
                  workspace_id={workspace_id}
                  apiPlatformData={apiPlatformData}
                  setApiPlatformData={setApiPlatformData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {isAddOpen && (
        <AddIntegration
          theme={theme}
          handleIsAddOpen={handleIsAddOpen}
          workspace={workspace}
          workspace_id={workspace_id}
          platformData={platformData}
          setPlatformData={setPlatformData}
        />
      )}
      {isEditOpen && (
        <EditIntegration
          theme={theme}
          handleIsAddOpen={handleIsEditOpen}
          workspace={workspace}
          workspace_id={workspace_id}
          platformData={platformData}
          setPlatformData={setPlatformData}
        />
      )}
    </div>
  );
};

export default DataIntegration;
