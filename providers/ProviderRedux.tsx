'use client';

import { Provider } from 'react-redux';

import { persistor, store } from '@/redux/store';
import { PersistGate } from 'redux-persist/integration/react';

export default function ProviderRedux({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>{children}</PersistGate>
    </Provider>
  );
}
