import { createSlice } from "@reduxjs/toolkit";

const initialTheme = sessionStorage.getItem("theme") || "dark";

export const themeDetailsSlice = createSlice({
  name: "theme",
  initialState: { mode: initialTheme },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === "dark" ? "light" : "dark";
      sessionStorage.setItem("theme", state.mode);
      document.documentElement.classList.toggle("dark", state.mode === "dark"); 
    },
  },
});

export const { toggleTheme } = themeDetailsSlice.actions;
export default themeDetailsSlice.reducer;
