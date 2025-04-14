import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const EditIntegration = ({
  theme,
  handleIsAddOpen,
  workspace,
  workspace_id,
  platformData,
  setPlatformData,
}) => {
  const [data, setData] = useState({
    name: "",
    tag: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isTestDisable, setTestDisable] = useState(false);
  const [isPublishDisable, setIsPublishDisable] = useState(true);

  const backStyle =
    theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";
  useEffect(() => {
    setData({
      name: platformData?.name,
      tag: platformData?.tag,
      host: platformData?.host,
      port: platformData?.port,
      database: platformData?.dbname,
      username: platformData?.username,
      password: platformData?.password,
    });
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setPlatformData("");
    setTimeout(() => handleIsAddOpen(), 300);
  };

  const handleChange = (e, field) => {
    if (isTestDisable) {
      setTestDisable(false);
      setIsPublishDisable(true);
      true;
    }
    setData({ ...data, [field]: e.target.value });
  };

  function getEmptyKeys(data) {
    return Object.keys(data).filter(
      (key) => typeof data[key] === "string" && data[key].trim() === ""
    );
  }

  function trimValues(obj) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value,
      ])
    );
  }

  const handleTest = async () => {
    const missingValues = getEmptyKeys(data);
    if (missingValues.length > 0) {
      toast.error(`${missingValues.join(" and ")} Cannot be Empty` || "Failed");
      return;
    }

    const addData = {
      user: user,
      platform: platformData?.platform,
    };
    const payload = { ...data, workspace, workspace_id };
    Object.assign(payload, addData);
    const trimedPayload = trimValues(payload);
    setTestDisable(true);
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/testConnectionString",
        trimedPayload
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        setIsPublishDisable(false);
      } else {
        toast.error(response.data.message || "Failed");
        setTestDisable(false);
        setIsPublishDisable(true);
      }
    } catch (error) {
      setTestDisable(false);
      setIsPublishDisable(true);
      true;
      if (error.response) {
        toast.error(
          error.response.data?.message ||
            `Server Error: ${error.response.status}`
        );
      } else {
        toast.error("Something went wrong. Try again!");
      }
    }
  };

  const handleSave = async () => {
    const missingValues = getEmptyKeys(data);
    if (missingValues.length > 0) {
      toast.error(`${missingValues.join(" and ")} Cannot be Empty` || "Failed");
      return;
    }

    const addData = {
      user: user,
      platform: platformData?.platform,
      integration_id: platformData?.integration_id,
    };
    const payload = { ...data, workspace, workspace_id };
    Object.assign(payload, addData);
    const trimedPayload = trimValues(payload);
    setIsPublishDisable(true);
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/editConnectionString",
        trimedPayload
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        handleClose();
      } else {
        toast.error(response.data.message || "Failed");
      }
    } catch (error) {
      setTestDisable(false);
      setIsPublishDisable(true);
      true;
      if (error.response) {
        toast.error(
          error.response.data?.message ||
            `Server Error: ${error.response.status}`
        );
      } else {
        toast.error("Something went wrong. Try again!");
      }
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 flex z-20 w-full h-screen overflow-hidden`}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-[70%] h-full flex items-center justify-center"
        onClick={handleClose}
      ></div>

      <div
        className={`w-[30%] h-full transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        } ${backStyle}`}
        style={{ overflow: "hidden" }}
      >
        <div className="text-xl font-bold px-4 py-6">Edit Integration</div>
        <hr
          className={`border w-full mb-2 ${
            theme === "dark" ? "border-white" : "border-black"
          }`}
        />
        <div className={`main max-h-[460px] overflow-y-auto px-4 space-y-4`}>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Name *</div>
            <input
              value={data.name}
              onChange={(e) => handleChange(e, "name")}
              placeholder="Enter Name"
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Tag *</div>
            <input
              value={data.tag}
              onChange={(e) => handleChange(e, "tag")}
              placeholder="Enter Tag"
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Host *</div>
            <input
              placeholder="Enter Host"
              value={data.host}
              disabled={isTestDisable}
              onChange={(e) => handleChange(e, "host")}
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Port *</div>
            <input
              value={data.port}
              disabled={isTestDisable}
              onChange={(e) => handleChange(e, "port")}
              placeholder="Enter Port"
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Database *</div>
            <input
              placeholder="Enter Database"
              value={data.database}
              disabled={isTestDisable}
              onChange={(e) => handleChange(e, "database")}
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Username *</div>
            <input
              placeholder="Enter Username"
              disabled={isTestDisable}
              value={data.username}
              onChange={(e) => handleChange(e, "username")}
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="text"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="label font-bold">Password *</div>
            <input
              placeholder="Enter Password"
              disabled={isTestDisable}
              value={data.password}
              onChange={(e) => handleChange(e, "password")}
              className={`border-1 px-3 py-1 rounded-md ${
                theme === "dark"
                  ? "bg-white text-black"
                  : " border-gray-500 text-black"
              }`}
              type="password"
            />
          </div>
        </div>
        <div className="btns p-4 flex gap-4 justify-center items-center h-24 mt-3 text-white font-bold">
          <button
            disabled={isTestDisable}
            onClick={handleTest}
            className={` h-full w-full rounded-md ${
              isTestDisable
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 cursor-pointer "
            }`}
          >
            Test Connection
          </button>
          <button
            disabled={isPublishDisable}
            onClick={handleSave}
            className={`h-full w-full cursor-pointer rounded-md ${
              isPublishDisable
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-500 cursor-pointer "
            }`}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditIntegration;
