import React, { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";

const CreateAttributeGroup = ({
  isOpen,
  setIsOpen,
  theme,
  handleCreateGroup,
}) => {
  const createRef = useRef(null);
  const [groupValue, setValue] = useState("");

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isOpen ? "flex" : "hidden"
      }`}
    >
      <div
        className={`w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[35%] max-w-lg p-8 rounded-lg  shadow-lg ${
          theme === "dark"
            ? "bg-black text-white shadow-green-600"
            : "bg-white text-black shadow-blue-400"
        }`}
        ref={createRef}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Create Attribute Group</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 cursor-pointer rounded-md hover:bg-red-500 dark:hover:bg-blue-600"
          >
            <X size={24} />
          </button>
        </div>

        <hr
          className={`${
            theme === "dark" ? "border-white" : "border-black"
          } my-4`}
        />

        <input
          value={groupValue}
          onChange={(e) => setValue(e.target.value)}
          className={`p-2 rounded-md w-full border focus:outline-none focus:ring-2 transition-all ${
            theme === "dark"
              ? "bg-gray-900 text-white border-gray-700 placeholder-gray-400 focus:ring-blue-500 shadow-md shadow-blue-600"
              : "bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-blue-500 shadow-md shadow-purple-200"
          }`}
          type="text"
          placeholder="Enter Group Name"
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={() => handleCreateGroup(groupValue)}
            disabled={!groupValue.trim()}
            className={`px-5 py-2 rounded-lg transition ${
              !groupValue.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-700 cursor-pointer"
            } ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAttributeGroup;
