import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import TableComp from "../components/TableComp";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CreateRulePage from "@/components/CreateRulePage";
import CreateSimpleRule from "@/pages/CreateSimpleRule";
import EditSimpleRule from "@/pages/EditSimpleRule";
import ViewSimpleRule from "@/pages/ViewSimpleRule";

import DescisionTable from "@/pages/DescisionTable";
import EditDecisionTable from "@/pages/EditDecisionTable";
import ViewDecisionTable from "@/pages/ViewDecisionTable";

import CreateRuleSet from "@/pages/CreateRuleSet";
import EditRuleSet from "@/pages/EditRuleSet";
import ViewRuleSet from "@/pages/ViewRuleSet";

import getUserDetails from "@/utils/getUserDetails";
const user = getUserDetails();

const Rule = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [PageIsOpen, setPageIsOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [search, setSearch] = useState("");

  const workspace = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace
  );
  const workspace_id = useSelector(
    (state) => state.workspaceDetails.selectedWorkspace_id
  );
  const theme = useSelector((state) => state.theme.mode);
  const api_key = useSelector((state) => state.apiDetails.api_key);

  const handleDelete = async (index) => {
    if (!window.confirm("Are you sure you want to delete?")) return;
    const deleteRow = rows[index] ?? null;
    try {
      const response = await axios.post(
        "https://micro-solution-ruleengineprod.mfilterit.net/deleteRules_RuleSet",
        {
          user: user,
          api_key,
          workspace: workspace,
          workspace_id: workspace_id,
          rule_type: deleteRow.type,
          rule_id:
            deleteRow.decision_id ?? deleteRow.ruleset_id ?? deleteRow.rule_id,
        }
      );

      if (response.data.status === "Success") {
        toast.success(response.data.message || "successfully!");
        refetch();
      } else {
        toast.error(error?.response.data.message || "Failed to delete.");
      }
    } catch (error) {
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

  const [isCreate, setIsCreate] = useState(false);
  const [editSimpleRule, setEditSimpleRule] = useState(false);
  const [viewSimpleRule, setViewSimpleRule] = useState(false);

  const [isCreateRuleSet, setIsCreateRuleSet] = useState(false);
  const [editRuleSet, setEditRuleSet] = useState(false);
  const [viewRuleSet, setViewRuleSet] = useState(false);

  const [isCreateDescisionTable, setIsCreateDescisionTable] = useState(false);
  const [editDecisionTable, setEditDecisionTable] = useState(false);
  const [viewDecisionTable, setViewDecisionTable] = useState(false);

  const handeIsCreate = () => {
    const rule = sessionStorage.getItem("rule_type");
    if (rule === "Simple Rule") {
      setIsCreate((prev) => !prev);
      return;
    }
    if (rule === "Decision Table") {
      setIsCreateDescisionTable((prev) => !prev);
      return;
    }
    if (rule === "Rule Set") {
      setIsCreateRuleSet((prev) => !prev);
      return;
    }
  };

  const handleEdit = (index) => {
    const rule = rows[index];
    console.log("rule", rule);
    sessionStorage.setItem("name", rule.name);
    sessionStorage.setItem("description", rule.description ?? "");
    if (rule.type === "Simple Rule") {
      sessionStorage.setItem("type_id", rule.rule_id);
      sessionStorage.setItem("rule_type", "Simple Rule");
      setEditSimpleRule((prev) => !prev);
    } else if (rule.type === "Decision Table") {
      sessionStorage.setItem("type_id", rule.decision_id);
      sessionStorage.setItem("rule_type", "Decision Table");
      setEditDecisionTable((prev) => !prev);
    } else if (rule.type === "Rule Set") {
      sessionStorage.setItem("type_id", rule.ruleset_id);
      sessionStorage.setItem("rule_type", "Rule Set");
      setEditRuleSet((prev) => !prev);
    } else {
      console.log("rule", rule);
      return;
    }
  };

  const handleCloseEdit = () => {
    if (sessionStorage.getItem("rule_type") === "Simple Rule") {
      setEditSimpleRule((prev) => !prev);
    } else if (sessionStorage.getItem("rule_type") === "Decision Table") {
      setEditDecisionTable((prev) => !prev);
    } else if (sessionStorage.getItem("rule_type") === "Rule Set") {
      setEditRuleSet((prev) => !prev);
    }
  };

  useEffect(() => {
    refetch();
    if (
      !isCreate &&
      !editSimpleRule &&
      !viewSimpleRule &&
      !isCreateDescisionTable &&
      !editDecisionTable &&
      !viewDecisionTable &&
      !isCreateRuleSet &&
      !editRuleSet &&
      !viewRuleSet
    ) {
      sessionStorage.removeItem("rule_type");
      sessionStorage.removeItem("name");
      sessionStorage.removeItem("description");
      sessionStorage.removeItem("type_id");
    }
  }, [
    isCreate,
    editSimpleRule,
    viewSimpleRule,
    isCreateDescisionTable,
    editDecisionTable,
    viewDecisionTable,
    isCreateRuleSet,
    editRuleSet,
    viewRuleSet,
  ]);

  const fetchTable = async () => {
    const API_URL =
      "https://micro-solution-ruleengineprod.mfilterit.net/getRules_RuleSet";
    const requestBody = {
      user: user,
      workspace,
      workspace_id,
      api_key,
      rule_type: selectedType ? [selectedType] : [],
      name: search ? search : "",
      page,
      limit,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok)
        throw new Error(`Error: ${response.status} - ${response.statusText}`);

      const result = await response.json();
      setTotalPages(result?.total_pages || 1);
      return result?.data || [];
    } catch (error) {
      console.error("API call failed:", error.message);
      return [];
    }
  };

  const handleCreate = () => {
    setPageIsOpen(true);
  };

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "rows",
      page,
      limit,
      workspace,
      user,
      "rule-page",
      selectedType,
      search,
    ],
    queryFn: fetchTable,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
  });

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  useEffect(() => {
    refetch();
  }, [limit, page, refetch, workspace]);

  useEffect(() => {
    setPage(1);
  }, [workspace]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const setViewOn = (ind) => {
    const rule = rows[ind];
    sessionStorage.setItem("name", rule.name);
    sessionStorage.setItem("description", rule.description ?? "");

    if (rule.type === "Simple Rule") {
      sessionStorage.setItem("type_id", rule.rule_id);
      sessionStorage.setItem("rule_type", "Simple Rule");
      setViewSimpleRule((prev) => !prev);
    } else if (rule.type === "Decision Table") {
      sessionStorage.setItem("type_id", rule.decision_id);
      sessionStorage.setItem("rule_type", "Decision Table");
      setViewDecisionTable((prev) => !prev);
    } else if (rule.type === "Rule Set") {
      sessionStorage.setItem("type_id", rule.ruleset_id);
      sessionStorage.setItem("rule_type", "Rule Set");
      setViewRuleSet((prev) => !prev);
    } else {
      console.log("rule", rule);
      return;
    }
  };

  const columns = ["name", "type", "created_at", "updated_at"];

  return (
    <div
      className={`flex flex-col px-6 rounded-lg shadow-lg ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className={`p-4 rounded-lg shadow ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <TableComp
          key={"rule"}
          rows={rows}
          isLoading={isLoading}
          page={page}
          limit={limit}
          totalPages={totalPages}
          handleLimitChange={handleLimitChange}
          setPage={setPage}
          columns={columns}
          actionVisbility={true}
          editVisbility={true}
          viewVisbility={true}
          tableSize={"500px"}
          handleDelete={handleDelete}
          onCreate={handleCreate}
          createView={true}
          onView={setViewOn}
          onEdit={handleEdit}
          isCreateDataSource={false}
          isRulePage={true}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          search={search}
          setSearch={setSearch}
          isAuditPage={false}
          typeOptions={""}
          actionOptions={""}
          statusOptions={""}
          selectedTypeOption={""}
          setSelectedTypeOption={""}
          selectedAction={""}
          setSelectedAction={""}
          selectedStatus={""}
          setSelectedStatus={""}
        />
      </div>
      {PageIsOpen && (
        <CreateRulePage
          setIsOpen={setPageIsOpen}
          isOpen={PageIsOpen}
          theme={theme}
          handeIsCreate={handeIsCreate}
        />
      )}
      {isCreate && <CreateSimpleRule setOnClose={handeIsCreate} />}
      {editSimpleRule && <EditSimpleRule setOnClose={handleCloseEdit} />}
      {viewSimpleRule && <ViewSimpleRule setOnClose={setViewSimpleRule} />}

      {isCreateDescisionTable && (
        <DescisionTable setOnClose={setIsCreateDescisionTable} />
      )}
      {editDecisionTable && (
        <EditDecisionTable setOnClose={setEditDecisionTable} />
      )}
      {viewDecisionTable && (
        <ViewDecisionTable setOnClose={setViewDecisionTable} />
      )}

      {isCreateRuleSet && <CreateRuleSet setOnClose={setIsCreateRuleSet} />}
      {editRuleSet && <EditRuleSet setOnClose={setEditRuleSet} />}
      {viewRuleSet && <ViewRuleSet setOnClose={setViewRuleSet} />}
    </div>
  );
};

export default Rule;
