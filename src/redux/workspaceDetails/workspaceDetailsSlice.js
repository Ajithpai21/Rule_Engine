import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import getUserDetails from "@/utils/getUserDetails";

export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetchWorkspaces",
  async (_, { rejectWithValue }) => {
    try {
      const user = getUserDetails();
      console.log(user);
      if (!user) {
        throw new Error("User not found in sessionStorage");
      }

      const API_URL = `https://micro-solution-ruleengineprod.mfilterit.net/getWorkSpace?user=${user}`;

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const result = await response.json();

      return result.data || []; 
    } catch (error) {
      console.error("API Fetch Error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const savedWorkspace = sessionStorage.getItem("workspace");
const savedWorkspaceId = sessionStorage.getItem("workspace_id");

export const workspaceDetailsSlice = createSlice({
  name: "workspaces",
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedWorkspace: savedWorkspace || "Select a workspace",
    selectedWorkspace_id: savedWorkspaceId || null,
  },
  reducers: {
    setSelectedWorkspace: (state, action) => {
      state.selectedWorkspace = action.payload.workspace;
      state.selectedWorkspace_id = action.payload.workspace_id;
      sessionStorage.setItem("workspace", action.payload.workspace);
      sessionStorage.setItem("workspace_id", action.payload.workspace_id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;

        if (!savedWorkspace && action.payload.length > 0) {
          const firstWorkspace = action.payload[0];
          state.selectedWorkspace = firstWorkspace?.workspace || "Select a workspace";
          state.selectedWorkspace_id = firstWorkspace?.workspace_id || null;

          sessionStorage.setItem("workspace", state.selectedWorkspace);
          sessionStorage.setItem("workspace_id", state.selectedWorkspace_id);
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions & reducer
export const { setSelectedWorkspace } = workspaceDetailsSlice.actions;
export default workspaceDetailsSlice.reducer;
