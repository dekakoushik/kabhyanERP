"use client";

import React, { useState, useEffect } from "react";
import { api, Project } from "@/lib/api";
import { toast } from "sonner";
import { FolderKanban, Loader2, X, Plus, Sparkles } from "lucide-react";

interface QuickAddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  clientId?: number | null;
  clientName?: string;
  defaultBudget?: number;
}

export default function QuickAddProjectModal({
  open,
  onClose,
  onProjectCreated,
  clientId,
  clientName,
  defaultBudget,
}: QuickAddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Project["status"]>("planning");
  const [priority, setPriority] = useState<Project["priority"]>("medium");
  const [budget, setBudget] = useState<string>("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      // Auto-suggest code with current year and random 3-digit suffix
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setCode(`PRJ-${year}-${randomSuffix}`);
      setName("");
      setDescription("");
      setStatus("planning");
      setPriority("medium");
      setBudget(defaultBudget && defaultBudget > 0 ? String(defaultBudget) : "");
    }
  }, [open, defaultBudget]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!code.trim()) {
      toast.error("Please provide a project code");
      return;
    }

    try {
      setLoading(true);
      const res = await api.request("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          client_id: clientId || null,
          client_name: clientName || null,
          status,
          priority,
          budget: budget ? Number(budget) : null,
          description: description.trim() || null,
        }),
      });

      const newProject: Project = res.project;
      toast.success(`Project [${newProject.code}] "${newProject.name}" created!`);
      onProjectCreated(newProject);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick Add Project</h3>
              <p className="text-2xs text-slate-500">
                Register project and link directly to this document
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {clientName && (
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-medium">Associated Client:</span>
              <span className="font-bold text-blue-900 text-xs">{clientName}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ERP Cloud Migration"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Project Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="PRJ-2026-001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Budget (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="₹ 0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Scope / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="High-level project scope or deliverable summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium text-slate-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create & Link Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

