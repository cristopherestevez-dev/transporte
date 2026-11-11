"use client";

import { Card } from "@heroui/react";

export default function StatCard({ title, value, icon, color }) {
  return (
    <Card className="shadow-md rounded-xl hover:shadow-lg transition-shadow duration-300">
      <Card.Header className="flex items-center gap-4 pb-2 border-b border-divider">
        <div
          className={`p-4 rounded-full text-white flex items-center justify-center shadow-md ${color}`}
          style={{ width: 56, height: 56 }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-default-500">{title}</h3>
      </Card.Header>
      <Card.Content className="pt-4">
        <p className="text-3xl font-extrabold text-foreground">{value}</p>
      </Card.Content>
    </Card>
  );
}

