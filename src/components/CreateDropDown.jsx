import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { setDataSorceData } from "@/redux/dataSourceDeatils/dataSourceDeatilsSlice";
import { useNavigate } from "react-router-dom";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const CreateDropDown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.theme.mode);
  const [isOpen, setIsOpen] = useState(false);
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );

  const handleSelect = (item) => {
    const data = {
      data: {
        name: item?.name,
        platform: item?.platform,
        integration_id: item?.integration_id,
        connectionString: item?.connectionString,
      },
      isSelected: true,
    };
    dispatch(setDataSorceData(data));
    setIsOpen(false);
  };

  const fetchTable = async () => {
    const API_URL =
      "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/getIntegrationType";
    const requestBody = {
      user: user,
      workspace: workspace,
      workspace_id: workspace_id,
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
      const data = result?.data;
      return data || [];
    } catch (error) {
      console.error("API call failed:", error.message);
      return [];
    }
  };

  const {
    data: connectionData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["connectionData", workspace, "datasource-add"],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  const handleNavigation = (route) => {
    navigate(route);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = () => {
    setIsOpen((prev) => !prev);
    refetch();
  };

  const dropdownRef = useRef(null);
  const selectedItemstyle =
    theme === "dark"
      ? "bg-gray-800 border-gray-500"
      : "bg-white text-black border-black";
  const hoverstyle =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-blue-300 ";

  const hoverstyleBtn =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-300 ";
  const hoverAddBtn =
    theme === "dark" ? "hover:bg-blue-600" : "hover:bg-gray-300 ";
  const linestyle = theme === "dark" ? "border-gray-300" : "border-black";

  const hasValidData = () => {
    if (!connectionData) return false;
    if (!Array.isArray(connectionData)) return false;
    if (connectionData.length === 0) return false;

    const displayableItems = connectionData.filter(
      (item) => item?.status !== "Add"
    );
    return displayableItems.length > 0;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div
        onClick={handleButtonClick}
        className={`px-4 py-2 w-[200px] flex truncate justify-center items-center gap-2 bg-gray-800 font-bold rounded-md border cursor-pointer ${selectedItemstyle} ${hoverstyleBtn}`}
      >
        <Plus size={20} /> Create Data Source
      </div>
      {isOpen && (
        <div
          className={`absolute mt-2 max-h-[200px] truncate w-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden border rounded-md shadow-lg z-20 ${selectedItemstyle}`}
        >
          {isLoading ? (
            <div className="p-2 text-center">Loading...</div>
          ) : error ? (
            <div className="p-2 text-red-500 text-center">{error}</div>
          ) : !hasValidData() ? (
            <div className="p-4 text-center">No Data Available</div>
          ) : (
            connectionData.map(
              (item, index) =>
                item?.status !== "Add" && (
                  <div key={index}>
                    <button
                      onClick={() => handleSelect(item)}
                      className={`flex gap-3 w-full px-4 py-2 text-left cursor-pointer ${hoverstyle} truncate`}
                    >
                      <img
                        src={item?.icon || ""}
                        alt="icon"
                        className="w-6 h-6 object-fit rounded-full"
                      />
                      {item?.name || "Unnamed Source"}
                    </button>
                    {index !== connectionData.length - 1 && (
                      <hr className={`${linestyle}`} />
                    )}
                  </div>
                )
            )
          )}
          <div
            onClick={() => handleNavigation("/integrations")}
            className={`justify-center items-center flex gap-1 font-bold p-2 cursor-pointer ${hoverAddBtn}`}
          >
            <Plus size={20} /> Add Integration
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDropDown;
