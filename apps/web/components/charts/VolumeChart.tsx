"use client";

import React, { memo, useMemo } from "react";

export interface VolumeDataPoint {
  timestamp: number;
  backVolume: number;
  layVolume: number;
  totalVolume: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
  width?: number;
  showCumulative?: boolean;
}

const VolumeChart = memo(function VolumeChart({
  data,
  height = 150,
  width = 400,
  showCumulative = false,
}: VolumeChartProps) {
  // Process data for chart
  const { bars, maxVolume, minTime, maxTime } = useMemo(() => {
    if (!data.length) {
      return { bars: [], maxVolume: 1000, minTime: 0, maxTime: 1 };
    }

    const volumes = data.map(d => d.totalVolume);
    const times = data.map(d => d.timestamp);
    
    const maxVolume = Math.max(...volumes) || 1000;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const timeRange = maxTime - minTime || 1;
    const barWidth = (width - 40) / data.length;
    
    // Create bars
    const bars = data.map((point, index) => {
      const x = 20 + (index * barWidth);
      const backHeight = (point.backVolume / maxVolume) * (height - 40);
      const layHeight = (point.layVolume / maxVolume) * (height - 40);
      const totalHeight = (point.totalVolume / maxVolume) * (height - 40);
      
      return {
        x,
        barWidth: barWidth * 0.8,
        backHeight,
        layHeight,
        totalHeight,
        backY: height - 20 - backHeight,
        layY: height - 20 - layHeight,
        totalY: height - 20 - totalHeight,
        ...point,
      };
    });

    return { bars, maxVolume, minTime, maxTime };
  }, [data, height, width]);

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <div className="text-4xl">📊</div>
          <p className="mt-2 text-sm text-gray-500">No volume data available</p>
        </div>
      </div>
    );
  }

  // Calculate cumulative volume if needed
  const cumulativeData = useMemo(() => {
    if (!showCumulative || !data.length) return [];
    
    let backCumulative = 0;
    let layCumulative = 0;
    
    return data.map((point, index) => {
      backCumulative += point.backVolume;
      layCumulative += point.layVolume;
      
      const x = 20 + (index * (width - 40) / data.length);
      const backHeight = (backCumulative / maxVolume) * (height - 40);
      const layHeight = (layCumulative / maxVolume) * (height - 40);
      
      return {
        x,
        backHeight,
        layHeight,
        backCumulative,
        layCumulative,
        time: point.timestamp,
      };
    });
  }, [data, showCumulative, maxVolume, height, width]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Trading Volume</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-500" />
            <span>Back: {data.reduce((sum, d) => sum + d.backVolume, 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <span>Lay: {data.reduce((sum, d) => sum + d.layVolume, 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-blue-500" />
            <span>Total: {data.reduce((sum, d) => sum + d.totalVolume, 0).toLocaleString()}</span>
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
            y1="20"
            x2={width - 20}
            y2="20"
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
            y1={height - 20}
            x2={width - 20}
            y2={height - 20}
            stroke="#f0f0f0"
            strokeWidth="1"
          />

          {/* Volume bars */}
          {bars.map((bar, i) => (
            <g key={i}>
              {/* Back volume (green) */}
              <rect
                x={bar.x}
                y={bar.backY}
                width={bar.barWidth}
                height={bar.backHeight}
                fill="#10b981"
                fillOpacity="0.7"
                rx="2"
              />
              
              {/* Lay volume (red) - stacked on top of back */}
              <rect
                x={bar.x}
                y={bar.layY}
                width={bar.barWidth}
                height={bar.layHeight}
                fill="#ef4444"
                fillOpacity="0.7"
                rx="2"
              />
              
              {/* Total volume outline */}
              <rect
                x={bar.x}
                y={bar.totalY}
                width={bar.barWidth}
                height={bar.totalHeight}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1"
                rx="2"
              />
            </g>
          ))}

          {/* Cumulative lines if enabled */}
          {showCumulative && cumulativeData.length > 0 && (
            <>
              {/* Back cumulative line */}
              <polyline
                points={cumulativeData.map(d => `${d.x},${height - 20 - d.backHeight}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              
              {/* Lay cumulative line */}
              <polyline
                points={cumulativeData.map(d => `${d.x},${height - 20 - d.layHeight}`).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </>
          )}

          {/* Axes */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2={height - 20}
            stroke="#666"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1={height - 20}
            x2={width - 20}
            y2={height - 20}
            stroke="#666"
            strokeWidth="1"
          />

          {/* Volume labels */}
          <text x="10" y="25" textAnchor="end" fontSize="10" fill="#666">
            {formatVolume(maxVolume)}
          </text>
          <text x="10" y={height / 2 + 3} textAnchor="end" fontSize="10" fill="#666">
            {formatVolume(maxVolume / 2)}
          </text>
          <text x="10" y={height - 25} textAnchor="end" fontSize="10" fill="#666">
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

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm bg-green-500/70" />
          <span className="text-gray-600">Back Volume</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm bg-red-500/70" />
          <span className="text-gray-600">Lay Volume</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-6 rounded-sm border border-blue-500 bg-transparent" />
          <span className="text-gray-600">Total Volume</span>
        </div>
        {showCumulative && (
          <>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-6 bg-green-500" style={{ strokeDasharray: "3 3" }} />
              <span className="text-gray-600">Back Cumulative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-6 bg-red-500" style={{ strokeDasharray: "3 3" }} />
              <span className="text-gray-600">Lay Cumulative</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// Helper functions
function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default VolumeChart;