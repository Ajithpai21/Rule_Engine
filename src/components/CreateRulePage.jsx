import React, { useRef, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const checkNameAPI = async (name, workspace, workspace_id) => {
  const API_URI =
    "https://micro-solution-ruleengineprod.mfilterit.net/nameCheck";
  const payload = {
    user: user,
    workspace,
    workspace_id,
    name,
  };

  try {
    const response = await axios.post(API_URI, payload);
    if (response.data.status === "Success" && response.data.message === "200") {
      return true;
    } else {
      toast.error(response.data.message || "Failed");
      return false;
    }
  } catch (error) {
    if (error.response) {
      toast.error(
        error.response.data?.message || `Server Error: ${error.response.status}`
      );
      return false;
    } else {
      toast.error("Something went wrong. Try again!");
      return false;
    }
  }
};
const getRandomID = async (selected) => {
  const API_URI =
    "https://micro-solution-ruleengine-datasource_prod.mfilterit.net/generateID";
  const payload = {
    rule_type: selected,
  };

  try {
    const response = await axios.post(API_URI, payload);
    if (response.status == 200) {
      return (
        response.data.rule_id ||
        response.data.ruleset_id ||
        response.data.decision_id
      );
    } else {
      toast.error("Failed to Generate ID");
      return "";
    }
  } catch (error) {
    if (error.response) {
      toast.error(
        error.response.data?.message || `Server Error: ${error.response.status}`
      );
      return "";
    } else {
      toast.error("Something went wrong. Try again!");
      return "";
    }
  }
};

const CreateRulePage = ({ isOpen, setIsOpen, theme, handeIsCreate }) => {
  const createRef = useRef(null);
  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const [selected, setSelected] = useState(() => {
    return sessionStorage.getItem("rule_type") || "";
  });
  const [name, setName] = useState(() => {
    return sessionStorage.getItem("name") || "";
  });

  const [description, setDescription] = useState(() => {
    return sessionStorage.getItem("description") || "";
  });

  const handleChange = (event) => {
    const value = event.target.value;
    setName(value);
    sessionStorage.setItem("name", value);
  };

  const handleDescChange = (event) => {
    const value = event.target.value;
    setDescription(value);
    sessionStorage.setItem("description", value);
  };

  const handleSelect = (name) => {
    setSelected(name);
    sessionStorage.setItem("rule_type", name);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        sessionStorage.removeItem("rule_type");
        sessionStorage.removeItem("name");
        sessionStorage.removeItem("description");
        sessionStorage.removeItem("type_id");
        setIsOpen(false);
      }
    }

    if (isOpen) {
      sessionStorage.removeItem("rule_type");
      sessionStorage.removeItem("name");
      sessionStorage.removeItem("description");
      sessionStorage.removeItem("type_id");
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNext = async () => {
    if (!selected.trim()) return toast.error("Select a Rule Type");
    if (!name.trim()) return toast.error("Name cannot be Empty!");

    const isValid = await checkNameAPI(name, workspace, workspace_id);
    if (isValid) {
      const type_id = await getRandomID(selected);
      if (type_id) {
        sessionStorage.setItem("type_id", type_id);
        handeIsCreate();
        setIsOpen(false);
        return;
      }
      toast.error("Something Went Wrong!");
    }
  };

  return (
    <div
      className="absolute top-0 left-0 w-full h-screen flex z-50 overflow-hidden"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div className="px-32 py-4 w-full h-full">
        <div
          className={`main flex flex-col ${
            theme === "dark" ? "bg-black text-white" : "bg-white text-black"
          }  w-full h-full rounded-xl px-8 py-4`}
          ref={createRef}
        >
          <div className="topbox flex items-center justify-between">
            <div className="font-bold text-xl">Create Rule</div>
            <button
              onClick={() => {
                sessionStorage.removeItem("rule_type");
                sessionStorage.removeItem("name");
                sessionStorage.removeItem("description");
                sessionStorage.removeItem("type_id");
                setIsOpen(false);
              }}
              className={`p-2 ${
                theme === "dark" ? "hover:bg-blue-600" : "hover:bg-red-500"
              } rounded cursor-pointer`}
            >
              <X size={24} />
            </button>
          </div>
          <hr
            className={`border my-4 ${
              theme === "dark" ? "border-white" : "border-black"
            }`}
          />
          <div className="main w-full h-full space-y-3">
            <div className="inpts w-full space-y-3">
              <div className="inBox w-full space-y-2">
                <div className="label">Rule Name</div>
                <input
                  value={name}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  className={`p-3  w-full rounded-md ${
                    theme === "dark"
                      ? "bg-white text-black border-blue-500"
                      : "bg-gray-200  border-black"
                  }`}
                  type="text"
                />
              </div>
              <div className="inBox w-full h-full space-y-2">
                <div className="label">Rule Description (Optional)</div>
                <textarea
                  placeholder="Enter Description"
                  value={description}
                  onChange={handleDescChange}
                  className={`p-3 h-18 w-full rounded-md ${
                    theme === "dark"
                      ? "bg-white text-black border-blue-500"
                      : "bg-gray-200  border-black"
                  }`}
                  type="text"
                />
              </div>
            </div>
            <div className="selectBox w-full space-y-2">
              <div className="label px-1">Select Rule Type</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => handleSelect("Decision Table")}
                  className={`bg-green-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border-4 cursor-pointer ${
                    selected === "Decision Table"
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <h3 className="text-lg text-purple-600 font-bold">
                    Decision Table
                  </h3>
                  <p className="text-gray-900 mt-2 text-sm text-left">
                    A decision table is a bunch of AND conditions grouped in a
                    table-like view having various outputs or actions for
                    different group conditions being true. Typically used in
                    lead scoring, allocation, dynamic payouts, discounts, etc.
                  </p>
                </div>

                <div
                  className={`bg-green-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border-4 cursor-pointer ${
                    selected === "Simple Rule"
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleSelect("Simple Rule")}
                >
                  <h3 className="text-lg text-green-600 font-bold">
                    Simple Rule
                  </h3>
                  <p className="text-gray-700 mt-2 text-sm">
                    A simple rule is a bunch of if/else conditions having
                    results/actions based on the whole rule being true or false.
                    Typically used in customer segmentations, simple plan
                    allocation, referral bonus payout, etc.
                  </p>
                </div>

                <div
                  className={`bg-pink-200 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border-4 cursor-pointer ${
                    selected === "Rule Set"
                      ? "border-blue-500"
                      : "border-gray-300"
                  }`}
                  onClick={() => handleSelect("Rule Set")}
                >
                  <h3 className="text-lg text-pink-600 font-bold">Rule Set</h3>
                  <p className="text-gray-700 mt-2 text-sm">
                    A rule set is a collection of rules to be processed all at
                    once. Typically used in complex plan allocation, user
                    scoring, etc.
                  </p>
                </div>
              </div>
            </div>
            <div className="btn flex justify-end items-end py-4">
              <button
                onClick={handleNext}
                className="bg-blue-500 px-4 py-2 rounded-md cursor-pointer text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateRulePage;
