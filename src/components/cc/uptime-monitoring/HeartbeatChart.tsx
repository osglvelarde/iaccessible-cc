"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MonitorBeat, UptimeStatus } from "@/lib/uptime-kuma-api";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeartbeatChartProps {
  beats: MonitorBeat[];
  className?: string;
}

/**
 * Chart component for displaying monitor heartbeat response times over the last hour
 */
export function HeartbeatChart({ beats, className }: HeartbeatChartProps) {
  // Track if component is mounted to avoid rendering ResponsiveContainer before dimensions are available
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure container has dimensions before rendering chart
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Transform beats data for chart
  const chartData = useMemo(() => {
    if (!beats || beats.length === 0) {
      return [];
    }

    // Sort by time (oldest first)
    const sortedBeats = [...beats].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });

    // Transform to chart format
    return sortedBeats.map((beat) => {
      const timestamp = new Date(beat.time);
      return {
        time: format(timestamp, "HH:mm:ss"),
        timestamp: timestamp.getTime(),
        responseTime: beat.ping,
        status: beat.status,
        statusLabel: beat.status === 1 ? "Up" : beat.status === 0 ? "Down" : "Pending",
        message: beat.msg || "",
        date: format(timestamp, "MMM dd, yyyy HH:mm:ss"),
      };
    });
  }, [beats]);

  // Calculate chart statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        upCount: 0,
        downCount: 0,
      };
    }

    const responseTimes = chartData.map((d) => d.responseTime).filter((t) => t > 0);
    const upCount = chartData.filter((d) => d.status === 1).length;
    const downCount = chartData.filter((d) => d.status === 0).length;

    return {
      avgResponseTime: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      upCount,
      downCount,
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const beat = beats.find(b => {
        const beatTime = new Date(b.time).getTime();
        return Math.abs(beatTime - data.timestamp) < 1000; // Within 1 second
      });
      
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-sm font-medium">{data.date}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={
                  data.status === 1
                    ? "text-green-600 dark:text-green-400"
                    : data.status === 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }
              >
                {data.statusLabel}
              </span>
              {beat?.important && (
                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">⚠ Important</span>
              )}
            </p>
            <p className="text-sm">
              <span className="font-medium">Response Time:</span> {data.responseTime}ms
            </p>
            {beat?.duration && beat.duration > 0 && (
              <p className="text-xs text-muted-foreground">
                Duration: {beat.duration}s
              </p>
            )}
            {beat?.down_count !== undefined && beat.down_count > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Down Count: {beat.down_count} consecutive
              </p>
            )}
            {data.message && (
              <p className="text-xs text-muted-foreground mt-1 break-words">
                <span className="font-medium">Message:</span> {data.message}
              </p>
            )}
            {beat && (
              <p className="text-xs text-muted-foreground mt-1">
                Beat ID: {beat.id}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Heartbeat History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No heartbeat data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Heartbeat History (Last Hour)</CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Avg: <span className="font-medium text-foreground">{stats.avgResponseTime}ms</span>
            </span>
            <span>
              Up: <span className="font-medium text-green-600 dark:text-green-400">{stats.upCount}</span>
            </span>
            <span>
              Down: <span className="font-medium text-red-600 dark:text-red-400">{stats.downCount}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-h-[256px] min-w-[300px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Show fewer labels to avoid crowding
                  const index = chartData.findIndex((d) => d.time === value);
                  if (chartData.length <= 10) return value;
                  if (index % Math.ceil(chartData.length / 10) === 0) return value;
                  return "";
                }}
                className="text-muted-foreground"
              />
              <YAxis
                label={{ value: "Response Time (ms)", angle: -90, position: "insideLeft" }}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={stats.avgResponseTime}
                stroke="#8884d8"
                strokeDasharray="3 3"
                label={{ value: "Avg", position: "right" }}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#8884d8"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  const color =
                    payload.status === 1
                      ? "#22c55e" // green
                      : payload.status === 0
                      ? "#ef4444" // red
                      : "#eab308"; // yellow
                  return <circle key={`dot-${payload.timestamp}-${index}`} cx={cx} cy={cy} r={3} fill={color} />;
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

