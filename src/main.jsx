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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DependancyMapping from "./components/DependancyMapping";
import AttributeLibrary from "./pages/AttributeLibrary";
import DataSource from "./pages/DataSource";
import AuditTrail from "./pages/AuditTrail";
import DataIntegration from "./pages/DataIntegration";
import Autherization from "./pages/Autherization";
import Login from "./pages/Login.jsx";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Auth component to protect routes
const RequireAuth = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("token");
      if (!token && location.pathname !== "/") {
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate, location]);

  return children;
};

const Layout = () => {
  const theme = useSelector((state) => state.theme.mode);

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex-shrink-0">
        <Navbar />
        <hr
          className={`border ${
            theme === "dark" ? "border-white" : "border-black"
          }`}
        />
      </div>
      <div className="flex-1 overflow-auto">
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
  // <StrictMode>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </Provider>
  // </StrictMode>
);
