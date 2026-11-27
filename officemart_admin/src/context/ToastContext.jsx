import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');

  function showToast(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div data-testid="toast" className="toast">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}