import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CommonState {
  loading: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

const initialState: CommonState = {
  loading: false,
  theme: 'light',
  sidebarOpen: true,
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setLoading, setTheme, toggleSidebar, setSidebarOpen } = commonSlice.actions;
export default commonSlice.reducer;
