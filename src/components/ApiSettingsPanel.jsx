import React, { useState, useEffect } from "react";
import { X, Copy, CheckSquare } from "lucide-react";
import { useSelector } from "react-redux";
import getUserDetails from "@/utils/getUserDetails";


const ApiSettingsPanel = ({ isOpen, onClose }) => {
  const userDetails = getUserDetails();
  const [apiDetails, setApiDetails] = useState(null);
  const [curlDetails, setCurlDetails] = useState(null);
  const [url, setUrl] = useState("");
  const theme = useSelector((state) => state.theme.mode);

  const [copied, setCopied] = useState({
    baseUrl: false,
    curlCommand: false,
    bodyParams: false,
  });

  // Define theme-based styles
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200";
  const headingColor = theme === "dark" ? "text-gray-100" : "text-gray-800";
  const panelBg = theme === "dark" ? "bg-gray-800" : "bg-gray-50";
  const buttonHoverBg =
    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const headerBg = theme === "dark" ? "bg-gray-900" : "bg-white";
  const contentBg = theme === "dark" ? "bg-gray-800" : "bg-gray-50";
  const codeBg = theme === "dark" ? "bg-gray-900" : "bg-gray-50";
  const codeTextColor = theme === "dark" ? "text-gray-200" : "text-gray-800";

  useEffect(() => {
    if (isOpen) {
      fetchApiDetails();
    }
  }, [isOpen]);

  const fetchApiDetails = async () => {
    try {
      const user = userDetails;
      const response = await fetch(
        `https://micro-solution-ruleengineprod.mfilterit.net/getAPIDetails?user=${user}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch API details");
      }

      const data = await response.json();
      console.log("API details fetched:", data);
      setApiDetails(data.Payload);
      setCurlDetails(data.Payload);
      setUrl(data.URL);
    } catch (error) {
      console.error("Error fetching API details:", error);
    }
  };

  const handleCopy = (type, text) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  // Prepare the payload based on rule type
  const preparePayload = () => {
    if (!apiDetails) return null;

    const ruleType = sessionStorage.getItem("rule_type");
    const typeId = sessionStorage.getItem("type_id");

    apiDetails.data.api_key = sessionStorage.getItem("api_key");
    apiDetails.data.type = ruleType;
    // Set the appropriate ID based on rule type
    if (ruleType === "Decision Table") {
      apiDetails.data.decision_id = typeId;
    } else if (ruleType === "Simple Rule") {
      apiDetails.data.rule_id = typeId;
    } else if (ruleType === "Rule Set") {
      apiDetails.data.ruleset_id = typeId;
    }

    return apiDetails;
  };

  const curlCommand = `curl -X "POST" "${url}"              -H 'Content-Type: application/json'      -d 
        ${JSON.stringify(curlDetails, null, 2)}`;

  const payload = preparePayload();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end overflow-hidden"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className={`${bgColor} ${textColor} w-full max-w-md h-full overflow-y-auto animate-slide-in-right`}
      >
        <div
          className={`p-4 border-b ${borderColor} flex justify-between items-center sticky top-0 ${headerBg} z-10`}
        >
          <h2 className={`text-xl font-semibold ${headingColor}`}>
            API Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${buttonHoverBg}`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className={`text-lg font-medium mb-2 ${headingColor}`}>
              Base URL
            </h3>
            <div
              className={`relative ${codeBg} rounded-md border ${borderColor} text-sm font-mono break-all overflow-x-auto space-x-3`}
            >
              <div className={`p-3 ${codeTextColor}`}>{url}</div>
              <button
                onClick={() => handleCopy("baseUrl", url)}
                className={`absolute top-2 right-2 p-1 rounded-md ${buttonHoverBg}`}
                title={copied.baseUrl ? "Copied!" : "Copy to clipboard"}
              >
                {copied.baseUrl ? (
                  <CheckSquare size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </section>

          <section>
            <h3 className={`text-lg font-medium mb-2 ${headingColor}`}>
              Body Params
            </h3>
            <div className="relative">
              <div
                className={`${codeBg} rounded-md border ${borderColor} p-3 overflow-x-auto`}
              >
                <pre className={`text-sm font-mono ${codeTextColor}`}>
                  {payload ? JSON.stringify(payload, null, 2) : "Loading..."}
                </pre>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    "bodyParams",
                    payload ? JSON.stringify(payload, null, 2) : ""
                  )
                }
                className={`absolute top-2 right-2 p-1 rounded-md ${buttonHoverBg}`}
                title={copied.bodyParams ? "Copied!" : "Copy to clipboard"}
              >
                {copied.bodyParams ? (
                  <CheckSquare size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </section>

          <section>
            <h3 className={`text-lg font-medium mb-2 ${headingColor}`}>
              How to Trigger API?
            </h3>
            <div className="relative">
              <div
                className={`${codeBg} rounded-md border ${borderColor} p-3 overflow-x-auto max-h-80`}
              >
                <pre
                  className={`text-sm font-mono whitespace-pre-wrap ${codeTextColor}`}
                >
                  {curlCommand}
                </pre>
              </div>
              <button
                onClick={() => handleCopy("curlCommand", curlCommand)}
                className={`absolute top-2 right-2 p-1 rounded-md ${buttonHoverBg}`}
                title={copied.curlCommand ? "Copied!" : "Copy to clipboard"}
              >
                {copied.curlCommand ? (
                  <CheckSquare size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApiSettingsPanel;
