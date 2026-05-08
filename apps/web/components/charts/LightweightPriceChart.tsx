"use client";

import React, { memo, useMemo } from "react";

export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  side: "BACK" | "LAY";
}

interface LightweightPriceChartProps {
  data: PriceDataPoint[];
  height?: number;
  width?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}

const LightweightPriceChart = memo(function LightweightPriceChart({
  data,
  height = 200,
  width = 400,
  showGrid = true,
  showTooltip = true,
}: LightweightPriceChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    price: number;
    time: string;
    volume: number;
    side: string;
  } | null>(null);

  // Process data for chart
  const { points, minPrice, maxPrice, minTime, maxTime } = useMemo(() => {
    if (!data.length) {
      return { points: [], minPrice: 0, maxPrice: 10, minTime: 0, maxTime: 1 };
    }

    const prices = data.map(d => d.price);
    const times = data.map(d => d.timestamp);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const priceRange = maxPrice - minPrice || 1;
    const timeRange = maxTime - minTime || 1;
    
    // Normalize points for SVG coordinates
    const points = data.map((point, index) => {
      const x = ((point.timestamp - minTime) / timeRange) * (width - 40) + 20;
      const y = height - 20 - ((point.price - minPrice) / priceRange) * (height - 40);
      return { x, y, ...point };
    });

    return { points, minPrice, maxPrice, minTime, maxTime };
  }, [data, height, width]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return { horizontal: [], vertical: [] };
    
    const horizontalLines = [];
    const verticalLines = [];
    
    // 5 horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = 20 + (i * (height - 40)) / 5;
      const price = maxPrice - (i * (maxPrice - minPrice)) / 5;
      horizontalLines.push({ y, price: price.toFixed(2) });
    }
    
    // 5 vertical lines
    for (let i = 0; i <= 5; i++) {
      const x = 20 + (i * (width - 40)) / 5;
      verticalLines.push({ x });
    }
    
    return { horizontal: horizontalLines, vertical: verticalLines };
  }, [showGrid, height, width, minPrice, maxPrice]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || !points.length) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Find closest point
    let closestPoint = points[0];
    let minDistance = Math.abs(points[0].x - x);
    
    for (const point of points) {
      const distance = Math.abs(point.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    setTooltip({
      x: closestPoint.x,
      y: closestPoint.y,
      price: closestPoint.price,
      time: formatTime(closestPoint.timestamp),
      volume: closestPoint.volume,
      side: closestPoint.side,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

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

  // Create SVG path for line
  const pathData = points.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="relative" ref={chartRef}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Price Chart</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-blue-500" />
            <span>Current: {data[data.length - 1]?.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-green-500" />
            <span>High: {maxPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-sm bg-red-500" />
            <span>Low: {minPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="relative rounded-lg border border-gray-200 bg-white p-4">
        <svg
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Grid background */}
          {showGrid && (
            <>
              {/* Horizontal grid lines */}
              {gridLines.horizontal.map((line, i) => (
                <g key={`h-${i}`}>
                  <line
                    x1="20"
                    y1={line.y}
                    x2={width - 20}
                    y2={line.y}
                    stroke="#f0f0f0"
                    strokeWidth="1"
                  />
                  <text
                    x="10"
                    y={line.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#666"
                  >
                    {line.price}
                  </text>
                </g>
              ))}
              
              {/* Vertical grid lines */}
              {gridLines.vertical.map((line, i) => (
                <line
                  key={`v-${i}`}
                  x1={line.x}
                  y1="20"
                  x2={line.x}
                  y2={height - 20}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
              ))}
            </>
          )}

          {/* Chart area gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under line */}
          <path
            d={`${pathData} L ${points[points.length - 1]?.x || 0} ${height - 20} L 20 ${height - 20} Z`}
            fill="url(#chartGradient)"
          />

          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#3b82f6"
              className="opacity-0 hover:opacity-100"
            />
          ))}

          {/* Tooltip line */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x}
                y1="20"
                x2={tooltip.x}
                y2={height - 20}
                stroke="#666"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={tooltip.x}
                cy={tooltip.y}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
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
        </svg>

        {/* Tooltip */}
        {tooltip && showTooltip && (
          <div
            className="absolute z-10 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
            style={{
              left: `${(tooltip.x / width) * 100}%`,
              top: `${(tooltip.y / height) * 100 - 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="space-y-1 text-xs">
              <div className="font-semibold">Price: {tooltip.price.toFixed(2)}</div>
              <div className="text-gray-600">Time: {tooltip.time}</div>
              <div className="text-gray-600">Volume: {tooltip.volume.toLocaleString()}</div>
              <div className={`font-medium ${tooltip.side === "BACK" ? "text-green-600" : "text-red-600"}`}>
                Side: {tooltip.side}
              </div>
            </div>
          </div>
        )}

        {/* Time labels */}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{formatTime(minTime)}</span>
          <span>{formatTime((minTime + maxTime) / 2)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>
      </div>
    </div>
  );
});

// Helper function to format time
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default LightweightPriceChart;