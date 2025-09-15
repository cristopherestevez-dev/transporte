"use client";

import { Card, CardHeader, CardBody } from "@heroui/react";

export default function StatCard({ title, value, icon, color }) {
  return (
    <Card shadow="md" className="rounded-xl hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex items-center gap-4 pb-2 border-b border-gray-200">
        <div
          className={`p-4 rounded-full text-white flex items-center justify-center shadow-md ${color}`}
          style={{ width: 56, height: 56 }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </CardHeader>
      <CardBody className="pt-4">
        <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      </CardBody>
    </Card>
  );
}

