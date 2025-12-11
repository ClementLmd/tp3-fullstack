"use client";

import React from "react";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
  overview,
  quizzes,
  sessions,
  performance,
}: {
  children: React.ReactNode;
  overview: React.ReactNode;
  quizzes: React.ReactNode;
  sessions: React.ReactNode;
  performance: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
