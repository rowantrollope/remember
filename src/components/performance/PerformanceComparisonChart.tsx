"use client"

import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { PerformanceMetricsResponse } from '@/lib/api'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

interface PerformanceComparisonChartProps {
    metrics: PerformanceMetricsResponse
}

export function PerformanceComparisonChart({ metrics }: PerformanceComparisonChartProps) {
    // Calculate estimated performance without cache
    const cacheStats = metrics.performance_metrics?.cache_stats
    const totalRequests = cacheStats?.total_requests ?? 0
    const hitRatePercent = cacheStats?.hit_rate_percent ?? 0
    const hitRate = hitRatePercent / 100
    
    // For now, we'll use mock savings data since the API doesn't provide these fields yet
    const estimatedTimeSavings = 2.5 // seconds saved
    const estimatedCostSavings = 0.15 // dollars saved
    
    const estimatedTimeWithoutCache = hitRate > 0 ? estimatedTimeSavings / hitRate : estimatedTimeSavings * 2
    const estimatedCostWithoutCache = hitRate > 0 ? estimatedCostSavings / hitRate : estimatedCostSavings * 2

    const chartData = {
        labels: ['Response Time', 'API Costs', 'Hit Rate'],
        datasets: [
            {
                label: 'Without Cache',
                data: [
                    estimatedTimeWithoutCache,
                    estimatedCostWithoutCache,
                    0 // No hit rate without cache
                ],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
            },
            {
                label: 'With Cache',
                data: [
                    estimatedTimeWithoutCache - estimatedTimeSavings,
                    estimatedCostWithoutCache - estimatedCostSavings,
                    hitRatePercent
                ],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#374151',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const label = context.dataset.label || ''
                        const value = context.parsed.y
                        
                        if (context.dataIndex === 0) {
                            return `${label}: ${value.toFixed(1)}s`
                        } else if (context.dataIndex === 1) {
                            return `${label}: $${value.toFixed(2)}`
                        } else {
                            return `${label}: ${value.toFixed(1)}%`
                        }
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: '#6B7280'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: '#6B7280',
                    callback: function(value: any, index: number, values: any[]) {
                        // Different formatting based on the metric
                        const maxValue = Math.max(...values.map((v: any) => v.value))
                        if (maxValue > 100) {
                            // Time or cost values
                            return value.toFixed(1)
                        } else {
                            // Percentage values
                            return value + '%'
                        }
                    }
                }
            }
        }
    }

    return (
        <div className="h-64 w-full">
            <Bar data={chartData} options={options} />
        </div>
    )
}
