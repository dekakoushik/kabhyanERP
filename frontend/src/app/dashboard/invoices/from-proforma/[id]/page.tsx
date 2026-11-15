"use client";

import { use, Suspense } from "react";
import InvoiceCreateForm from "@/components/InvoiceCreateForm";
import { Loader2 } from "lucide-react";

function InvoiceFromProformaContent({ id }: { id: string }) {
  const decodedId = decodeURIComponent(id);
  return <InvoiceCreateForm proformaIdentifier={decodedId} />;
}

export default function InvoiceFromProformaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading proforma milestone...</p>
        </div>
      }
    >
      <InvoiceFromProformaContent id={resolvedParams.id} />
    </Suspense>
  );
}
