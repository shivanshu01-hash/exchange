"use client";

import React, { memo, useState, useMemo, useEffect } from "react";
import LightweightPriceChart, { PriceDataPoint } from "./LightweightPriceChart";
import VolumeChart, { VolumeDataPoint } from "./VolumeChart";
import PerformanceChart, { PerformanceDataPoint } from "./PerformanceChart";

export type ChartType = "price" | "volume" | "performance" | "combined";

export interface ChartContainerProps {
  type?: ChartType;
  priceData?: PriceDataPoint[];
  volumeData?: VolumeDataPoint[];
  performanceData?: PerformanceDataPoint[];
  title?: string;
  height?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
}

const ChartContainer = memo(function ChartContainer({
  type = "price",
  priceData = [],
  volumeData = [],
  performanceData = [],
  title,
  height = 300,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  onRefresh,
}: ChartContainerProps) {
  const [activeTab, setActiveTab] = useState<ChartType>(type);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "4h" | "1d" | "1w">("1h");

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      onRefresh();
      // Simulate refresh completion
      setTimeout(() => setIsRefreshing(false), 1000);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Generate sample data if none provided (for demo purposes)
  const demoPriceData = useMemo(() => {
    if (priceData.length > 0) return priceData;
    
    const now = Date.now();
    const data: PriceDataPoint[] = [];
    
    for (let i = 0; i < 20; i++) {
      const timestamp = now - (19 - i) * 60000; // Last 20 minutes
      const basePrice = 1.5 + Math.random() * 0.5;
      const trend = Math.sin(i * 0.3) * 0.2;
      const noise = (Math.random() - 0.5) * 0.1;
      const price = basePrice + trend + noise;
      
      data.push({
        timestamp,
        price,
        volume: Math.floor(Math.random() * 1000) + 100,
        side: Math.random() > 0.5 ? "BACK" : "LAY",
      });
    }
    
    return data;
  }, [priceData]);

  const demoVolumeData = useMemo(() => {
    if (volumeData.length > 0) return volumeData;
    
    const now = Date.now();
    const data: VolumeDataPoint[] = [];
    
    for (let i = 0; i < 15; i++) {
      const timestamp = now - (14 - i) * 120000; // Last 30 minutes
      const backVolume = Math.floor(Math.random() * 5000) + 1000;
      const layVolume = Math.floor(Math.random() * 4000) + 800;
      const totalVolume = backVolume + layVolume;
      
      data.push({
        timestamp,
        backVolume,
        layVolume,
        totalVolume,
      });
    }
    
    return data;
  }, [volumeData]);

  const demoPerformanceData = useMemo(() => {
    if (performanceData.length > 0) return performanceData;
    
    const now = Date.now();
    const data: PerformanceDataPoint[] = [];
    let pnl = 0;
    let exposure = 1000;
    let balance = 5000;
    
    for (let i = 0; i < 10; i++) {
      const timestamp = now - (9 - i) * 3600000; // Last 10 hours
      const pnlChange = (Math.random() - 0.5) * 200;
      pnl += pnlChange;
      exposure += (Math.random() - 0.5) * 200;
      balance += pnlChange;
      
      data.push({
        timestamp,
        pnl,
        exposure: Math.max(0, exposure),
        balance: Math.max(0, balance),
        tradesCount: Math.floor(Math.random() * 5) + 1,
      });
    }
    
    return data;
  }, [performanceData]);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const renderChart = () => {
    switch (activeTab) {
      case "price":
        return (
          <LightweightPriceChart
            data={demoPriceData}
            height={height}
            showGrid={true}
            showTooltip={true}
          />
        );
      
      case "volume":
        return (
          <VolumeChart
            data={demoVolumeData}
            height={height}
            showCumulative={true}
          />
        );
      
      case "performance":
        return (
          <PerformanceChart
            data={demoPerformanceData}
            height={height}
            showMultiple={true}
          />
        );
      
      case "combined":
        return (
          <div className="space-y-6">
            <LightweightPriceChart
              data={demoPriceData}
              height={height * 0.6}
              showGrid={true}
              showTooltip={true}
            />
            <VolumeChart
              data={demoVolumeData}
              height={height * 0.4}
              showCumulative={false}
            />
          </div>
        );
      
      default:
        return (
          <LightweightPriceChart
            data={demoPriceData}
            height={height}
            showGrid={true}
            showTooltip={true}
          />
        );
    }
  };

  const getChartTitle = () => {
    if (title) return title;
    
    switch (activeTab) {
      case "price": return "Price Movement";
      case "volume": return "Trading Volume";
      case "performance": return "Performance Overview";
      case "combined": return "Market Overview";
      default: return "Chart";
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="text-2xl">
            {activeTab === "price" && "📈"}
            {activeTab === "volume" && "📊"}
            {activeTab === "performance" && "💰"}
            {activeTab === "combined" && "📋"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{getChartTitle()}</h3>
            <p className="text-xs text-gray-500">
              {activeTab === "price" && "Real-time price movements with volume"}
              {activeTab === "volume" && "Back vs Lay trading volume analysis"}
              {activeTab === "performance" && "PnL, exposure, and balance tracking"}
              {activeTab === "combined" && "Complete market overview"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
            {["15m", "1h", "4h", "1d", "1w"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {(["price", "volume", "performance", "combined"] as ChartType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "price" && "Price Chart"}
              {tab === "volume" && "Volume"}
              {tab === "performance" && "Performance"}
              {tab === "combined" && "Combined"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      <div className="p-4">
        {renderChart()}
      </div>

      {/* Footer stats */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="text-center">
            <div className="text-gray-500">Data Points</div>
            <div className="font-semibold text-gray-900">
              {activeTab === "price" && demoPriceData.length}
              {activeTab === "volume" && demoVolumeData.length}
              {activeTab === "performance" && demoPerformanceData.length}
              {activeTab === "combined" && `${demoPriceData.length}+${demoVolumeData.length}`}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500">Time Range</div>
            <div className="font-semibold text-gray-900">{timeRange}</div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500">Auto Refresh</div>
            <div className="font-semibold text-gray-900">
              {autoRefresh ? "On" : "Off"}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-500">Last Updated</div>
            <div className="font-semibold text-gray-900">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChartContainer;