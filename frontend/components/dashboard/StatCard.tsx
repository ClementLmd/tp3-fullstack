'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`stat-card hover:scale-105 hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${color} bg-opacity-10`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-300 text-sm font-medium">{title}</p>
          <p className="text-4xl font-black bg-gradient-to-r from-slate-200 to-slate-100 bg-clip-text text-transparent mt-2">
            {value}
          </p>
        </div>
        <div className="text-4xl opacity-70 animate-bounce">{icon}</div>
      </div>
    </div>
  );
}

