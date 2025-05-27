import { Card } from "./ui/card"

interface BusinessValuationProps {
  business: {
    sde?: number;
    valuation_multiple?: number;
    gross_valuation?: number;
    sale_cost?: number;
    net_cash_if_sold?: number;
  }
}

export function BusinessValuation({ business }: BusinessValuationProps) {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-2">Valuation Summary</h2>
      <ul className="space-y-1">
        <li><strong>SDE:</strong> ${business.sde?.toLocaleString()}</li>
        <li><strong>Valuation Multiple:</strong> {business.valuation_multiple}×</li>
        <li><strong>Gross Valuation:</strong> ${business.gross_valuation?.toLocaleString()}</li>
        <li><strong>Sale Cost:</strong> ${business.sale_cost?.toLocaleString()}</li>
        <li><strong>Net Cash if Sold:</strong> <span className="text-green-700 font-semibold">${business.net_cash_if_sold?.toLocaleString()}</span></li>
      </ul>
    </Card>
  );
} 