import React, { useRef, useEffect, useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const theme = useSelector((state) => state.theme.mode);
  const menuref = useRef(null);
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    security: false,
    dataAction: false,
    home: false,
  });

  const hoverTheme =
    theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-200";

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuref.current && !menuref.current.contains(event.target)) {
        setOpenSections({ security: false, dataAction: false, home: false });
        toggleSidebar();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  const handleNavigation = (route) => {
    navigate(route);
    toggleSidebar();
    setOpenSections({
      security: false,
      dataAction: false,
      home: false,
    });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div
      ref={menuref}
      className={`fixed top-0 left-0 h-full w-72 shadow-lg transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${
        theme === "dark"
          ? "bg-gray-900 text-white border-gray-600"
          : "bg-white text-black border-r border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-500">
        <h2 className="text-lg font-semibold">Menu</h2>
        <button
          onClick={() => {
            setOpenSections({
              security: false,
              dataAction: false,
              home: false,
            });
            toggleSidebar();
          }}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-5 space-y-3">
        <div
          onClick={() => handleNavigation("/rules")}
          className={`cursor-pointer px-4 py-2 rounded-md font-medium transition ${hoverTheme}`}
        >
          Rules
        </div>

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition ${hoverTheme}`}
          onClick={() => toggleSection("security")}
        >
          <span>Security</span>
          {openSections.security ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
        {openSections.security && (
          <div className="ml-6 space-y-2">
            <div
              onClick={() => handleNavigation("/audit-trail")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-gray-200 ${hoverTheme}`}
            >
              Audit Trail
            </div>
            <div
              onClick={() => handleNavigation("/authorization")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-gray-200 ${hoverTheme}`}
            >
              Authorization
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition ${hoverTheme}`}
          onClick={() => toggleSection("dataAction")}
        >
          <span>Data/Action</span>
          {openSections.dataAction ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
        {openSections.dataAction && (
          <div className="ml-6 space-y-2">
            <div
              onClick={() => handleNavigation("/integrations")}
              className={`cursor-pointer px-4 py-2 rounded-md transition ${hoverTheme}`}
            >
              Integrations
            </div>
            <div
              onClick={() => handleNavigation("/data-sources")}
              className={`cursor-pointer px-4 py-2 rounded-md transition ${hoverTheme}`}
            >
              Data Sources
            </div>
            <div
              onClick={() => handleNavigation("/global-variables")}
              className={`cursor-pointer px-4 py-2 rounded-md transition ${hoverTheme}`}
            >
              Global Variables
            </div>
            <div
              onClick={() => handleNavigation("/attribute-library")}
              className={`cursor-pointer px-4 py-2 rounded-md transition ${hoverTheme}`}
            >
              Attribute Library
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition ${hoverTheme}`}
          onClick={() => toggleSection("home")}
        >
          <span>Home</span>
          {openSections.home ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>
        {openSections.home && (
          <div className="ml-6 space-y-2">
            <div
              onClick={() => handleNavigation("/workspace")}
              className={`cursor-pointer px-4 py-2 rounded-md transition ${hoverTheme}`}
            >
              Workspace
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
