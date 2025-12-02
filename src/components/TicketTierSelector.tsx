import type { Tier } from '../api/types';

interface TicketTierSelectorProps {
  tiers: Tier[];
  quantities: Record<number, number>;
  onQuantityChange: (tierId: number, quantity: number) => void;
}

export const TicketTierSelector = ({
  tiers,
  quantities,
  onQuantityChange,
}: TicketTierSelectorProps) => {
  const calculateTotal = () => {
    return tiers.reduce((total, tier) => {
      const qty = quantities[tier.id] || 0;
      return total + tier.price * qty;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Tickets</h3>
      
      <div className="space-y-4">
        {tiers.map((tier) => {
          const quantity = quantities[tier.id] || 0;
          const isAvailable = tier.remaining > 0;
          
          return (
            <div
              key={tier.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                  <p className="text-sm text-gray-600">
                    ${tier.price.toFixed(2)} per ticket
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {tier.remaining} remaining
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Quantity:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(tier.id, Math.max(0, quantity - 1))}
                    disabled={quantity === 0}
                    className="w-8 h-8 rounded border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={tier.remaining}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      onQuantityChange(tier.id, Math.min(val, tier.remaining));
                    }}
                    disabled={!isAvailable}
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => onQuantityChange(tier.id, Math.min(tier.remaining, quantity + 1))}
                    disabled={!isAvailable || quantity >= tier.remaining}
                    className="w-8 h-8 rounded border border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${(tier.price * quantity).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {!isAvailable && (
                <p className="text-sm text-red-600 mt-2">Sold out</p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {getTotalTickets()} ticket{getTotalTickets() !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total:</p>
            <p className="text-2xl font-bold text-gray-900">
              ${calculateTotal().toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

