import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "./components/ui/toaster";
import { UserProvider } from "./contexts/UserContext";
import { CompanySettingsProvider } from "./contexts/CompanySettingsContext";
import { ProductsProvider } from "./hooks/use-products";
import { CurrencyProvider } from "./hooks/use-currency";
import { QuotesProvider } from "./contexts/QuotesContext";
import { DeliveryNotesProvider } from "./contexts/DeliveryNotesContext";
import { PurchaseOrdersProvider } from "./contexts/PurchaseOrdersContext";
import { PurchasesProvider } from "./contexts/PurchasesContext";
import { ClientsProvider } from "./contexts/ClientsContext";
import { SalesProvider } from "./contexts/SalesContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <UserProvider>
        <CompanySettingsProvider>
          <CurrencyProvider>
            <ProductsProvider>
              <ClientsProvider>
                <QuotesProvider>
                  <DeliveryNotesProvider>
                    <PurchaseOrdersProvider>
                      <PurchasesProvider>
                        <SalesProvider>
                          <App />
                          <Toaster />
                        </SalesProvider>
                      </PurchasesProvider>
                    </PurchaseOrdersProvider>
                  </DeliveryNotesProvider>
                </QuotesProvider>
              </ClientsProvider>
            </ProductsProvider>
          </CurrencyProvider>
        </CompanySettingsProvider>
      </UserProvider>
    </Router>
  </React.StrictMode>
);
