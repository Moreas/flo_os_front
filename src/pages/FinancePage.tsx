import React from 'react';

const FinancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Finance</h1>
        <p className="mt-2 text-gray-600">
          Track your financial goals, expenses, and investments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Cards */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-2xl font-semibold text-gray-900">$0.00</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Monthly Savings</p>
              <p className="text-2xl font-semibold text-gray-900">$0.00</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
          <div className="text-sm text-gray-500">
            No transactions yet.
          </div>
        </div>

        {/* Financial Goals */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Goals</h2>
          <div className="text-sm text-gray-500">
            No financial goals set yet.
          </div>
        </div>

        {/* Investment Portfolio */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Portfolio</h2>
          <div className="text-sm text-gray-500">
            No investments tracked yet.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage; 