import React, { useState } from "react";
import { Plus, Trash2, Eye } from "lucide-react";
import CreateActionModal from "./CreateActionModal";
import EditActionModal from "./EditActionModal";
import ResultButton from "./ResultButton";

const RuleResultSection = ({
  theme,
  actions = [],
  setActions,
  handleDeleteAction,
  elseResult,
  setElseResult,
  thenResult,
  setThenResult,
  isTested,
  setIsTested,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentValue, setCurrentValue] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);

  const [elseResultButton, setElseResultButton] = useState(false);
  const [thenResultButton, setThenResultButton] = useState(false);

  const buttonClass =
    "flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300";
  const inputBg = theme === "dark" ? "bg-gray-700" : "bg-gray-100";

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowEditModal(true);
  };

  const handleOpenCreateModal = (value) => {
    setCurrentValue(value);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAction(null);
  };

  const handleSubmitAction = (actionData, isEditing) => {
    setIsTested(false);
    if (isEditing) {
      setActions(
        actions.map((action) =>
          action.id === actionData.id ? actionData : action
        )
      );
    } else {
      setActions([...actions, actionData]);
    }
  };

  return (
    <div className=" flex flex-col gap-4 py-4 mb-4">
      {/* THEN Section */}
      <div className="flex items-center gap-5 h-fit">
        <div className="flex justify-center  items-center w-[10%]">
          <span className="font-bold text-lg">Then</span>
        </div>
        <div className="p-4 border-2 border-green-500 rounded-lg h-fit w-[70%]">
          <div className="flex items-center gap-4 mb-2">
            {/* <span>Default Value:</span>
            <div className="box flex items-center gap-2">
              <input
                type="checkbox"
                className="w-5 h-5 accent-blue-500 cursor-pointer"
                checked
                readOnly
              />
              <span>True</span>
            </div> */}
            <button
              className={`${buttonClass} cursor-pointer`}
              onClick={() => handleOpenCreateModal(true)}
            >
              <Plus size={18} className="text-blue-500" /> Add Action
            </button>

            <button
              className={`${buttonClass} cursor-pointer`}
              onClick={() => setThenResultButton(true)}
            >
              <Plus size={18} className="text-blue-500" /> Add Result
            </button>
            <div className="flex items-center gap-2 justify-center">
              <span>{thenResult.length}</span>
              <span>Result(s) Found</span>
              <Eye
                size={18}
                className="text-blue-500 cursor-pointer"
                onClick={() => setThenResultButton(true)}
              />
            </div>
          </div>

          {actions.length > 0 &&
            actions.filter((action) => action.value === true).length > 0 && (
              <div
                className="mt-4 mb-4 overflow-y-auto"
                style={{ maxHeight: "160px" }}
              >
                {actions
                  .filter((action) => action.value === true)
                  .map((action, index) => (
                    <div
                      key={action.id}
                      className={`flex justify-between items-center p-2 mb-2 rounded-md ${inputBg} ${borderColor} border cursor-pointer hover:opacity-80`}
                      onClick={() => handleActionClick(action)}
                    >
                      <div className={`flex items-center ${textColor}`}>
                        <span className="font-medium mr-2">
                          Action {index + 1}:
                        </span>
                        <span>{action.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAction(action.id);
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
        </div>
      </div>

      {/* ELSE Section */}
      <div className="flex items-center gap-5 h-fit">
        <div className="flex justify-center items-center w-[10%]">
          <span className="font-bold text-lg">Else</span>
        </div>
        <div className="w-[70%] p-4 border-2 border-red-500 rounded-lg h-fit">
          <div className="flex items-center gap-4 mb-2">
            {/* <span>Default Value:</span>
            <div className="box flex items-center gap-2">
              <input
                type="checkbox"
                className="w-5 h-5 accent-red-500 cursor-pointer"
                checked
                readOnly
              />
              <span>False</span>
            </div> */}
            <button
              className={`${buttonClass} cursor-pointer`}
              onClick={() => handleOpenCreateModal(false)}
            >
              <Plus size={18} className="text-red-500" /> Add Action
            </button>
            <button
              className={`${buttonClass} cursor-pointer`}
              onClick={() => setElseResultButton(true)}
            >
              <Plus size={18} className="text-red-500" /> Add Result
            </button>
            <div className="flex items-center gap-2 justify-center">
              <span>{elseResult.length}</span>
              <span>Result(s) Found</span>
              <Eye
                size={18}
                className="text-blue-500 cursor-pointer"
                onClick={() => setElseResultButton(true)}
              />
            </div>
          </div>

          {actions.length > 0 &&
            actions.filter((action) => action.value === false).length > 0 && (
              <div
                className="mt-4 mb-4 overflow-y-auto"
                style={{ maxHeight: "160px" }}
              >
                {actions
                  .filter((action) => action.value === false)
                  .map((action, index) => (
                    <div
                      key={action.id}
                      className={`flex justify-between items-center p-2 mb-2 rounded-md ${inputBg} ${borderColor} border cursor-pointer hover:opacity-80`}
                      onClick={() => handleActionClick(action)}
                    >
                      <div className={`flex items-center ${textColor}`}>
                        <span className="font-medium mr-2">
                          Action {index + 1}:
                        </span>
                        <span>{action.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAction(action.id);
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded-md"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

          {/* <div className="pt-2">
            <button
              className={`hover:bg-blue-400 bg-blue-600 font-bold cursor-pointer rounded-md p-2 justify-center items-center text-white`}
              onClick={() => setElseResultButton(true)}
            >
              Add Result - <span>{elseResult.length}</span>
            </button>
          </div> */}
        </div>
      </div>

      <CreateActionModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitAction}
        currentValue={currentValue}
        theme={theme}
        isTested={isTested}
        setIsTested={setIsTested}
      />

      {selectedAction && (
        <EditActionModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleSubmitAction}
          initialData={selectedAction}
          theme={theme}
          isTested={isTested}
          setIsTested={setIsTested}
        />
      )}

      {elseResultButton && (
        <ResultButton
          isOpen={elseResultButton}
          setIsOpen={setElseResultButton}
          result={elseResult}
          setResult={setElseResult}
          section={false}
          isTested={isTested}
          setIsTested={setIsTested}
        />
      )}

      {thenResultButton && (
        <ResultButton
          isOpen={thenResultButton}
          setIsOpen={setThenResultButton}
          result={thenResult}
          setResult={setThenResult}
          section={true}
          isTested={isTested}
          setIsTested={setIsTested}
        />
      )}
    </div>
  );
};

export default RuleResultSection;
