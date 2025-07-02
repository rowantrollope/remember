"use client"

import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { PerformanceMetricsResponse } from '@/lib/api'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

interface CacheHitRateChartProps {
    metrics: PerformanceMetricsResponse
}

export function CacheHitRateChart({ metrics }: CacheHitRateChartProps) {
    // Generate sample time series data (in a real implementation, this would come from the API)
    const generateTimeSeriesData = () => {
        const now = new Date()
        const data = []
        const labels = []
        
        // Generate last 24 hours of data points (every hour)
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000)
            labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            
            // Simulate hit rate data with some variation around the current hit rate
            const baseRate = metrics.performance_metrics?.cache_stats?.hit_rate_percent ?? 0
            const variation = (Math.random() - 0.5) * 20 // ±10% variation
            const hitRate = Math.max(0, Math.min(100, baseRate + variation))
            data.push(hitRate)
        }
        
        return { labels, data }
    }

    const { labels, data } = generateTimeSeriesData()

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Cache Hit Rate (%)',
                data,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: 'rgb(59, 130, 246)',
                pointRadius: 3,
                pointHoverRadius: 5,
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        return `Hit Rate: ${context.parsed.y.toFixed(1)}%`
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Time',
                    color: '#6B7280'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: '#6B7280',
                    maxTicksLimit: 8
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Hit Rate (%)',
                    color: '#6B7280'
                },
                min: 0,
                max: 100,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: '#6B7280',
                    callback: function(value: any) {
                        return value + '%'
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        },
        elements: {
            point: {
                hoverRadius: 8
            }
        }
    }

    return (
        <div className="h-64 w-full">
            <Line data={chartData} options={options} />
        </div>
    )
}
