import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWorkspaces,
  setSelectedWorkspace,
} from "../redux/workspaceDetails/workspaceDetailsSlice";
import getUserDetails from "@/utils/getUserDetails";

const Dropdown = () => {
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const theme = useSelector((state) => state.theme.mode);
  const [authState, setAuthState] = useState(!!sessionStorage.getItem("token"));

  const selectedItemstyle =
    theme === "dark"
      ? "bg-gray-800 border-gray-500"
      : "bg-white text-black border-black";
  const hoverstyle =
    theme === "dark" ? "hover:bg-gray-600" : "hover:bg-blue-500 ";
  const linestyle = theme === "dark" ? "border-gray-300" : "border-black";

  const {
    data: workspaces,
    loading,
    error,
    selectedWorkspace,
  } = useSelector((state) => state.workspaceDetails);

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

  // Check for auth changes
  useEffect(() => {
    const checkAuthState = () => {
      const tokenExists = !!sessionStorage.getItem("token");
      if (tokenExists !== authState) {
        setAuthState(tokenExists);
      }
    };

    // Check immediately
    checkAuthState();

    // Set up interval to check for auth changes
    const intervalId = setInterval(checkAuthState, 1000);

    return () => clearInterval(intervalId);
  }, [authState]);

  // Fetch workspaces when auth state changes
  useEffect(() => {
    if (authState) {
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, authState]);

  const handleSelect = (item) => {
    dispatch(setSelectedWorkspace(item));
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    dispatch(fetchWorkspaces());
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={handleButtonClick}
        className={`px-4 py-2 w-[180px] truncate bg-gray-800 font-bold rounded-md border cursor-pointer ${selectedItemstyle}`}
      >
        {selectedWorkspace}
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 max-h-[200px] w-[200px] overflow-y-auto border rounded-md shadow-lg z-11 ${selectedItemstyle}`}
        >
          {loading ? (
            <div className="p-2 text-center">Loading...</div>
          ) : error ? (
            <div className="p-2 text-red-500 text-center">{error}</div>
          ) : (
            workspaces.map((item, index) => (
              <div key={item.workspace_id}>
                <button
                  onClick={() => handleSelect(item)}
                  className={`block w-full px-4 py-2 text-left cursor-pointer ${hoverstyle} truncate`}
                >
                  {item?.workspace}
                </button>
                {index !== workspaces.length - 1 && (
                  <hr className={`${linestyle}`} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
