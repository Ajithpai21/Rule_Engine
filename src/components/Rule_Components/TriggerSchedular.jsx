import React, { useState, useEffect } from "react";
import { Copy, Check, Settings } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ApiSettingsPanel from "../ApiSettingsPanel";
import getUserDetails from "@/utils/getUserDetails";

const typeOptions = [
  { value: "select", label: "Select Schedular Type" },
  { value: "minute", label: "Every Minute" },
  { value: "hour", label: "Every Hour" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "cron", label: "Cron" },
];

// Default values for each scheduler type
const defaultSchedularConfig = {
  select: null, // Add a default value for "select" type
  minute: 1,
  hour: 1,
  day: { hour: 8, minute: 0 },
  week: { days: [] },
  month: { dates: [] },
  cron: { minute: "*", hour: "*", day: "*", month: "*", weekday: "*" },
};

const weekDays = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

// Helper data for cron fields
const cronConfig = [
  {
    name: "minute",
    label: "Minute",
    min: 0,
    max: 59,
    examples: ["0", "30", "*/5", "0,30"],
  },
  {
    name: "hour",
    label: "Hour",
    min: 0,
    max: 23,
    examples: ["0", "12", "*/2", "8-17"],
  },
  {
    name: "day",
    label: "Day of month",
    min: 1,
    max: 31,
    examples: ["1", "15", "1-5", "*"],
  },
  {
    name: "month",
    label: "Month",
    min: 1,
    max: 12,
    examples: ["1", "JAN", "*/3", "JAN-MAR"],
  },
  {
    name: "weekday",
    label: "Day of week",
    min: 0,
    max: 6,
    examples: ["0", "SUN", "MON-FRI", "*"],
  },
];

// Valid cron expressions should match these patterns
const cronPatterns = {
  single: /^(\d+)$/, // Single number (e.g. 5)
  range: /^(\d+)-(\d+)$/, // Range (e.g. 1-5)
  list: /^(\d+,)+\d+$/, // List (e.g. 1,3,5)
  step: /^\*\/(\d+)$/, // Step (e.g. */5)
  wildcard: /^\*$/, // Wildcard (*)
  dayName: /^(MON|TUE|WED|THU|FRI|SAT|SUN)(-)(MON|TUE|WED|THU|FRI|SAT|SUN)$/i, // Day name range (e.g. MON-FRI)
  monthName:
    /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(-)(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i, // Month name range
  singleDayName: /^(MON|TUE|WED|THU|FRI|SAT|SUN)$/i, // Single day name
  singleMonthName: /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/i, // Single month name
};

const TriggerSchedular = ({
  theme,
  workspace,
  workspace_id,
  isSaved,
  readOnly = false,
}) => {
  const [schedularType, setSchedularType] = useState("select");
  const [copied, setCopied] = useState(false);
  const [schedularConfig, setSchedularConfig] = useState({
    ...defaultSchedularConfig,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [existingSchedule, setExistingSchedule] = useState(null);
  const [thenActions, setThenActions] = useState([]);
  const [isSchedulerEnabled, setIsSchedulerEnabled] = useState(false);
  const [isApiSettingsPanelOpen, setIsApiSettingsPanelOpen] = useState(false);

  // Define theme-based styles
  const containerBg = theme === "dark" ? "border-gray-400" : "border-gray-300";
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const labelColor = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const copyBtnBg = theme === "dark" ? "bg-gray-400" : "bg-gray-300";
  const copyBtnText = theme === "dark" ? "text-white" : "text-gray-800";
  const hoverBg = theme === "dark" ? "hover:bg-blue-500" : "hover:bg-blue-400";
  const buttonPrimaryBg = theme === "dark" ? "bg-blue-600" : "bg-blue-500";
  const buttonPrimaryHover =
    theme === "dark" ? "hover:bg-blue-700" : "hover:bg-blue-600";
  const disabledBg = theme === "dark" ? "bg-gray-500" : "bg-gray-400";
  const disabledText = theme === "dark" ? "text-gray-300" : "text-gray-500";
  const weekDaySelectedBg = theme === "dark" ? "bg-blue-600" : "bg-blue-500";
  const weekDayUnselectedBg = theme === "dark" ? "bg-gray-700" : "bg-gray-200";
  const weekDaySelectedText = "text-white";
  const weekDayUnselectedText =
    theme === "dark" ? "text-gray-300" : "text-gray-700";
  const dayHeaderText = theme === "dark" ? "text-gray-400" : "text-gray-600";
  const selectedDatesText =
    theme === "dark" ? "text-gray-400" : "text-gray-600";
  const cronExpressionBg = theme === "dark" ? "bg-gray-800" : "bg-gray-200";
  const cronExpressionText =
    theme === "dark" ? "text-green-400" : "text-green-600";
  const cronInfoText = theme === "dark" ? "text-gray-400" : "text-gray-600";
  const loadingSpinnerBorder = "border-blue-500";
  const loadingText = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const readOnlyBg = theme === "dark" ? "bg-gray-700" : "bg-gray-200";

  const api =
    "https://microsystem-ruleengine-uat.mfilterit.net/api/rules/execute";

  // Fetch existing schedule data on component mount
  useEffect(() => {
    const fetchExistingSchedule = async () => {
      try {
        setIsLoading(true);

        // Get values from session storage
        const user = getUserDetails() || "";
        const rule_type = sessionStorage.getItem("rule_type") || "";
        const type_id = sessionStorage.getItem("type_id") || "";

        console.log("Fetching schedule data with:", {
          user,
          workspace,
          workspace_id,
          rule_type,
          rule_id: type_id,
        });

        if (!user || !workspace || !workspace_id || !rule_type || !type_id) {
          console.log("Missing required parameters for fetching schedule data");
          setIsLoading(false);
          return;
        }

        // Try payload with type_id
        const payload = {
          user,
          workspace,
          workspace_id,
          rule_type,
          type_id,
        };

        console.log("Sending payload:", payload);

        const response = await axios.post(
          "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/getTriggerScheduleData",
          payload
        );

        console.log("API response:", response.data);

        // Check if the response is successful and contains valid data
        if (response.data && response.data.status === "Success") {
          // Check if data is an array or direct object
          if (
            response.data.data &&
            Array.isArray(response.data.data) &&
            response.data.data.length > 0
          ) {
            // Data is in array format
            const scheduleData = response.data.data[0];
            console.log("Schedule data from array:", scheduleData);

            // Adapt the data format
            const adaptedData = {
              start_date: scheduleData.start_date,
              end_date: scheduleData.end_date,
              data_type: scheduleData.data_type,
              value: scheduleData.data_value,
              cron_expression: scheduleData.Cron_Expression,
              scheduler: scheduleData.scheduler,
            };

            setExistingSchedule(adaptedData);
            populateFormWithExistingData(adaptedData);
          } else if (
            response.data.data &&
            response.data.data.start_date &&
            response.data.data.end_date &&
            response.data.data.data_type
          ) {
            // Data is direct object
            setExistingSchedule(response.data.data);
            populateFormWithExistingData(response.data.data);
          } else {
            console.log(
              "Response data format is not as expected:",
              response.data
            );
            setExistingSchedule(null);
          }
        } else {
          // If data is invalid, reset existingSchedule
          console.log("Invalid API response:", response.data);
          setExistingSchedule(null);
        }
      } catch (error) {
        console.error("Error fetching existing schedule data:", error);
        setExistingSchedule(null); // Reset in case of error
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingSchedule();
  }, [workspace, workspace_id]);

  // Function to populate form fields with existing data
  const populateFormWithExistingData = (data) => {
    if (!data) return;
    console.log("Populating form with data:", data);

    // Set scheduler enabled state if available
    if (data.scheduler !== undefined) {
      console.log(`Setting scheduler enabled to: ${data.scheduler}`);
      setIsSchedulerEnabled(!!data.scheduler);
    }

    // Convert API date format to format needed for datetime-local input
    const convertApiDateToInputFormat = (apiDateString) => {
      if (!apiDateString) return "";

      // Handle ISO format (2025-03-18T13:52:00)
      if (apiDateString.includes("T")) {
        return apiDateString.substring(0, 16); // Trim to YYYY-MM-DDThh:mm
      }

      // API date format: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDThh:mm"
      const dateTime = apiDateString.split(" ");
      if (dateTime.length !== 2) return "";

      const [date, time] = dateTime;
      const timeParts = time.split(":");
      if (timeParts.length < 2) return "";

      return `${date}T${timeParts[0]}:${timeParts[1]}`;
    };

    // Set start and end dates
    setStartDate(convertApiDateToInputFormat(data.start_date));
    setEndDate(convertApiDateToInputFormat(data.end_date));

    // Set type and corresponding configuration
    if (data.data_type) {
      const typeMapping = {
        Minutes: "minute",
        Hours: "hour",
        Daily: "day",
        Weekly: "week",
        Monthly: "month",
        Cron: "cron",
      };

      const mappedType = typeMapping[data.data_type] || "select";
      setSchedularType(mappedType);
      console.log(
        `Setting schedular type to ${mappedType} based on ${data.data_type}`
      );

      // Get value from either value or data_value field
      const valueToUse = data.value || data.data_value;
      console.log(
        `Using value: ${valueToUse} from fields value: ${data.value}, data_value: ${data.data_value}`
      );

      // Set specific configuration based on type
      let updatedConfig = { ...schedularConfig };

      switch (mappedType) {
        case "minute":
          updatedConfig.minute = parseInt(valueToUse) || 1;
          break;
        case "hour":
          updatedConfig.hour = parseInt(valueToUse) || 1;
          break;
        case "day":
          if (valueToUse && valueToUse.includes(":")) {
            const [hour, minute] = valueToUse
              .split(":")
              .map((v) => parseInt(v));
            updatedConfig.day = { hour: hour || 0, minute: minute || 0 };
          }
          break;
        case "week":
          try {
            // Data could be array or string representation of array
            let weekDays = valueToUse;
            if (typeof valueToUse === "string") {
              try {
                weekDays = JSON.parse(valueToUse);
              } catch (e) {
                // If can't parse as JSON, try comma-separated string
                weekDays = valueToUse.split(",").map((d) => d.trim());
              }
            }
            updatedConfig.week = {
              days: Array.isArray(weekDays) ? weekDays : [],
            };
          } catch (error) {
            console.error("Error parsing week data:", error);
            updatedConfig.week = { days: [] };
          }
          break;
        case "month":
          try {
            // Data could be array or string representation of array
            let dates = valueToUse;
            if (typeof valueToUse === "string") {
              try {
                dates = JSON.parse(valueToUse);
              } catch (e) {
                // If can't parse as JSON, try comma-separated string
                dates = valueToUse.split(",").map((d) => parseInt(d.trim()));
              }
            }
            updatedConfig.month = { dates: Array.isArray(dates) ? dates : [] };
          } catch (error) {
            console.error("Error parsing month data:", error);
            updatedConfig.month = { dates: [] };
          }
          break;
        case "cron":
          // Handle cron expression data - might be directly in value or in a separate field
          const cronExpression =
            data.cron_expression || data.Cron_Expression || valueToUse;
          console.log(`Using cron expression: ${cronExpression}`);
          if (cronExpression) {
            const cronParts = cronExpression.split(" ");
            if (cronParts.length >= 5) {
              updatedConfig.cron = {
                minute: cronParts[0],
                hour: cronParts[1],
                day: cronParts[2],
                month: cronParts[3],
                weekday: cronParts[4],
              };
            }
          }
          break;
        default:
          break;
      }

      console.log("Setting schedular config:", updatedConfig);
      setSchedularConfig(updatedConfig);
    }
  };

  // Get days in current month for the calendar
  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Last day of the month gives us the number of days in the month
    return new Date(year, month + 1, 0).getDate();
  };

  // Current month name for display
  const getCurrentMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  // Set default start date and time to now and end date to 7 days later
  // Only set default dates if no existing data was loaded
  useEffect(() => {
    if (!isLoading && !existingSchedule) {
      // Set start and end dates to empty
      setStartDate("");
      setEndDate("");
    }
  }, [isLoading, existingSchedule]);

  // Validate form to enable/disable the create button
  useEffect(() => {
    // Check if we have valid selections
    const isValid =
      startDate &&
      endDate &&
      schedularType !== "select" &&
      (schedularType === "minute" ||
        schedularType === "hour" ||
        (schedularType === "day" && schedularConfig.day) ||
        (schedularType === "week" &&
          schedularConfig.week.days &&
          schedularConfig.week.days.length > 0) ||
        (schedularType === "month" &&
          schedularConfig.month.dates &&
          schedularConfig.month.dates.length > 0) ||
        (schedularType === "cron" && schedularConfig.cron));

    setIsButtonDisabled(!isValid);
  }, [startDate, endDate, schedularType, schedularConfig]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(api);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);

    // If end date is now before start date, update end date
    if (endDate && new Date(e.target.value) > new Date(endDate)) {
      const newEndDate = new Date(e.target.value);
      newEndDate.setDate(newEndDate.getDate() + 7);

      const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setEndDate(formatDateForInput(newEndDate));
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setSchedularType(newType);

    // If it's the "select" type, we don't need to do anything special with the config
    if (newType === "select") {
      return;
    }

    // Reset the config for the selected type to default values
    setSchedularConfig((prev) => ({
      ...prev,
      [newType]: JSON.parse(JSON.stringify(defaultSchedularConfig[newType])),
    }));
  };

  const handleCreateSchedule = async () => {
    try {
      // Get values from session storage
      const user = getUserDetails() || "";
      const rule_type = sessionStorage.getItem("rule_type") || "";
      const type_id = sessionStorage.getItem("type_id") || "";
      const api_key = sessionStorage.getItem("api_key") || ""; // Get API key from session storage with fallback

      // Determine which ID field to populate based on rule_type
      let rule_id = "";
      let ruleset_id = "";
      let decision_id = "";

      if (rule_type === "Simple Rule") {
        rule_id = type_id;
      } else if (rule_type === "Rule Set") {
        ruleset_id = type_id;
      } else if (rule_type === "Decision Table") {
        decision_id = type_id;
      }

      // Format dates from ISO format to the required format "YYYY-MM-DD HH:MM:SS"
      const formatDateForApi = (isoDateString) => {
        const date = new Date(isoDateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      // Generate value based on scheduler type
      let value = "";

      switch (schedularType) {
        case "minute":
          value = String(schedularConfig.minute || 1);
          break;
        case "hour":
          value = String(schedularConfig.hour || 1);
          break;
        case "day":
          const hour = schedularConfig.day.hour || 0;
          const minute = schedularConfig.day.minute || 0;
          value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(
            2,
            "0"
          )}`;
          break;
        case "week":
          value = schedularConfig.week.days || [];
          break;
        case "month":
          value = schedularConfig.month.dates || [];
          break;
        case "cron":
          value = getCronExpression();
          break;
        default:
          value = "";
      }

      // Check for required fields
      if (
        !user ||
        !workspace ||
        !workspace_id ||
        !rule_type ||
        !type_id ||
        !startDate ||
        !endDate ||
        !schedularType ||
        !api_key
      ) {
        toast.error("Required fields are missing! Please check all inputs.");
        return;
      }

      // Map schedularType to data_type required by API
      const getDataType = (type) => {
        const typeMap = {
          minute: "Minutes",
          hour: "Hours",
          day: "Daily",
          week: "Weekly",
          month: "Monthly",
          cron: "Cron",
        };
        return typeMap[type] || type;
      };

      // Prepare the payload
      const payload = {
        data: {
          api_key,
          user,
          workspace,
          workspace_id,
          rule_type,
          rule_id,
          ruleset_id,
          decision_id,
          start_date: formatDateForApi(startDate),
          end_date: formatDateForApi(endDate),
          description: "",
          data_type: getDataType(schedularType),
          value,
        },
      };

      // Make the API call
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/triggerSchedule",
        payload
      );

      // Handle the API response
      if (response.data) {
        if (response.data.status === "Success") {
          toast.success(
            response.data.message || "Schedule created successfully!"
          );

          // Update the existingSchedule state after successful update
          setExistingSchedule({
            ...payload.data,
            data_type: getDataType(schedularType),
            value,
          });
        } else {
          toast.error(response.data.message || "Failed to create schedule!");
        }
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while creating the schedule."
      );
    }
  };

  const handleConfigChange = (type, field, value) => {
    // Don't update state for 'select' type
    if (type === "select") return;

    if (type === "minute" || type === "hour") {
      setSchedularConfig({
        ...schedularConfig,
        [type]: value,
      });
    } else {
      setSchedularConfig({
        ...schedularConfig,
        [type]: {
          ...schedularConfig[type],
          [field]: value,
        },
      });
    }
  };

  // Validate a cron expression part
  const validateCronPart = (value, field) => {
    // Allow empty strings which will default to "*"
    if (!value || value === "*") return true;

    // Check for valid patterns
    if (cronPatterns.single.test(value)) {
      const num = parseInt(value);
      const config = cronConfig.find((c) => c.name === field);
      return num >= config.min && num <= config.max;
    }

    if (cronPatterns.range.test(value)) return true;
    if (cronPatterns.list.test(value)) return true;
    if (cronPatterns.step.test(value)) return true;

    // Check day and month name patterns for the appropriate fields
    if (
      field === "weekday" &&
      (cronPatterns.singleDayName.test(value) ||
        cronPatterns.dayName.test(value))
    )
      return true;
    if (
      field === "month" &&
      (cronPatterns.singleMonthName.test(value) ||
        cronPatterns.monthName.test(value))
    )
      return true;

    return false;
  };

  // Handle cron field input
  const handleCronInput = (field, value) => {
    // Clean up the input to prevent invalid formats like "*5"
    let cleanValue = value.trim();

    // Remove any space after *
    cleanValue = cleanValue.replace(/\*\s+/, "*");

    // If starts with * and has more characters (like "*5"), and it's not a valid */n format
    if (
      cleanValue.startsWith("*") &&
      cleanValue.length > 1 &&
      !cleanValue.startsWith("*/")
    ) {
      cleanValue = cleanValue.substring(1); // Remove the leading *
    }

    // Update the value in state
    handleConfigChange("cron", field, cleanValue || "*");
  };

  const handleWeekDayToggle = (day) => {
    const currentDays = schedularConfig.week.days || [];
    let newDays;

    if (currentDays.includes(day)) {
      // Remove day if already selected
      newDays = currentDays.filter((d) => d !== day);
    } else {
      // Add day if not selected
      newDays = [...currentDays, day];
    }

    handleConfigChange("week", "days", newDays);
  };

  const handleMonthDateToggle = (date) => {
    const currentDates = schedularConfig.month.dates || [];
    let newDates;

    if (currentDates.includes(date)) {
      // Remove date if already selected
      newDates = currentDates.filter((d) => d !== date);
    } else {
      // Add date if not selected
      newDates = [...currentDates, date];
    }

    handleConfigChange("month", "dates", newDates);
  };

  // Handle changes to number inputs, allowing clearing
  const handleNumberInput = (type, field, value) => {
    // If the input is empty, keep it as empty string in the state
    if (value === "") {
      if (field) {
        handleConfigChange(type, field, "");
      } else {
        handleConfigChange(type, null, "");
      }
    } else {
      // Only convert to number if it's not an empty string
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        if (field) {
          handleConfigChange(type, field, numValue);
        } else {
          handleConfigChange(type, null, numValue);
        }
      }
    }
  };

  // Generate the full cron expression from individual parts
  const getCronExpression = () => {
    // Make sure we have a valid cron object with all fields
    if (!schedularConfig.cron) {
      setSchedularConfig((prev) => ({
        ...prev,
        cron: { ...defaultSchedularConfig.cron },
      }));
      return "* * * * *";
    }

    const { minute, hour, day, month, weekday } = schedularConfig.cron;
    // Ensure each field has a value, defaulting to "*" if undefined or empty
    return `${minute || "*"} ${hour || "*"} ${day || "*"} ${month || "*"} ${
      weekday || "*"
    }`;
  };

  // Modified renderMonthCalendar method to use theme-based styling
  const renderMonthCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const dateButtons = [];

    for (let i = 1; i <= daysInMonth; i++) {
      dateButtons.push(
        <div
          key={i}
          onClick={() => handleMonthDateToggle(i)}
          className={`
            p-2 border rounded-md cursor-pointer text-center 
            ${
              (schedularConfig.month.dates || []).includes(i)
                ? `${weekDaySelectedBg} ${weekDaySelectedText} border-blue-700`
                : `${weekDayUnselectedBg} ${weekDayUnselectedText} ${borderColor}`
            }
            ${hoverBg} hover:border-blue-600 transition-colors
          `}
        >
          {i}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-2">{dateButtons}</div>;
  };

  // Ensure we have a valid cron object on component mount
  useEffect(() => {
    if (
      schedularType === "cron" &&
      (!schedularConfig.cron || typeof schedularConfig.cron !== "object")
    ) {
      setSchedularConfig((prev) => ({
        ...prev,
        cron: { ...defaultSchedularConfig.cron },
      }));
    }
  }, [schedularType]);

  const renderSchedularConfig = () => {
    // Explicitly return null for the "select" type
    if (schedularType === "select") {
      return null;
    }

    switch (schedularType) {
      case "minute":
        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm ${labelColor}`}>Run every</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={schedularConfig.minute}
                onChange={(e) =>
                  handleNumberInput("minute", null, e.target.value)
                }
                className={`${inputBg} p-2 w-24 rounded-md ${textColor} ${borderColor}`}
              />
              <span className={textColor}>minute(s)</span>
            </div>
          </div>
        );
      case "hour":
        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm ${labelColor}`}>Run every</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="24"
                value={schedularConfig.hour}
                onChange={(e) =>
                  handleNumberInput("hour", null, e.target.value)
                }
                className={`${inputBg} p-2 w-24 rounded-md ${textColor} ${borderColor}`}
              />
              <span className={textColor}>hour(s)</span>
            </div>
          </div>
        );
      case "day":
        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm ${labelColor}`}>Run daily at</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={schedularConfig.day.hour}
                onChange={(e) =>
                  handleNumberInput("day", "hour", e.target.value)
                }
                className={`${inputBg} p-2 w-24 rounded-md ${textColor} ${borderColor}`}
              />
              <span className={textColor}>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={schedularConfig.day.minute}
                onChange={(e) =>
                  handleNumberInput("day", "minute", e.target.value)
                }
                className={`${inputBg} p-2 w-24 rounded-md ${textColor} ${borderColor}`}
              />
            </div>
          </div>
        );
      case "week":
        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm mb-2 ${labelColor}`}>
              Select days of the week
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {weekDays.map((day) => (
                <div
                  key={day.value}
                  onClick={() => handleWeekDayToggle(day.value)}
                  className={`
                    p-2 border rounded-md cursor-pointer text-center 
                    ${
                      (schedularConfig.week.days || []).includes(day.value)
                        ? `${weekDaySelectedBg} ${weekDaySelectedText} border-blue-700`
                        : `${weekDayUnselectedBg} ${weekDayUnselectedText} ${borderColor}`
                    }
                    ${hoverBg} hover:border-blue-600 transition-colors
                  `}
                >
                  {day.label}
                </div>
              ))}
            </div>
          </div>
        );
      case "month":
        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm mb-2 ${labelColor}`}>
              Select dates in {getCurrentMonthName()}
            </div>
            <div className="mb-2">
              <div className="grid grid-cols-7 gap-2 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div
                    key={index}
                    className={`text-center ${dayHeaderText} text-xs font-bold`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: getDaysInMonth() }, (_, i) => i + 1).map(
                  (date) => (
                    <div
                      key={date}
                      onClick={() => handleMonthDateToggle(date)}
                      className={`
                      p-2 border rounded-md cursor-pointer text-center 
                      ${
                        (schedularConfig.month.dates || []).includes(date)
                          ? `${weekDaySelectedBg} ${weekDaySelectedText} border-blue-700`
                          : `${weekDayUnselectedBg} ${weekDayUnselectedText} ${borderColor}`
                      }
                      ${hoverBg} hover:border-blue-600 transition-colors
                    `}
                    >
                      {date}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className={`text-xs ${selectedDatesText} mt-2`}>
              Selected dates:{" "}
              {(schedularConfig.month.dates || [])
                .sort((a, b) => a - b)
                .join(", ") || "None"}
            </div>
          </div>
        );
      case "cron":
        // Ensure we have a valid cron object
        const cronObj = schedularConfig.cron || defaultSchedularConfig.cron;

        return (
          <div className="inptBox flex flex-col gap-2 px-2 w-full">
            <div className={`label text-sm ${labelColor}`}>Cron Expression</div>
            <div className="flex flex-col gap-4 mt-2">
              {cronConfig.map((field) => (
                <div key={field.name} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={`text-sm ${labelColor}`}>
                      {field.label}
                    </label>
                    <span className={`text-xs ${cronInfoText}`}>
                      e.g., {field.examples.join(", ")}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={cronObj[field.name] || "*"}
                    onChange={(e) =>
                      handleCronInput(field.name, e.target.value)
                    }
                    placeholder={`${field.min}-${field.max} or *`}
                    className={`${inputBg} p-2 rounded-md ${textColor} ${
                      cronObj[field.name] &&
                      !validateCronPart(cronObj[field.name], field.name)
                        ? "border-red-500 border-2"
                        : borderColor
                    }`}
                  />
                  {cronObj[field.name] &&
                    !validateCronPart(cronObj[field.name], field.name) && (
                      <div className="text-xs text-red-500 mt-1">
                        Invalid format. Try: {field.examples.join(", ")}
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div className={`mt-4 p-3 ${cronExpressionBg} rounded-md`}>
              <div className={`text-sm mb-1 ${labelColor}`}>
                Generated cron expression:
              </div>
              <div className={`font-mono text-sm ${cronExpressionText}`}>
                {getCronExpression()}
              </div>
            </div>

            <div className={`text-xs ${cronInfoText} mt-2`}>
              <div>Format: minute hour day month weekday</div>
              <div>
                * = any value, */n = every n, n-m = range, n,m = specific values
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Add delete action function
  const handleDeleteAction = (id) => {
    setThenActions(thenActions.filter((action) => action.id !== id));
  };

  // Add function to create a new action (for testing purposes)
  const addAction = () => {
    const newAction = {
      id: Date.now(),
      name: `Action ${thenActions.length + 1}`,
      value: `Value ${thenActions.length + 1}`,
    };
    setThenActions([...thenActions, newAction]);
  };

  // Toggle API Settings panel
  const toggleApiSettingsPanel = () => {
    setIsApiSettingsPanelOpen(!isApiSettingsPanelOpen);
  };

  return (
    <div className="triggerSchedular w-full h-[80%] p-2 flex flex-col">
      {isLoading ? (
        <div className={`flex justify-center items-center h-full ${textColor}`}>
          <div
            className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${loadingSpinnerBorder}`}
          ></div>
          <p className={`ml-2 ${loadingText}`}>Loading schedule data...</p>
        </div>
      ) : (
        <div
          className={`border-2 ${containerBg} flex-1 rounded-md p-2 space-y-3 flex flex-col min-h-0`}
        >
          <div className={`label text-lg px-2 ${labelColor}`}>Trigger</div>

          {/* Display Actions List if there are actions */}
          {thenActions.length > 0 && !readOnly && (
            <div className={`border-2 ${containerBg} rounded-md p-2 space-y-2`}>
              <div className={`label text-md px-2 ${labelColor}`}>Actions</div>
              <div className="overflow-y-auto max-h-40">
                {thenActions.map((action, index) => (
                  <div
                    key={action.id}
                    className={`flex justify-between items-center p-2 mb-2 rounded-md ${inputBg} ${borderColor}`}
                  >
                    <div className={`flex items-center ${textColor}`}>
                      <span className="font-medium mr-2">
                        Action {index + 1}:
                      </span>
                      <span>
                        {action.name} - {action.value}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              {/* Add this button for testing purposes */}
              <button
                onClick={addAction}
                className={`${buttonPrimaryBg} text-white ${buttonPrimaryHover} py-1 px-3 rounded-md text-sm`}
              >
                Add Test Action
              </button>
            </div>
          )}

          {!readOnly && (
            <div className="inptBox flex gap-2 px-2 w-full min-h-0">
              <div
                className={`${copyBtnBg} px-2 py-3 rounded-md text-sm w-[90%] flex items-center`}
              >
                <div
                  className={`label w-[85%] text-sm truncate ${
                    theme === "dark" ? "text-black" : "text-black"
                  }`}
                >
                  {api}
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center justify-center w-[15%] ${copyBtnText} rounded-lg shadow-md hover:text-blue-700 cursor-pointer transition-all`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div
                onClick={toggleApiSettingsPanel}
                className={`flex justify-center items-center cursor-pointer ${textColor} hover:text-blue-500 transition-colors p-2 rounded-md hover:bg-gray-200`}
              >
                <Settings size={18} />
              </div>
            </div>
          )}

          <div
            className={`border-2 ${containerBg} flex-1 rounded-md p-2 space-y-3 flex flex-col overflow-y-auto`}
          >
            <div className="inptBox flex flex-col gap-2 px-2 w-full">
              <div className={`label text-sm ${labelColor}`}>
                Start Date & Time
              </div>
              {readOnly ? (
                <div
                  className={`${readOnlyBg} p-2 w-full rounded-md ${textColor}`}
                >
                  {startDate ? new Date(startDate).toLocaleString() : "Not set"}
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className={`${inputBg} p-2 w-full rounded-md ${textColor} ${borderColor}`}
                />
              )}
            </div>
            <div className="inptBox flex flex-col gap-2 px-2 w-full">
              <div className={`label text-sm ${labelColor}`}>
                End Date & Time
              </div>
              {readOnly ? (
                <div
                  className={`${readOnlyBg} p-2 w-full rounded-md ${textColor}`}
                >
                  {endDate ? new Date(endDate).toLocaleString() : "Not set"}
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className={`${inputBg} p-2 w-full rounded-md ${textColor} ${borderColor}`}
                />
              )}
            </div>
            <div className="inptBox flex flex-col gap-2 px-2 w-full">
              <div className={`label text-sm ${labelColor}`}>
                Schedular Type
              </div>
              {readOnly ? (
                <div
                  className={`${readOnlyBg} p-2 w-full rounded-md ${textColor}`}
                >
                  {typeOptions.find((option) => option.value === schedularType)
                    ?.label || "Not set"}
                </div>
              ) : (
                <select
                  value={schedularType}
                  onChange={handleTypeChange}
                  className={`p-2 w-full border rounded-md ${inputBg} ${textColor} ${borderColor}`}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {readOnly ? (
              <div className="inptBox flex flex-col gap-2 px-2 w-full">
                <div className={`label text-sm ${labelColor}`}>
                  Configuration
                </div>
                <div
                  className={`${readOnlyBg} p-3 w-full rounded-md ${textColor}`}
                >
                  {schedularType === "minute" &&
                    `Every ${schedularConfig.minute} minute(s)`}
                  {schedularType === "hour" &&
                    `Every ${schedularConfig.hour} hour(s)`}
                  {schedularType === "day" &&
                    `Daily at ${schedularConfig.day.hour}:${String(
                      schedularConfig.day.minute
                    ).padStart(2, "0")}`}
                  {schedularType === "week" &&
                    `Weekly on ${(schedularConfig.week.days || []).join(", ")}`}
                  {schedularType === "month" &&
                    `Monthly on dates: ${(
                      schedularConfig.month.dates || []
                    ).join(", ")}`}
                  {schedularType === "cron" && `Cron: ${getCronExpression()}`}
                  {schedularType === "select" && `No schedule type selected`}
                </div>
              </div>
            ) : (
              renderSchedularConfig()
            )}

            {!readOnly && (
              <div className="mt-4 flex justify-end px-2">
                <button
                  onClick={handleCreateSchedule}
                  disabled={isButtonDisabled || !isSaved}
                  className={`py-2 w-full px-6 rounded-md font-medium ${
                    isButtonDisabled || !isSaved
                      ? `${disabledBg} ${disabledText} cursor-not-allowed`
                      : `${buttonPrimaryBg} text-white ${buttonPrimaryHover} transition-colors cursor-pointer`
                  }`}
                >
                  {existingSchedule ? "Update Schedule" : "Create Schedule"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Settings Panel */}
      <ApiSettingsPanel
        isOpen={isApiSettingsPanelOpen}
        onClose={() => setIsApiSettingsPanelOpen(false)}
      />
    </div>
  );
};

export default TriggerSchedular;
