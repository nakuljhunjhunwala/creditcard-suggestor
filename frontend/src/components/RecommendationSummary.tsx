import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import type { RecommendationSummary as SummaryType, CreditCardRecommendation } from '../types';
import { 
  TrendingUp, 
  Target, 
  Award, 
  CheckCircle, 
  Star,
  DollarSign,
  Calendar,
  Zap
} from 'lucide-react';

interface RecommendationSummaryProps {
  summary: SummaryType;
  topRecommendation: CreditCardRecommendation;
  totalSpending: number;
  className?: string;
}

export const RecommendationSummary: React.FC<RecommendationSummaryProps> = ({
  summary,
  topRecommendation,
  totalSpending,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const savingsRate = totalSpending > 0 ? ((summary.totalEstimatedValue || summary.potentialSavings || 0) / totalSpending) * 100 : 0;
  const confidenceLevel = summary.confidenceLevel.toLowerCase();
  
  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'very high': return 'text-green-600 bg-green-50 border-green-200';
      case 'high': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactLevel = (savings: number, spending: number) => {
    const rate = spending > 0 ? (savings / spending) * 100 : 0;
    if (rate >= 5) return { level: 'Excellent', color: 'text-green-600', icon: '🚀' };
    if (rate >= 3) return { level: 'Very Good', color: 'text-blue-600', icon: '⭐' };
    if (rate >= 1.5) return { level: 'Good', color: 'text-yellow-600', icon: '👍' };
    if (rate >= 0.5) return { level: 'Fair', color: 'text-orange-600', icon: '👌' };
    return { level: 'Limited', color: 'text-gray-600', icon: '📊' };
  };

  const impact = getImpactLevel(summary.totalEstimatedValue || summary.potentialSavings || 0, totalSpending);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Your Personalized Recommendation
            </h2>
            <p className="text-blue-100">
              Based on your spending pattern analysis
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-1">{impact.icon}</div>
            <div className={`text-sm px-3 py-1 rounded-full bg-white/20 ${impact.color}`}>
              {impact.level} Impact
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Top Recommendation Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                #1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {topRecommendation.card.name}
                </h3>
                <p className="text-gray-600">
                  {topRecommendation.card.issuer.name} • {topRecommendation.card.network.name}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Star className="w-3 h-3 mr-1" />
              Best Match
            </Badge>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed">
            {topRecommendation.primaryReason}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(topRecommendation.estimatedAnnualCashback || topRecommendation.potentialSavings || 0)}
              </div>
              <div className="text-sm text-gray-600">Annual Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {topRecommendation.score.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Match Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {topRecommendation.signupBonusValue ? formatCurrency(topRecommendation.signupBonusValue) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Welcome Bonus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {topRecommendation.feeBreakeven ? `${topRecommendation.feeBreakeven}m` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Breakeven</div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Financial Impact
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Annual Savings Potential</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(summary.totalEstimatedValue || summary.potentialSavings || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Effective Savings Rate</span>
                <span className="font-bold text-blue-600">
                  {savingsRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Benefit</span>
                <span className="font-bold text-purple-600">
                  {formatCurrency((summary.totalEstimatedValue || summary.potentialSavings || 0) / 12)}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Savings Progress</span>
                <span>{savingsRate.toFixed(1)}% of spending</span>
              </div>
              <Progress value={Math.min(savingsRate * 10, 100)} className="h-2" />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Recommendation Quality
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Match Score</span>
                <span className="font-bold text-blue-600">
                  {summary.averageScore.toFixed(0)}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence Level</span>
                <Badge className={getConfidenceColor(confidenceLevel)}>
                  {summary.confidenceLevel}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Categories Analyzed</span>
                <span className="font-bold text-gray-900">
                  {summary.categoriesAnalyzed}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Match Quality</span>
                <span>{summary.averageScore.toFixed(0)}%</span>
              </div>
              <Progress value={summary.averageScore} className="h-2" />
            </div>
          </div>
        </div>

        {/* Quick Benefits */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            Why This Recommendation Works for You
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2">
              {topRecommendation.pros.slice(0, 3).map((pro, index) => (
                <li key={index} className="flex items-start text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{pro}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Award className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-gray-700">
                  Top {Math.round((topRecommendation.score / 100) * 100)}% match for your profile
                </span>
              </div>
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-700">
                  Save {savingsRate.toFixed(1)}% on your annual spending
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-gray-700">
                  {topRecommendation.feeBreakeven 
                    ? `Break even in ${topRecommendation.feeBreakeven} months`
                    : 'No fee to break even'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            Ready to start saving with your personalized recommendation?
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Apply for {topRecommendation.card.name}
            </button>
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold">
              View All Options
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
