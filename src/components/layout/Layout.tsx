
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import LayoutHeader from "./LayoutHeader";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { memo } from "react";

const Layout = memo(() => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <LayoutHeader />
        <main className="flex-1 overflow-auto bg-slate-50 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

Layout.displayName = "Layout";

export default Layout;
