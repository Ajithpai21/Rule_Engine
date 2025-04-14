import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Copy, Check } from "lucide-react";

const Autherization = () => {
  const theme = useSelector((state) => state.theme.mode);
  const api_key = useSelector((state) => state.apiDetails.api_key);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div className="w-full h-[88.8vh] px-16 py-20 flex justify-center items-center">
      <div
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[90%] h-full rounded-md shadow-lg p-4 ${
          theme === "dark"
            ? "bg-gray-900 text-white  shadow-blue-500"
            : "bg-gray-100 text-black  shadow-gray-400"
        }`}
      >
        <div className="name  font-bold text-2xl">Credentials</div>
        <hr
          className={`border-1 ${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />
        <div className="main p-2 space-y-2">
          <div className="label text-xl font-bold">API Keys</div>
          <p className="text-sm">
            API keys are used for identification and authorization to systems
            and services you might wish to access.
          </p>
          <div className="input w-full py-3 space-x-4 flex">
            <input
              value={"API Key"}
              disabled={true}
              className={`w-[30%] p-2 rounded-md ${
                theme === "dark" ? "bg-gray-600" : "bg-gray-300"
              }`}
              type="text"
            />
            <input
              value={api_key}
              disabled={true}
              className={`w-[60%]  p-2 rounded-md ${
                theme === "dark" ? " bg-gray-600" : " bg-gray-300"
              }`}
              type="text"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
            >
              {copied ? (
                <>
                  <Check size={18} />
                </>
              ) : (
                <>
                  <Copy size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Autherization;
