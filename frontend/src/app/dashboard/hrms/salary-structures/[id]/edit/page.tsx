"use client";

import { use } from "react";
import SalaryStructureConfigurator from "@/components/SalaryStructureConfigurator";

export default function EditSalaryStructurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <SalaryStructureConfigurator
      initialUserId={resolvedParams.id}
      isEditMode={true}
    />
  );
}
