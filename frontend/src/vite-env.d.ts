/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_PYTHON_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
