import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Medications } from "./pages/Medications";
import { Vitals } from "./pages/Vitals";
import { Device } from "./pages/Device";
import { Appointments } from "./pages/Appointments";
import { Emergency } from "./pages/Emergency";
import { Profile } from "./pages/Profile";
import { PrescriptionScanner } from "./pages/PrescriptionScanner";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "medications", Component: Medications },
      { path: "vitals", Component: Vitals },
      { path: "appointments", Component: Appointments },
      { path: "device", Component: Device },
      { path: "emergency", Component: Emergency },
      { path: "profile", Component: Profile },
      { path: "rx-scanner", Component: PrescriptionScanner },
    ],
  },
]);
