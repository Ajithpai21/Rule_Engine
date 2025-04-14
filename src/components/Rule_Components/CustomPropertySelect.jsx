import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM
import { ChevronDown } from "lucide-react";

const CustomPropertySelect = ({
  value,
  properties,
  onChange,
  onClick,
  inputStyles,
  theme = "light",
  placeholder = "Select property",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef(null);
  const portalDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 230, // Default width
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        portalDropdownRef.current &&
        !portalDropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Update dropdown position and handle scroll/resize/close
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const updatePosition = () => {
        const rect = dropdownRef.current.getBoundingClientRect();
        // Check if the element is still in the DOM before updating state
        if (rect) {
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left,
            width: rect.width,
          });
        }
      };

      const handleScrollClose = (event) => {
        // Don't close if scrolling inside the dropdown menu
        if (portalDropdownRef.current?.contains(event.target)) {
          return;
        }
        // Close only if scrolling outside the dropdown
        setIsOpen(false);
      };

      updatePosition(); // Initial position update

      // Add event listeners
      // Use capture phase (true) for scroll to catch it early
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", handleScrollClose, true); // Add listener to close on scroll

      // Cleanup function
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", handleScrollClose, true); // Remove the closing listener
      };
    }
  }, [isOpen]); // Rerun effect when isOpen changes

  // Group properties by their categories
  const globalAttributes = properties.filter((prop) => prop.isGlobal);
  const inputAttributes = properties.filter((prop) => !prop.isGlobal);

  // Get selected property name for display
  const selectedProperty = properties.find((prop) => prop.name === value);

  // Filter properties based on search input
  const filterProperties = (props) => {
    if (!searchValue) return props;
    return props.filter((prop) =>
      prop.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const handleSelect = (propertyName) => {
    onChange({ target: { value: propertyName } });
    setIsOpen(false);
    setSearchValue("");
  };

  const handleInputClick = (e) => {
    if (onClick) onClick(e);
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      style={{ width: "230px", flex: "0 0 230px" }}
    >
      {/* Custom Select Input */}
      <div
        className={`${inputStyles} cursor-pointer flex justify-between items-center`}
        onClick={handleInputClick}
      >
        {selectedProperty ? (
          <div className="truncate">
            <span>{selectedProperty.name}</span>
            <span className="text-xs text-gray-500 ml-1">
              {selectedProperty.data_type}
            </span>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu - Rendered via Portal */}
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={portalDropdownRef}
            className={`fixed z-[9999] rounded-md shadow-lg ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-300"
            } border overflow-hidden`}
            style={{
              maxHeight: "300px",
              width: dropdownPosition.width,
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {/* Search Input */}
            <div
              className={`p-2 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={`w-full p-2 rounded ${
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-50 text-black border-gray-300"
                } border`}
                placeholder="Search properties..."
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking search
              />
            </div>

            {/* Options List */}
            <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
              {/* Empty option */}
              <div
                className={`px-4 py-2 cursor-pointer ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } ${
                  value === ""
                    ? theme === "dark"
                      ? "bg-gray-700"
                      : "bg-gray-100"
                    : ""
                }`}
                onClick={() => handleSelect("")}
              >
                <span className="text-gray-500">Select property</span>
              </div>

              {/* Global Attributes Group */}
              {globalAttributes.length > 0 && (
                <>
                  <div
                    className={`px-4 py-1 font-semibold ${
                      theme === "dark"
                        ? "bg-gray-900 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Global Attributes
                  </div>
                  {filterProperties(globalAttributes).map((prop) => (
                    <div
                      key={prop.id || prop.name}
                      className={`px-4 py-2 cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      } ${
                        value === prop.name
                          ? theme === "dark"
                            ? "bg-gray-700"
                            : "bg-gray-100"
                          : ""
                      }`}
                      onClick={() => handleSelect(prop.name)}
                    >
                      <span>{prop.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        {prop.data_type}
                      </span>
                    </div>
                  ))}
                  {filterProperties(globalAttributes).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 italic">
                      No matching attributes
                    </div>
                  )}
                </>
              )}

              {/* Input Attributes Group */}
              {inputAttributes.length > 0 && (
                <>
                  <div
                    className={`px-4 py-1 font-semibold ${
                      theme === "dark"
                        ? "bg-gray-900 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Input Attributes
                  </div>
                  {filterProperties(inputAttributes).map((prop) => (
                    <div
                      key={prop.id || prop.name}
                      className={`px-4 py-2 cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      } ${
                        value === prop.name
                          ? theme === "dark"
                            ? "bg-gray-700"
                            : "bg-gray-100"
                          : ""
                      }`}
                      onClick={() => handleSelect(prop.name)}
                    >
                      <span>{prop.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        {prop.data_type}
                      </span>
                    </div>
                  ))}
                  {filterProperties(inputAttributes).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 italic">
                      No matching attributes
                    </div>
                  )}
                </>
              )}

              {/* No properties available */}
              {properties.length === 0 && (
                <div className="px-4 py-2 text-gray-500 italic">
                  No attributes available
                </div>
              )}
            </div>
          </div>,
          document.body // Target container for the portal
        )}
    </div>
  );
};

export default CustomPropertySelect;
