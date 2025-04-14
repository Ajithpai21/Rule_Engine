import { configureStore } from "@reduxjs/toolkit";
import workspaceDetailsReducer from "./workspaceDetails/workspaceDetailsSlice";
import  themeDetailsReducer  from "./themeDetails/themeDetailsSlice";
import dataSourceReducer from "./dataSourceDeatils/dataSourceDeatilsSlice";
import  apiDetailsReducer from "./apiDetails/apiDetailsSlice";

export const store = configureStore({
  reducer: {
    workspaceDetails: workspaceDetailsReducer,
    theme: themeDetailsReducer,
    dataSourceDetails: dataSourceReducer,
    apiDetails: apiDetailsReducer
  },
});
