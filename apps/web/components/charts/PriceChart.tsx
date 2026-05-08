"use client";

import React, { memo, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  side: "BACK" | "LAY";
}

interface PriceChartProps {
  data: PriceDataPoint[];
  height?: number;
  showVolume?: boolean;
  showMovingAverage?: boolean;
  timeRange?: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  onTimeRangeChange?: (range: string) => void;
}

const PriceChart = memo(function PriceChart({
  data,
  height = 300,
  showVolume = true,
  showMovingAverage = true,
  timeRange = "15m",
  onTimeRangeChange,
}: PriceChartProps) {
  // Calculate moving average
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const processed = data.map((point, index) => {
      const movingAvg = calculateMovingAverage(data, index, 5);
      return {
        ...point,
        time: formatTime(point.timestamp),
        movingAverage: movingAvg,
      };
    });

    return processed;
  }, [data]);

  // Calculate min/max for Y axis
  const { minPrice, maxPrice } = useMemo(() => {
    if (!data.length) return { minPrice: 0, maxPrice: 10 };
    
    const prices = data.map(d => d.price);
    const min = Math.min(...prices) * 0.95;
    const max = Math.max(...prices) * 1.05;
    
    return { minPrice: min, maxPrice: max };
  }, [data]);

  // Calculate volume by side
  const volumeData = useMemo(() => {
    if (!showVolume) return [];
    
    return data.reduce((acc, point) => {
      const time = formatTime(point.timestamp);
      const existing = acc.find(item => item.time === time);
      
      if (existing) {
        if (point.side === "BACK") {
          existing.backVolume += point.volume;
        } else {
          existing.layVolume += point.volume;
        }
      } else {
        acc.push({
          time,
          backVolume: point.side === "BACK" ? point.volume : 0,
          layVolume: point.side === "LAY" ? point.volume : 0,
        });
      }
      
      return acc;
    }, [] as Array<{ time: string; backVolume: number; layVolume: number }>);
  }, [data, showVolume]);

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-4xl">📈</div>
          <p className="mt-2 text-sm text-gray-500">No price data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time range selector */}
      {onTimeRangeChange && (
        <div className="flex gap-2">
          {["1m", "5m", "15m", "1h", "4h", "1d"].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      )}

      {/* Main price chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Price Movement</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-sm bg-blue-500" />
              <span className="text-gray-600">Price</span>
            </div>
            {showMovingAverage && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-6 rounded-sm bg-purple-500" />
                <span className="text-gray-600">MA(5)</span>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : '0.00', "Price"]}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              fill="url(#colorPrice)"
              strokeWidth={2}
              dot={false}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume chart */}
      {showVolume && volumeData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold">Trading Volume</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toLocaleString() : '0',
                  name === "backVolume" ? "Back Volume" : "Lay Volume",
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="backVolume"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="layVolume"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

// Helper functions
function calculateMovingAverage(data: PriceDataPoint[], index: number, period: number): number {
  const start = Math.max(0, index - period + 1);
  const slice = data.slice(start, index + 1);
  const sum = slice.reduce((acc, point) => acc + point.price, 0);
  return sum / slice.length;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default PriceChart;