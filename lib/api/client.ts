import axios from "axios";

import { getToken, removeToken } from "@/lib/token";
import { store } from "@/redux/store";
import { resetMeState, setSessionToken } from "@/redux/slices/meSlice";

const clientApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_APP_URL}/api`,
});

clientApi.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

clientApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: {
    response: {
      status: number;
    };
  }) => {
    if (error?.response?.status === 401) {
      removeToken();
      // Clear user state in Redux
      store.dispatch(resetMeState());
      store.dispatch(setSessionToken(null));
    }

    return Promise.reject(error);
  }
);

export const queryRetry = (failureCount: number, err: any) => {
  if (err?.response?.status === 404) {
    return false;
  }
  return failureCount < 3;
};

export default clientApi;
