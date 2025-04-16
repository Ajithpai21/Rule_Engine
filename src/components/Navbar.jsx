import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../redux/themeDetails/themeDetailsSlice";
import Dropdown from "./Dropdown";
import Sidebar from "./Sidebar";
import { LogOut, Sun, Moon, Menu } from "lucide-react";
import { fetchAPI } from "@/redux/apiDetails/apiDetailsSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.theme.mode);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [authState, setAuthState] = useState(!!sessionStorage.getItem("token"));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const hoverClass =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300 text-black";

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Check for authentication changes
  useEffect(() => {
    const checkAuthState = () => {
      const tokenExists = !!sessionStorage.getItem("token");
      if (tokenExists !== authState) {
        setAuthState(tokenExists);
      }
    };

    // Check immediately
    checkAuthState();

    // Set up interval to check periodically
    const intervalId = setInterval(checkAuthState, 1000);

    return () => clearInterval(intervalId);
  }, [authState]);

  // Fetch API key when auth changes
  useEffect(() => {
    if (authState) {
      dispatch(fetchAPI());
    }

    sessionStorage.removeItem("rule_type");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("description");
    sessionStorage.removeItem("type_id");
  }, [dispatch, authState]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Get the IdToken from sessionStorage
      const accessToken = sessionStorage.getItem("token");
      if (accessToken) {
        const response = await axios.post(
          "https://mf-authorization.mfilterit.net/signout",
          {
            access_token: accessToken,
          }
        );

        if (response.data && response.status === 200) {
          toast.success("Logged out successfully");
          sessionStorage.clear();
          navigate("/");
        } else {
          throw new Error("Logout failed: Unexpected response");
        }
      } else {
        throw new Error("Access token not found");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Please try again later.");
    } finally {
      // Only reset loading state
      setIsLoggingOut(false);
    }
  };

  const navbarClass =
    theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  return (
    <>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`flex px-6 py-4 justify-between w-full ${navbarClass}`}>
        <div className="box flex gap-5 items-center">
          <button onClick={toggleSidebar} className="text-xl cursor-pointer">
            <Menu size={24} />
          </button>

          <div className="font-bold text-3xl">Rule Engine</div>
          <Dropdown />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleTheme())}
            className={`px-4 py-2 rounded-sm border border-gray-500 ${hoverClass} flex items-center gap-2 font-bold cursor-pointer`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`px-6 rounded-sm text-sm py-1.5 font-bold text-center cursor-pointer border border-gray-500 ${hoverClass} flex items-center gap-1 ${
              isLoggingOut ? "opacity-50" : ""
            }`}
          >
            <LogOut size={14} /> {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
