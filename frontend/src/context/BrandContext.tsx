"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, SettingsResponse } from "@/lib/api";

export interface BrandAssets {
  logoPrimary: string;
  logoDocument: string;
  logoIcon: string;
  logoDark: string;
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
}

const defaultBrandAssets: BrandAssets = {
  logoPrimary: "/logo.png",
  logoDocument: "/kabhyan-logo.png",
  logoIcon: "/logo.png",
  logoDark: "/logo.png",
  companyName: "Kabhyan Technologies Private Limited",
  companyTagline: "Enterprise IT & Software Engineering Solutions",
  companyEmail: "contact@kabhyan.com",
  companyPhone: "+91 98200 12345",
  companyWebsite: "https://www.kabhyan.com",
};

const BrandContext = createContext<{
  brand: BrandAssets;
  refreshBrand: () => Promise<void>;
}>({
  brand: defaultBrandAssets,
  refreshBrand: async () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandAssets>(defaultBrandAssets);

  const refreshBrand = async () => {
    try {
      const res: SettingsResponse = await api.request("/settings");
      const flat: Record<string, string> = {};
      if (res.settings && typeof res.settings === "object") {
        Object.values(res.settings).forEach((items) => {
          if (Array.isArray(items)) {
            items.forEach((item) => {
              flat[item.key] = item.value || "";
            });
          }
        });
      }

      setBrand({
        logoPrimary: flat["company_logo_primary"] || "/logo.png",
        logoDocument: flat["company_logo_document"] || "/kabhyan-logo.png",
        logoIcon: flat["company_logo_icon"] || "/logo.png",
        logoDark: flat["company_logo_dark"] || "/logo.png",
        companyName: flat["company_name"] || "Kabhyan Technologies Private Limited",
        companyTagline: flat["company_legal_tagline"] || "Enterprise IT & Software Engineering Solutions",
        companyEmail: flat["company_email"] || "contact@kabhyan.com",
        companyPhone: flat["company_phone"] || "+91 98200 12345",
        companyWebsite: flat["company_website"] || "https://www.kabhyan.com",
      });
    } catch {
      // Keep defaults gracefully if unauthenticated or offline
    }
  };

  useEffect(() => {
    refreshBrand();
  }, []);

  return (
    <BrandContext.Provider value={{ brand, refreshBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
