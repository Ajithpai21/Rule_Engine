import React from "react";
import { Calendar, Clock, Settings } from "lucide-react";

// The component matches the TriggerSchedular UI but is fully read-only
const RuleSetScheduleViewer = ({ scheduleData, theme, isScheduled }) => {
  // Define theme-based styles exactly like TriggerSchedular
  const containerBg = theme === "dark" ? "border-gray-400" : "border-gray-300";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const labelColor = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const readOnlyBg = theme === "dark" ? "bg-gray-700" : "bg-gray-200";

  // Handle array of schedule data
  const scheduleInfo =
    Array.isArray(scheduleData) && scheduleData.length > 0
      ? scheduleData[0]
      : scheduleData;

  // If no schedule exists, show a placeholder
  if (!isScheduled || !scheduleInfo) {
    return (
      <div className="w-full h-full p-4">
        <div className={`text-xl font-semibold mb-4 ${textColor}`}>Trigger</div>
        <div
          className={`border rounded-lg p-4 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className={`text-center ${textColor}`}>
            No schedule configured for this rule set.
          </div>
        </div>
      </div>
    );
  }

  // Format the date from ISO format if present
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";

    // If it's already in a readable format, return as is
    if (dateString.includes(" ") || dateString.includes("-")) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  // Map API data_type to our scheduler type options
  const getSchedulerTypeLabel = (dataType) => {
    const typeMapping = {
      Minutes: "Every Minute",
      Hours: "Every Hour",
      Daily: "Daily",
      Weekly: "Weekly",
      Monthly: "Monthly",
      Cron: "Cron Expression",
    };
    return typeMapping[dataType] || dataType || "Not set";
  };

  // Generate configuration text based on data_type and data_value
  const getConfigurationText = () => {
    const dataType = scheduleInfo.data_type;
    const dataValue = scheduleInfo.data_value;
    const cronExpression = scheduleInfo.Cron_Expression;

    if (!dataType) return "No schedule type specified";

    switch (dataType) {
      case "Minutes":
        return `Every ${dataValue || 1} minute(s)`;
      case "Hours":
        return `Every ${dataValue || 1} hour(s)`;
      case "Daily":
        if (dataValue && dataValue.includes(":")) {
          return `Daily at ${dataValue}`;
        }
        return "Daily execution";
      case "Weekly":
        try {
          let days = dataValue;
          // Handle string format (could be JSON string or comma-separated)
          if (typeof dataValue === "string") {
            try {
              days = JSON.parse(dataValue);
            } catch {
              days = dataValue.split(",").map((d) => d.trim());
            }
          }
          // Ensure days is an array and has values
          if (Array.isArray(days) && days.length > 0) {
            return `Weekly on ${days.join(", ")}`;
          }
          return "Weekly (days not specified)";
        } catch {
          return String(dataValue);
        }
      case "Monthly":
        try {
          let dates = dataValue;
          // Handle string format (could be JSON string or comma-separated)
          if (typeof dataValue === "string") {
            try {
              dates = JSON.parse(dataValue);
            } catch {
              dates = dataValue
                .split(",")
                .map((d) => parseInt(d.trim()))
                .filter((d) => !isNaN(d));
            }
          }
          // Ensure dates is an array and has values
          if (Array.isArray(dates) && dates.length > 0) {
            return `Monthly on date(s): ${dates
              .sort((a, b) => a - b)
              .join(", ")}`;
          }
          return "Monthly (dates not specified)";
        } catch {
          return String(dataValue);
        }
      case "Cron":
        return cronExpression
          ? `Cron: ${cronExpression}`
          : "Cron expression not specified";
      default:
        return `${dataType} execution`;
    }
  };

  return (
    <div className="w-full h-full p-4">
      <div className={`text-xl font-semibold mb-4 ${textColor}`}>Trigger</div>
      <div
        className={`border rounded-lg p-4 space-y-4 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Start Date & Time */}
        <div className="space-y-2">
          <div className={`text-sm font-medium ${labelColor}`}>
            Start Date & Time
          </div>
          <div className={`${readOnlyBg} p-2 rounded-md ${textColor}`}>
            {formatDate(scheduleInfo.start_date)}
          </div>
        </div>

        {/* End Date & Time */}
        <div className="space-y-2">
          <div className={`text-sm font-medium ${labelColor}`}>
            End Date & Time
          </div>
          <div className={`${readOnlyBg} p-2 rounded-md ${textColor}`}>
            {formatDate(scheduleInfo.end_date)}
          </div>
        </div>

        {/* Scheduler Type */}
        <div className="space-y-2">
          <div className={`text-sm font-medium ${labelColor}`}>
            Schedular Type
          </div>
          <div className={`${readOnlyBg} p-2 rounded-md ${textColor}`}>
            {getSchedulerTypeLabel(scheduleInfo.data_type)}
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-2">
          <div className={`text-sm font-medium ${labelColor}`}>
            Configuration
          </div>
          <div className={`${readOnlyBg} p-2 rounded-md ${textColor}`}>
            {getConfigurationText()}
          </div>
        </div>

        {/* Next Scheduled Run */}
        {scheduleInfo.Next_Scheduled_Dates && (
          <div className="space-y-2">
            <div className={`text-sm font-medium ${labelColor}`}>
              Next Scheduled Run
            </div>
            <div className={`${readOnlyBg} p-2 rounded-md ${textColor}`}>
              {scheduleInfo.Next_Scheduled_Dates}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleSetScheduleViewer;
