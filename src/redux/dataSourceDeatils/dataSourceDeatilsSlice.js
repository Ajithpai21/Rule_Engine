import { createSlice } from "@reduxjs/toolkit";

export const dataSourceDeatilsSlice = createSlice({
  name: "dataSourceDetails",
  initialState: { data: {}, isSelected:false},
  reducers: {
    setDataSorceData: (state, action) => {
        state.data = action.payload.data;
        state.isSelected = action.payload.isSelected;
    },
  },
});

export const { setDataSorceData } = dataSourceDeatilsSlice.actions;
export default dataSourceDeatilsSlice.reducer;
