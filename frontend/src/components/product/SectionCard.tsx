import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function SectionCard({ title, children, icon }: SectionCardProps) {
  return (
    <section className="bg-white rounded-2xl shadow-md p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-2xl">{icon}</div>}
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </section>
  );
}