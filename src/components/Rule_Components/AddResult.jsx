import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

const AddResult = ({ result, setResult, handleDeleteResult, section }) => {
  const createRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCustomAttribute, setIsCustomAttribute] = useState(false);
  const [isAttributeLibrary, setIsAttributeLibrary] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [keyValue, setKeyValue] = useState("");

  const dataTypes = ["String", "Numeric", "Boolean", "Date", "DateTime"];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionSelect = (option) => {
    if (option === "Custom Attribute") {
      handleAddResult();
      setIsCustomAttribute(true);
    } else if (option === "Attribute Library") {
      setIsAttributeLibrary(true);
    }
    setIsDropdownOpen(false);
  };

  const handleAddResult = () => {
    const newResult = {
      key: keyValue,
      type: selectedType,
      value: inputValue,
    };
    setResult((prev) => [...prev, newResult]);

    // Reset input fields
    setKeyValue("");
    setSelectedType("");
    setInputValue("");
  };

  const handleChange = (index, field, value) => {
    setResult((prevResults) =>
      prevResults.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const renderInputBasedOnType = () => {
    switch (selectedType) {
      case "String":
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter string value"
            className="w-full px-2 py-1 border rounded"
          />
        );
      case "Numeric":
        return (
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter numeric value"
            className="w-full px-2 py-1 border rounded"
          />
        );
      case "Boolean":
        return (
          <select
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="">Select Boolean</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case "Date":
        return (
          <input
            type="date"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        );
      case "DateTime":
        return (
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const buttonClass =
    "flex items-center cursor-pointer gap-1 text-blue-500 hover:text-blue-700 font-medium";
  return (
    <div className="relative h-full overflow-x-auto overflow-y-auto">
      <button className={buttonClass} onClick={toggleDropdown}>
        <Plus size={18} className="text-red-500" /> Add Result
      </button>
      {isDropdownOpen && (
        <div
          ref={createRef}
          className={`absolute z-10 mt-2 w-48 bg-gray-800 rounded-md shadow-lg`}
        >
          <ul className="py-1">
            <li
              onClick={() => handleOptionSelect("Custom Attribute")}
              className="px-4 py-2  hover:bg-blue-500 cursor-pointer"
            >
              Custom Attribute
            </li>
            <li
              onClick={() => handleOptionSelect("Attribute Library")}
              className="px-4 py-2  hover:bg-blue-500 cursor-pointer"
            >
              Attribute Library
            </li>
          </ul>
        </div>
      )}
      <div className="flex flex-col overflow-x-auto overflow-y-auto space-y-3">
        {result.map((item, index) => (
          <div key={index} className="flex gap-3 items-center overflow-x-auto">
            <div className="w-[30%]">
              <label className="block text-sm font-medium">Key</label>
              <input
                type="text"
                value={item.key}
                onChange={(e) => handleChange(index, "key", e.target.value)}
                placeholder="Enter key"
                className="mt-1 w-full px-2 py-1 border rounded"
              />
            </div>
            <div className="w-[30%]">
              <label className="block text-sm font-medium">Data Type</label>
              <select
                value={item.type}
                onChange={(e) => handleChange(index, "type", e.target.value)}
                className="mt-1 w-full px-2 py-1 border rounded"
              >
                <option value="">Select Type</option>
                {dataTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[30%]">
              <label className="block text-sm font-medium">Value</label>
              <input
                type={item.type === "Numeric" ? "number" : "text"}
                value={item.value}
                onChange={(e) => handleChange(index, "value", e.target.value)}
                placeholder="Enter value"
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <button
              onClick={() => handleDeleteResult(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddResult;
