import React, { useEffect } from 'react';
import { initFirebase, initFirebaseUi } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const setupUi = async () => {
      try {
        await initFirebase();
        if (!isMounted) return;
        initFirebaseUi('firebaseui-auth-container');
      } catch (error) {
        console.error('[LoginModal] Firebase UI init failed:', error);
      }
    };

    if (open) {
      setupUi();
    }

    return () => {
      isMounted = false;
      if (window.__firebaseUiInstance?.reset) {
        window.__firebaseUiInstance.reset();
      }
    };
  }, [open]);

  useEffect(() => {
    if (open && user) {
      onClose();
    }
  }, [open, user, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
          aria-label="Close login"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold text-gray-900">Dang nhap</h2>
        <p className="text-sm text-gray-600 mb-4">Su dung Google, Facebook hoac Email.</p>
        <div id="firebaseui-auth-container" />
      </div>
    </div>
  );
};

export default LoginModal;
