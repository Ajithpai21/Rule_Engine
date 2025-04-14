import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const theme = useSelector((state) => state.theme.mode);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "", // This will be email
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!formData.username.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://mf-authorization.mfilterit.net/login",
        formData
      );

      if (response.data && response.data.message === "Login successful") {
        // Store the entire response in sessionStorage
        sessionStorage.setItem("token", JSON.stringify(response.data));

        toast.success("Login successful!");

        // Force reload to refresh Redux state
        setTimeout(() => {
          navigate("/rules");
          window.location.reload();
        }, 100);
      } else {
        toast.error(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gradient-to-r from-purple-900 to-purple-600">
      {/* Logo and Branding Section */}
      <div className="absolute top-0 left-0 m-8">
        <div className="flex items-center">
          <img
            src="https://infringementportalcontent.mfilterit.com/images/media/logos/mfilterit-white-logo.png"
            alt="mFilterIt Logo"
            className="h-10"
          />
        </div>
      </div>

      {/* Marketing Message */}
      <div className="hidden md:block w-1/2 text-white p-16">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold mb-6">
            Simplifying Compliance for Digital Brands
          </h2>
          <p className="text-xl mb-8">
            Our creative and content compliance solution, Tickr provides
            automated compliance regulation across creative and content to
            reduce errors and maximize efficiency with brand-compliant creative
            assets.
          </p>
          <button className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition-colors">
            Our Products
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full md:w-1/2 flex justify-center">
        <div
          className={`w-[90%] max-w-md rounded-lg shadow-2xl p-8 ${
            theme === "dark"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          <h1 className="text-2xl font-bold text-center mb-8">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Email or User Name"
                className={`w-full pl-10 pr-4 py-3 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className={`w-full pl-10 pr-12 py-3 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 cursor-pointer bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-md transition-colors duration-300 flex items-center justify-center ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Forgot Password & Sign Up */}
          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-purple-500 hover:text-purple-600 text-sm"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Password reset feature coming soon");
              }}
            >
              Forgot Password
            </a>

            <div className="mt-4 text-sm">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-purple-500 hover:text-purple-600 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Sign up feature coming soon");
                }}
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
