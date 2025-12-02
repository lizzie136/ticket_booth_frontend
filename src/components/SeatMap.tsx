import type { SeatedAvailabilityResponse } from '../api/types';

interface SeatMapProps {
  availability: SeatedAvailabilityResponse;
  selectedSeats: Set<number>;
  onSeatToggle: (seatId: number) => void;
}

export const SeatMap = ({
  availability,
  selectedSeats,
  onSeatToggle,
}: SeatMapProps) => {
  const calculateTotal = () => {
    let total = 0;
    availability.sections.forEach((section) => {
      section.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (selectedSeats.has(seat.seatId)) {
            total += seat.price;
          }
        });
      });
    });
    return total;
  };

  const getSelectedCount = () => {
    return selectedSeats.size;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Select Seats</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span className="text-gray-600">Taken</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Selected</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {availability.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Section {section.section}
            </h4>
            
            <div className="space-y-3">
              {section.rows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    Row {row.row}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {row.seats.map((seat) => {
                      const isSelected = selectedSeats.has(seat.seatId);
                      const isAvailable = seat.available;
                      
                      return (
                        <button
                          key={seat.seatId}
                          type="button"
                          onClick={() => onSeatToggle(seat.seatId)}
                          disabled={!isAvailable}
                          className={`
                            px-3 py-2 rounded text-sm font-medium transition-colors
                            ${
                              !isAvailable
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }
                          `}
                          title={`${seat.label} - ${seat.ticketType} - $${seat.price.toFixed(2)}`}
                        >
                          {seat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {getSelectedCount()} seat{getSelectedCount() !== 1 ? 's' : ''} selected
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

