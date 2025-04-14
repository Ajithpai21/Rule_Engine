import React, { useEffect } from "react";

const TestResultsDisplay = ({ testResult, theme = "light" }) => {
  // Log whenever testResult prop changes
  useEffect(() => {
    console.log("TestResultsDisplay received testResult:", testResult);
  }, [testResult]);

  return (
    <div
      className={`
        p-4 rounded-lg 
        ${
          theme === "dark"
            ? "bg-gray-800 text-gray-200"
            : "bg-gray-100 text-gray-900"
        }
      `}
    >
      <pre className="whitespace-pre-wrap break-words text-sm">
        {JSON.stringify(testResult?.Data, null, 2)}
      </pre>
    </div>
  );
};

export default TestResultsDisplay;
