"use client";

import React, { memo, useMemo } from "react";

export interface PerformanceDataPoint {
  timestamp: number;
  pnl: number; // Profit and Loss
  exposure: number;
  balance: number;
  tradesCount: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  height?: number;
  width?: number;
  showMultiple?: boolean;
}

const PerformanceChart = memo(function PerformanceChart({
  data,
  height = 250,
  width = 400,
  showMultiple = true,
}: PerformanceChartProps) {
  // Process data for chart
  const { 
    pnlPoints, 
    exposurePoints, 
    balancePoints,
    minPnl, 
    maxPnl, 
    minExposure, 
    maxExposure,
    minBalance,
    maxBalance,
    minTime,
    maxTime 
  } = useMemo(() => {
    if (!data.length) {
      return {
        pnlPoints: [], exposurePoints: [], balancePoints: [],
        minPnl: -100, maxPnl: 100, minExposure: 0, maxExposure: 1000,
        minBalance: 0, maxBalance: 1000, minTime: 0, maxTime: 1
      };
    }

    const pnls = data.map(d => d.pnl);
    const exposures = data.map(d => d.exposure);
    const balances = data.map(d => d.balance);
    const times = data.map(d => d.timestamp);
    
    const minPnl = Math.min(...pnls);
    const maxPnl = Math.max(...pnls);
    const minExposure = Math.min(...exposures);
    const maxExposure = Math.max(...exposures);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const pnlRange = maxPnl - minPnl || 1;
    const exposureRange = maxExposure - minExposure || 1;
    const balanceRange = maxBalance - minBalance || 1;
    const timeRange = maxTime - minTime || 1;
    
    // Normalize points for SVG coordinates
    const pnlPoints = data.map((point, index) => {
      const x = ((point.timestamp - minTime) / timeRange) * (width - 40) + 20;
      const y = height - 40 - ((point.pnl - minPnl) / pnlRange) * (height - 80);
      return { x, y, ...point };
    });

    const exposurePoints = data.map((point, index) => {
      const x = ((point.timestamp - minTime) / timeRange) * (width - 40) + 20;
      const y = height - 40 - ((point.exposure - minExposure) / exposureRange) * (height - 80);
      return { x, y, ...point };
    });

    const balancePoints = data.map((point, index) => {
      const x = ((point.timestamp - minTime) / timeRange) * (width - 40) + 20;
      const y = height - 40 - ((point.balance - minBalance) / balanceRange) * (height - 80);
      return { x, y, ...point };
    });

    return { 
      pnlPoints, exposurePoints, balancePoints,
      minPnl, maxPnl, minExposure, maxExposure,
      minBalance, maxBalance, minTime, maxTime 
    };
  }, [data, height, width]);

  // Create SVG paths
  const pnlPath = pnlPoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const exposurePath = exposurePoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const balancePath = balancePoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-4xl">📊</div>
          <p className="mt-2 text-sm text-gray-500">No performance data available</p>
        </div>
      </div>
    );
  }

  const latestData = data[data.length - 1];
  const pnlColor = latestData.pnl >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Performance Overview</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-purple-600" />
            <span className="font-medium">PnL: </span>
            <span className={pnlColor}>{latestData.pnl >= 0 ? '+' : ''}{latestData.pnl.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-amber-600" />
            <span className="font-medium">Exposure: </span>
            <span className="text-gray-700">{latestData.exposure.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-blue-600" />
            <span className="font-medium">Balance: </span>
            <span className="text-gray-700">{latestData.balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-gray-600" />
            <span className="font-medium">Trades: </span>
            <span className="text-gray-700">{latestData.tradesCount}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <svg
          width={width}
          height={height}
          className="w-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Grid lines */}
          <line
            x1="20"
            y1="40"
            x2={width - 20}
            y2="40"
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1={height / 2}
            x2={width - 20}
            y2={height / 2}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1={height - 40}
            x2={width - 20}
            y2={height - 40}
            stroke="#f0f0f0"
            strokeWidth="1"
          />

          {/* Zero line for PnL */}
          <line
            x1="20"
            y1={height - 40 - ((0 - minPnl) / (maxPnl - minPnl || 1)) * (height - 80)}
            x2={width - 20}
            y2={height - 40 - ((0 - minPnl) / (maxPnl - minPnl || 1)) * (height - 80)}
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* PnL line (purple) */}
          <path
            d={pnlPath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Exposure line (amber) - only if showMultiple */}
          {showMultiple && (
            <path
              d={exposurePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="3 3"
            />
          )}

          {/* Balance line (blue) - only if showMultiple */}
          {showMultiple && (
            <path
              d={balancePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Axes */}
          <line
            x1="20"
            y1="40"
            x2="20"
            y2={height - 40}
            stroke="#666"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1={height - 40}
            x2={width - 20}
            y2={height - 40}
            stroke="#666"
            strokeWidth="1"
          />

          {/* Y-axis labels for PnL */}
          <text x="10" y="45" textAnchor="end" fontSize="10" fill="#666">
            {maxPnl.toFixed(0)}
          </text>
          <text x="10" y={height / 2 + 3} textAnchor="end" fontSize="10" fill="#666">
            {(minPnl + (maxPnl - minPnl) / 2).toFixed(0)}
          </text>
          <text x="10" y={height - 45} textAnchor="end" fontSize="10" fill="#666">
            {minPnl.toFixed(0)}
          </text>

          {/* Zero label */}
          <text 
            x="10" 
            y={height - 40 - ((0 - minPnl) / (maxPnl - minPnl || 1)) * (height - 80) + 3} 
            textAnchor="end" 
            fontSize="10" 
            fill="#666"
          >
            0
          </text>
        </svg>

        {/* Time labels */}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{formatTime(minTime)}</span>
          <span>{formatTime((minTime + maxTime) / 2)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-gray-500">Total P&L</div>
          <div className={`text-lg font-semibold ${latestData.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {latestData.pnl >= 0 ? '+' : ''}{latestData.pnl.toFixed(2)}
          </div>
          <div className="text-gray-500 text-[10px]">
            {data.length > 1 ? `From ${data[0].pnl.toFixed(2)}` : 'Single data point'}
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-gray-500">Current Exposure</div>
          <div className="text-lg font-semibold text-gray-800">
            {latestData.exposure.toFixed(2)}
          </div>
          <div className="text-gray-500 text-[10px]">
            Max: {Math.max(...data.map(d => d.exposure)).toFixed(2)}
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-gray-500">Balance</div>
          <div className="text-lg font-semibold text-gray-800">
            {latestData.balance.toFixed(2)}
          </div>
          <div className="text-gray-500 text-[10px]">
            {data.length > 1 ? `Change: ${(latestData.balance - data[0].balance).toFixed(2)}` : 'Starting balance'}
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-gray-500">Trades</div>
          <div className="text-lg font-semibold text-gray-800">
            {latestData.tradesCount}
          </div>
          <div className="text-gray-500 text-[10px]">
            Total: {data.reduce((sum, d) => sum + d.tradesCount, 0)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-2 w-6 rounded-sm bg-purple-600" />
          <span className="text-gray-600">Profit & Loss</span>
        </div>
        {showMultiple && (
          <>
            <div className="flex items-center gap-1">
              <div className="h-2 w-6 rounded-sm bg-amber-600" style={{ strokeDasharray: "3 3" }} />
              <span className="text-gray-600">Exposure</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-6 rounded-sm bg-blue-600" />
              <span className="text-gray-600">Balance</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// Helper function to format time
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h ago`;
  } else {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}

export default PerformanceChart;