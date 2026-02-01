"use client";

import { Suspense, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/wemd-editor/components/Header/Header";
import { MarkdownEditor } from "@/components/wemd-editor/components/Editor/MarkdownEditor";
import { MarkdownPreview } from "@/components/wemd-editor/components/Preview/MarkdownPreview";
import { useHistoryStore } from "@/components/wemd-editor/store/historyStore";
import "@/components/wemd-editor/styles/global.css";
import "@/components/wemd-editor/styles/App.css";

export default function EditorPage() {
  const historyLoading = useHistoryStore((state) => state.loading);
  const loadHistory = useHistoryStore((state) => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "premium-toast",
          style: {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#1a1a1a",
            boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.12)",
            borderRadius: "50px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 500,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            maxWidth: "400px",
          },
          success: {
            iconTheme: {
              primary: "#07c160",
              secondary: "#fff",
            },
            duration: 2000,
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
            duration: 3000,
          },
        }}
      />
      <Header />
      <main className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-1/2 h-full min-h-0 overflow-hidden flex flex-col border-r border-border">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>正在加载...</p>
            </div>
          ) : (
            <MarkdownEditor />
          )}
        </div>
        <div className="w-1/2 h-full min-h-0 overflow-hidden flex flex-col">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>正在加载...</p>
            </div>
          ) : (
            <MarkdownPreview />
          )}
        </div>
      </main>
    </div>
  );
}
