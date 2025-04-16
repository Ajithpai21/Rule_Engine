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
      className={`fixed top-0 left-0 h-full w-72 shadow-lg transition-transform duration-300 ease-in-out z-50 flex flex-col text-white bg-[rgb(83,0,147)] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } `}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white flex-shrink-0">
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
          className="p-2 hover:bg-white/20 rounded cursor-pointer"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-grow p-5 space-y-3 overflow-y-auto custom-scrollbar">
        <div
          onClick={() => handleNavigation("/rules")}
          className={`cursor-pointer px-4 py-2 rounded-md font-medium transition hover:bg-white/20`}
        >
          Rules
        </div>

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition hover:bg-white/20`}
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
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Audit Trail
            </div>
            <div
              onClick={() => handleNavigation("/authorization")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Authorization
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition hover:bg-white/20`}
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
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Integrations
            </div>
            <div
              onClick={() => handleNavigation("/data-sources")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Data Sources
            </div>
            <div
              onClick={() => handleNavigation("/global-variables")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Global Variables
            </div>
            <div
              onClick={() => handleNavigation("/attribute-library")}
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Attribute Library
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-between cursor-pointer px-4 py-2 rounded-md font-medium transition hover:bg-white/20`}
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
              className={`cursor-pointer px-4 py-2 rounded-md transition hover:bg-white/10`}
            >
              Workspace
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 flex-shrink-0 border-t border-white">
        <img
          src="https://infringementportalcontent.mfilterit.com/images/media/logos/mfilterit-white-logo.png"
          alt="mFilterIt Logo"
          className="w-3/4 mx-auto"
        />
      </div>
    </div>
  );
};

export default Sidebar;
