import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import getUserDetails from "@/utils/getUserDetails";

const fetchWorkspaces = async (user) => {
  const { data } = await axios.get(
    `https://micro-solution-ruleengineprod.mfilterit.net/getWorkSpace?user=${user}`
  );
  return data.data;
};

const WorkspacePage = () => {
  const theme = useSelector((state) => state.theme.mode);
  const [workspaceName, setWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const queryClient = useQueryClient();
  const user = getUserDetails();

  const {
    data: workspaces = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["workspaces", user],
    queryFn: () => fetchWorkspaces(user),
    enabled: !!user,
  });

  const addWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setIsSaving(true);

    try {
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/createWorkSpace",
        { user, workspace: workspaceName.trim() },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message);
        setWorkspaceName("");
        queryClient.invalidateQueries(["workspaces", user]);
      } else {
        toast.error(response.data.message || "Failed to create workspace");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Error creating workspace!"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const editWorkspace = async (prevName, newName) => {
    if (!newName.trim()) return;
    setIsEditing(true);

    try {
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/editWorkSpace",
        {
          user,
          old_workspace: prevName,
          new_workspace: newName.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message);
        setEditingId(null);
        queryClient.invalidateQueries(["workspaces", user]);
      } else {
        toast.error(response.data.message || "Workspace edit failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong!");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`p-6 h-[88.8vh] flex justify-center items-center ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div
        className={`w-full max-w-2xl p-6 rounded-lg shadow-md ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Manage Workspaces
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className={`w-full p-2 border rounded-md ${
              theme === "dark"
                ? "bg-gray-700 text-white"
                : "bg-white text-black"
            }`}
          />
          <button
            onClick={addWorkspace}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 cursor-pointer"
            disabled={!workspaceName.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3 p-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader className="animate-spin" size={32} />
            </div>
          ) : isError ? (
            <p className="text-red-500 text-center">
              Failed to load workspaces
            </p>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace.workspace_id}
                className={`flex justify-between items-center p-3 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-700 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {editingId === workspace.workspace_id ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className={`w-full p-2 border rounded-md ${
                      theme === "dark"
                        ? "bg-gray-600 text-white"
                        : "bg-white text-black"
                    }`}
                  />
                ) : (
                  <span className="truncate w-3/4">{workspace.workspace}</span>
                )}
                <div className="flex gap-2">
                  {editingId === workspace.workspace_id ? (
                    <>
                      <button
                        onClick={() =>
                          editWorkspace(workspace.workspace, editedName)
                        }
                        className="p-2 bg-green-600 text-white rounded-md cursor-pointer"
                        disabled={isEditing}
                      >
                        {isEditing ? "Saving..." : <Check size={16} />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-red-600 text-white rounded-md cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(workspace.workspace_id);
                        setEditedName(workspace.workspace);
                      }}
                      className="p-2 bg-yellow-500 text-white rounded-md"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
