"use client";

import ProviderRedux from "@/providers/ProviderRedux";
import TanstackProvider from "@/providers/TanStackProvider";
import React, { Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";
import { hydrateLanguageFromStorage } from "@/redux/slices/languageSlice";

interface IProps {
  children: React.ReactNode;
}

const BaseLayout = ({ children }: IProps) => {
  const LanguageInit = () => {
    const dispatch = useDispatch();
    useEffect(() => {
      dispatch(hydrateLanguageFromStorage());
    }, [dispatch]);
    return null;
  };
  return (
    <Suspense>
      <ProviderRedux>
        <TanstackProvider>
          <LanguageInit />
          {children}
        </TanstackProvider>
      </ProviderRedux>
    </Suspense>
  );
};

export default BaseLayout;
