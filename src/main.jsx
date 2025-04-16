import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { store } from "./redux/store.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "react-redux";
import Navbar from "./components/Navbar.jsx";
import Rule from "./pages/Rule.jsx";
import GlobalAttribute from "./pages/GlobalAttribute.jsx";
import { useSelector } from "react-redux";
import NotFound from "./pages/NotFound";
import WorkspacePage from "./pages/WorkspacePage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DependancyMapping from "./components/DependancyMapping";
import AttributeLibrary from "./pages/AttributeLibrary";
import DataSource from "./pages/DataSource";
import AuditTrail from "./pages/AuditTrail";
import DataIntegration from "./pages/DataIntegration";
import Autherization from "./pages/Autherization";
import Login from "./pages/Login.jsx";
import { useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const queryClient = new QueryClient();
// const IDLE_TIMEOUT =  15 * 60 * 1000; // 2 minutes in milliseconds
const IDLE_TIMEOUT = 3 * 60 * 60 * 1000; // 2 minutes in milliseconds

// Auth component to protect routes
const RequireAuth = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const tokenExpiryTimer = useRef(null); // Timer for JWT expiry
  const idleTimer = useRef(null); // Timer for user inactivity

  // --- Logout Handler ---
  const handleLogout = useCallback(
    async (reason = "unknown") => {
      console.log(`Executing logout actions due to: ${reason}`);

      // --- Cleanup timers --- START
      // Clear token expiry timer
      if (tokenExpiryTimer.current) {
        clearTimeout(tokenExpiryTimer.current);
        tokenExpiryTimer.current = null;
        console.log("Cleared token expiry timer during logout.");
      }
      // Clear idle timer
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
        console.log("Cleared idle timer during logout.");
      }
      // Remove idle activity listeners immediately to prevent race conditions
      const activityEvents = [
        "mousemove",
        "mousedown",
        "keypress",
        "touchstart",
        "scroll",
      ];
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
      // --- Cleanup timers --- END

      // Retrieve token from session storage for the API call
      const tokenDataString = sessionStorage.getItem("token");
      let accessToken = null;
      let parsedTokenData = null;

      if (tokenDataString) {
        try {
          parsedTokenData = JSON.parse(tokenDataString);
          accessToken =
            parsedTokenData?.auth_response?.AuthenticationResult?.AccessToken;
        } catch (parseError) {
          console.error("Error parsing token data during logout:", parseError);
          toast.error("Failed to read session data for logout.");
          return;
        }
      }

      // Call the backend logout endpoint only if access token exists
      if (accessToken) {
        try {
          console.log("Calling signout API...");
          await axios.post("https://mf-authorization.mfilterit.net/signout", {
            access_token: accessToken,
          });
          console.log("Signout API call successful.");
          // Client-side logout actions only after successful API call
          console.log("Proceeding with client-side logout actions.");
          sessionStorage.clear();
          navigate("/");
        } catch (apiError) {
          console.error("Signout API call failed:", apiError);
          toast.error("Logout failed. Please try again.");
          return;
        }
      } else {
        // Fallback: No access token found, perform client-side logout only
        console.warn(
          "No access token found, performing client-side logout only."
        );
        sessionStorage.clear();
        navigate("/");
      }
    },
    [navigate]
  ); // Dependency: navigate
  // --- End Logout Handler ---

  // --- Idle Timer Logic ---
  const resetIdleTimer = useCallback(() => {
    // console.log('Resetting idle timer'); // Debug log
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      handleLogout("idle timeout");
    }, IDLE_TIMEOUT);
  }, [handleLogout]); // Dependency: handleLogout

  useEffect(() => {
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchstart",
      "scroll",
    ];
    console.log("Setting up idle timer and listeners.");
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetIdleTimer)
    );
    resetIdleTimer(); // Start the timer initially

    // Cleanup function for this effect
    return () => {
      console.log("Cleaning up idle timer and listeners.");
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
    };
  }, [resetIdleTimer]); // Dependency: resetIdleTimer
  // --- End Idle Timer Logic ---

  // --- Token Expiry Check Logic ---
  useEffect(() => {
    console.log("Setting up token expiry check.");
    const checkAuthAndExpiry = () => {
      const tokenDataString = sessionStorage.getItem("token");

      if (!tokenDataString) {
        if (location.pathname !== "/") {
          console.log("No token found, navigating to login.");
          // Don't call handleLogout here, as there's nothing to log out from
          navigate("/");
        }
        return;
      }

      try {
        const tokenData = JSON.parse(tokenDataString);
        const accessToken =
          tokenData?.auth_response?.AuthenticationResult?.AccessToken;

        if (!accessToken) {
          console.error("AccessToken not found in session storage data.");
          handleLogout("missing access token");
          return;
        }

        const decodedToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          console.log("Token expired, logging out.");
          handleLogout("token expired");
        } else {
          const expiresIn = (decodedToken.exp - currentTime) * 1000;
          console.log(
            `Token valid, scheduling expiry logout in ${
              expiresIn / 1000
            } seconds.`
          );

          // Clear previous expiry timer if exists
          if (tokenExpiryTimer.current) {
            clearTimeout(tokenExpiryTimer.current);
          }

          // Set new expiry timer
          tokenExpiryTimer.current = setTimeout(() => {
            console.log("Token expired via timer, logging out automatically.");
            handleLogout("scheduled token expiry");
          }, expiresIn);
        }
      } catch (error) {
        console.error("Error parsing token data or decoding token:", error);
        handleLogout("token parsing error");
      }
    };

    checkAuthAndExpiry();

    // Cleanup function for *this* effect (token expiry timer only)
    return () => {
      console.log("Cleaning up token expiry timer.");
      if (tokenExpiryTimer.current) {
        clearTimeout(tokenExpiryTimer.current);
        tokenExpiryTimer.current = null;
      }
    };
  }, [navigate, location, handleLogout]); // Dependencies for token check
  // --- End Token Expiry Check Logic ---

  return children;
};

const Layout = () => {
  const theme = useSelector((state) => state.theme.mode);

  return (
    <div
      className={`flex flex-col  overflow-auto [&::-webkit-scrollbar]:hidden min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Navbar />
      <hr
        className={`border ${
          theme === "dark" ? "border-white" : "border-black"
        }`}
      />
      <div className="flex-1">
        <Outlet />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === "dark" ? "dark" : "light"}
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        path: "/rules",
        element: <Rule />,
      },
      {
        path: "/global-variables",
        element: <GlobalAttribute />,
      },
      {
        path: "/workspace",
        element: <WorkspacePage />,
      },
      {
        path: "/test",
        element: <DependancyMapping />,
      },
      {
        path: "/attribute-library",
        element: <AttributeLibrary />,
      },
      {
        path: "/data-sources",
        element: <DataSource />,
      },
      {
        path: "/audit-trail",
        element: <AuditTrail />,
      },
      {
        path: "/integrations",
        element: <DataIntegration />,
      },
      {
        path: "/authorization",
        element: <Autherization />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </Provider>
);
