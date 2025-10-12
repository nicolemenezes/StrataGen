// /frontend/src/components/cards/StrategySummaryCard.tsx

import React from 'react';

interface CardProps {
  strategy?: {
    goal?: string;
    target_audience?: string;
    key_messaging?: string;
    // Add other potential strategy fields here
  };
}

export const StrategySummaryCard: React.FC<CardProps> = ({ strategy }) => {
  if (!strategy) {
    return null;
  }

  const renderItem = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <div>
        <h4 className="font-semibold text-gray-700">{label}</h4>
        <p className="text-gray-600 text-sm">{value}</p>
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Strategy Summary</h3>
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
        {renderItem("Campaign Goal", strategy.goal)}
        {renderItem("Target Audience", strategy.target_audience)}
        {renderItem("Key Messaging", strategy.key_messaging)}
      </div>
    </div>
  );
};