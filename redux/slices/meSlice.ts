import { IUser } from "@/types/me";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IInitialState {
  user: IUser | null;
  sessionToken: string | null;
}

const initialState: IInitialState = {
  user: null,
  sessionToken: null,
};

const meSlice = createSlice({
  name: "me",
  initialState,
  reducers: {
    setMe: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
    },
    setSessionToken: (state, action: PayloadAction<string | null>) => {
      state.sessionToken = action.payload;
    },
    resetMeState: (state) => {
      state.user = null;
      state.sessionToken = null;
    },
  },
});

export default meSlice.reducer;
export const { setMe, setSessionToken, resetMeState } = meSlice.actions;
