"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InvoiceCreateForm from "@/components/InvoiceCreateForm";
import { Loader2 } from "lucide-react";

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const proformaId = searchParams.get("proforma_id");
  return <InvoiceCreateForm proformaIdentifier={proformaId} />;
}

export default function CreateInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading invoice form...</p>
        </div>
      }
    >
      <CreateInvoiceContent />
    </Suspense>
  );
}
