import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import getUserDetails from "@/utils/getUserDetails";

export const fetchAPI = createAsyncThunk(
  "apiKey/fetchAPI",
  async (_, { rejectWithValue }) => {
    try {
      const user = getUserDetails();

      if (!user) {
        throw new Error("User not found in sessionStorage");
      }

      const API_URL = `https://micro-solution-ruleengineprod.mfilterit.net/apiKey?user=${user}`;

      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch API key");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("API Fetch Error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const storedApiKey = sessionStorage.getItem("api_key") || "";

export const apiDetailsSlice = createSlice({
  name: "apiDetails",
  initialState: {
    loading: false,
    error: null,
    api_key: storedApiKey,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAPI.fulfilled, (state, action) => {
        state.loading = false;

        if (!state.api_key && Object.keys(action.payload).length > 0) {
          const api_data = action.payload;

          if (api_data?.api_key) {
            state.api_key = api_data.api_key;
            sessionStorage.setItem("api_key", state.api_key);
            console.log("New API Key Set:", state.api_key);
          }
        }
      })
      .addCase(fetchAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("API Fetch Failed:", action.payload);
      });
  },
});

export default apiDetailsSlice.reducer;