import { Routes } from "./Dispatch";
import { jobForm } from "./forms";
import { ImportCenter } from "./ImportCenter";
import { Billing } from "./pages/Billing";
import { Customers } from "./pages/Customers";
import { Inbox } from "./pages/Inbox";
import { Inventory } from "./pages/Inventory";
import { PortalManager } from "./pages/PortalManager";
import { Reports } from "./pages/Reports";
import { Sales } from "./pages/Sales";
import { Settings } from "./pages/Settings";
import { WaterCare } from "./pages/WaterCare";
import { Workflows } from "./pages/Workflows";
import { WorkOrders } from "./pages/WorkOrders";
import type { Context, Page } from "./types";
import { CreateButton, Heading } from "./ui";

export function Pages({ ctx, page }: { ctx: Context; page: Page }) {
  if (page === "Customers") return <Customers ctx={ctx} />;
  if (page === "Work orders") return <WorkOrders ctx={ctx} />;
  if (page === "Routes")
    return (
      <>
        <Heading
          title="Routes"
          sub="The right crew. The next stop. A smoother day."
          action={
            <CreateButton onClick={() => ctx.edit(jobForm(ctx))}>
              Schedule job
            </CreateButton>
          }
        />
        <Routes ctx={ctx} />
      </>
    );
  if (page === "Water care") return <WaterCare ctx={ctx} />;
  if (page === "Sales") return <Sales ctx={ctx} />;
  if (page === "Inventory") return <Inventory ctx={ctx} />;
  if (page === "Billing") return <Billing ctx={ctx} />;
  if (page === "Inbox") return <Inbox ctx={ctx} />;
  if (page === "Workflows") return <Workflows ctx={ctx} />;
  if (page === "Import center") return <ImportCenter ctx={ctx} />;
  if (page === "Portal") return <PortalManager ctx={ctx} />;
  if (page === "Reports") return <Reports ctx={ctx} />;
  return <Settings ctx={ctx} />;
}
