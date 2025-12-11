"use client";

import React from "react";
import { useAuthStore } from "@/lib/store/authStore";
import DashboardSection from "@/components/dashboard/DashboardSection";
import OverviewSlot from "./@overview/page";
import QuizzesSlot from "./@quizzes/page";
import SessionsSlot from "./@sessions/page";
import PerformanceSlot from "./@performance/page";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Section */}
        <div className="mb-12 animate-fade-in-up">
          <h2 className="section-title">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <OverviewSlot />
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wider */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quizzes Section */}
            <DashboardSection
              title={
                user?.role === "TEACHER"
                  ? "📚 My Quizzes"
                  : "📚 Available Quizzes"
              }
              animationDelay="0.1s"
            >
              <QuizzesSlot />
            </DashboardSection>

            {/* Performance Section */}
            <DashboardSection
              title={
                user?.role === "TEACHER"
                  ? "📈 Quiz Performance"
                  : "⭐ Your Performance"
              }
              animationDelay="0.2s"
              cardClassName="p-6"
            >
              <PerformanceSlot />
            </DashboardSection>
          </div>

          {/* Right Column - Narrower */}
          <DashboardSection
            title="🎯 Sessions"
            animationDelay="0.3s"
            cardClassName="overflow-hidden"
          >
            <SessionsSlot />
          </DashboardSection>
        </div>
      </div>
    </div>
  );
}
