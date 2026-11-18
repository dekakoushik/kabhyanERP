"use client";

import { use, Suspense } from "react";
import ReceiptVoucherCreateForm from "@/components/ReceiptVoucherCreateForm";
import { Loader2 } from "lucide-react";

function ReceiptVoucherFromProformaContent({ id }: { id: string }) {
  const decodedId = decodeURIComponent(id);
  return <ReceiptVoucherCreateForm proformaIdentifier={decodedId} />;
}

export default function ReceiptVoucherFromProformaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-semibold text-slate-500">Loading proforma parameters...</p>
        </div>
      }
    >
      <ReceiptVoucherFromProformaContent id={resolvedParams.id} />
    </Suspense>
  );
}
