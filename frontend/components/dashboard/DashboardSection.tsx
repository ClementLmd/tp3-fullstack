'use client';

import React from 'react';

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  cardClassName?: string;
  animationDelay?: string;
}

export default function DashboardSection({ 
  title, 
  children, 
  cardClassName = '',
  animationDelay 
}: DashboardSectionProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay }}>
      <h2 className="section-title">{title}</h2>
      <div className={`card-dark ${cardClassName}`}>
        {children}
      </div>
    </div>
  );
}

