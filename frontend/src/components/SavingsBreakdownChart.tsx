import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import type { BenefitBreakdown } from '../types';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface SavingsBreakdownChartProps {
  breakdown: BenefitBreakdown[];
  totalSavings: number;
  className?: string;
}

export const SavingsBreakdownChart: React.FC<SavingsBreakdownChartProps> = ({
  breakdown,
  totalSavings,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getImpactColor = (savings: number) => {
    const percentage = totalSavings > 0 ? (savings / totalSavings) * 100 : 0;
    if (percentage >= 40) return 'bg-green-500';
    if (percentage >= 20) return 'bg-blue-500';
    if (percentage >= 10) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getImpactLevel = (savings: number) => {
    const percentage = totalSavings > 0 ? (savings / totalSavings) * 100 : 0;
    if (percentage >= 40) return 'High Impact';
    if (percentage >= 20) return 'Medium Impact';
    if (percentage >= 10) return 'Low Impact';
    return 'Minimal Impact';
  };

  const sortedBreakdown = [...breakdown].sort((a, b) => (b.savingsAmount || 0) - (a.savingsAmount || 0));

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Savings Breakdown by Category
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalSavings)}
          </div>
          <div className="text-sm text-gray-500">Total Annual Savings</div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedBreakdown.map((item, index) => {
          const savings = item.savingsAmount || 0;
          const savingsPercentage = totalSavings > 0 ? (savings / totalSavings) * 100 : 0;
          const rateImprovement = item.cardRate - item.currentRate;
          
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${savings > 0 ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    {getImpactLevel(savings)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {formatCurrency(savings)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {savingsPercentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Amount Spent</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.spentAmount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Current Rate</div>
                  <div className="font-semibold text-gray-700">
                    {formatPercentage(item.currentRate)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Card Rate</div>
                  <div className="font-semibold text-green-600">
                    {formatPercentage(item.cardRate)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Improvement</div>
                  <div className="font-semibold text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{formatPercentage(rateImprovement)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Reward Rate Comparison</span>
                  <span>{formatPercentage(item.cardRate)} vs {formatPercentage(item.currentRate)}</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={(item.cardRate / Math.max(item.cardRate, item.currentRate, 5)) * 100} 
                    className="h-2"
                  />
                  <div 
                    className="absolute top-0 h-2 bg-gray-300 rounded-full opacity-50"
                    style={{ 
                      width: `${(item.currentRate / Math.max(item.cardRate, item.currentRate, 5)) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Current: {formatPercentage(item.currentRate)}</span>
                  <span className="text-green-600">With Card: {formatPercentage(item.cardRate)}</span>
                </div>
              </div>

              {/* Visual impact bar */}
              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getImpactColor(savings)}`}
                      style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 min-w-0">
                    {savingsPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {breakdown.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No category breakdown available</p>
        </div>
      )}

      {/* Summary */}
      {breakdown.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {breakdown.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(breakdown.reduce((sum, item) => sum + item.spentAmount, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Spending</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-lg font-bold text-green-600">
                {formatPercentage(
                  breakdown.reduce((sum, item) => sum + item.spentAmount, 0) > 0
                    ? (totalSavings / breakdown.reduce((sum, item) => sum + item.spentAmount, 0)) * 100
                    : 0
                )}
              </div>
              <div className="text-sm text-gray-600">Effective Savings Rate</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
