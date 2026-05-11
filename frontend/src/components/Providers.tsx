'use client';

import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import { AuthInitializer } from '@/contexts/AuthStore';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        {children}
        <Toaster position="top-right" />
      </AuthInitializer>
    </Provider>
  );
}

