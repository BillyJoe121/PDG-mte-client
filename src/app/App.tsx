import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { FiltersProvider } from "./context/FiltersContext";
import { AuditProvider } from "./context/AuditContext";

export default function App() {
  return (
    <AuthProvider>
      <AuditProvider>
        <FiltersProvider>
          <RouterProvider router={router} />
        </FiltersProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { fontFamily: "Montserrat, sans-serif", fontSize: "13px" },
          }}
          richColors
        />
      </AuditProvider>
    </AuthProvider>
  );
}
