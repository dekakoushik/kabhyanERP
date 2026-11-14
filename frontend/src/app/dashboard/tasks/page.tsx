"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Loader2 } from "lucide-react";

function TasksRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const projectId = searchParams.get("project_id");
    if (projectId) {
      router.replace(`/dashboard/projects/${projectId}?tab=kanban`);
    } else {
      router.replace("/dashboard/projects");
    }
  }, [router, searchParams]);

  return (
    <div className="py-24 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-xs font-semibold text-slate-500">
        Redirecting to Project Workspace...
      </p>
    </div>
  );
}

export default function TasksRedirectPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">
              Loading workspace...
            </p>
          </div>
        }
      >
        <TasksRedirectContent />
      </Suspense>
    </AdminLayout>
  );
}
