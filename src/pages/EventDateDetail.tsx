import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEventDate,
  getAvailability,
  createBooking,
  getBookingError,
} from '../api/endpoints';
import type {
  EventDate,
  AvailabilityResponse,
  GABookingRequest,
  SeatedBookingRequest,
  TicketTierName,
} from '../api/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { TicketTierSelector } from '../components/TicketTierSelector';
import { SeatMap } from '../components/SeatMap';
import { getStoredAuth, AUTH_STORAGE_KEY, type StoredAuthState } from '../utils/auth';

export const EventDateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [eventDate, setEventDate] = useState<EventDate | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [authState, setAuthState] = useState<StoredAuthState | null>(() => getStoredAuth());
  const [customerName, setCustomerName] = useState('');
  const [gaQuantities, setGaQuantities] = useState<Record<number, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
  
  // Booking state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const [eventDateData, availabilityData] = await Promise.all([
        getEventDate(parseInt(id)),
        getAvailability(parseInt(id)),
      ]);
      setEventDate(eventDateData);
      setAvailability(availabilityData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load event details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setAuthState(getStoredAuth());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (authState?.user) {
      setCustomerName(`${authState.user.firstName} ${authState.user.lastName}`.trim());
    } else {
      setCustomerName('');
    }
  }, [authState]);

  const handleGATierQuantityChange = (tierId: number, quantity: number) => {
    setGaQuantities((prev) => ({
      ...prev,
      [tierId]: quantity,
    }));
  };

  const handleSeatToggle = (seatId: number) => {
    setSelectedSeats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seatId)) {
        newSet.delete(seatId);
      } else {
        newSet.add(seatId);
      }
      return newSet;
    });
  };

  const validateForm = (): boolean => {
    if (!authState?.user.id) {
      setBookingError('Please log in to book tickets');
      return false;
    }

    if (!customerName.trim()) {
      setBookingError('Please enter a name for the tickets');
      return false;
    }

    if (eventDate?.seatingMode === 'GA') {
      const totalTickets = Object.values(gaQuantities).reduce(
        (sum, qty) => sum + qty,
        0
      );
      if (totalTickets === 0) {
        setBookingError('Please select at least one ticket');
        return false;
      }
    } else if (eventDate?.seatingMode === 'SEATED') {
      if (selectedSeats.size === 0) {
        setBookingError('Please select at least one seat');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (
      !validateForm() ||
      !eventDate ||
      !availability ||
      !id ||
      !authState?.user.id ||
      !customerName.trim()
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      let bookingRequest: GABookingRequest | SeatedBookingRequest;

      if (eventDate.seatingMode === 'GA' && availability.seatingMode === 'GA') {
        const tiers = Object.entries(gaQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([tierId, qty]) => ({
            ticketTypeId: parseInt(tierId),
            quantity: qty,
          }));

        bookingRequest = {
          eventDateId: parseInt(id),
          customerName: customerName.trim(),
          userId: authState.user.id,
          paymentSource: 'test-card-4242',
          tiers,
        };
      } else if (
        eventDate.seatingMode === 'SEATED' &&
        availability.seatingMode === 'SEATED'
      ) {
        // Get ticket type IDs for selected seats
        const seats = availability.sections
          .flatMap((s) => s.rows.flatMap((r) => r.seats))
          .filter((seat) => selectedSeats.has(seat.seatId));

        // Map seats to booking request format
        // Note: If ticketTypeId is not in the seat object, we need to fetch it
        // For now, we'll use a mapping based on ticket type name
        // In production, the API should include ticketTypeId in the seat object
        const seatEntries = seats.map((seat) => {
          // If ticketTypeId is provided, use it; otherwise create a mapping
          // This is a workaround - ideally the API should provide ticketTypeId
          let ticketTypeId = seat.ticketTypeId;
          
          if (!ticketTypeId) {
            // Fallback mapping - in production, this should come from the API
            // VIP = 1, FRONT_ROW = 2, GA = 3 (common pattern, but may vary)
            const typeMap: Record<TicketTierName, number> = {
              VIP: 1,
              FRONT_ROW: 2,
              GA: 3,
            };
            ticketTypeId = typeMap[seat.ticketType] || 1;
          }
          
          return {
            seatId: seat.seatId,
            ticketTypeId,
          };
        });

        bookingRequest = {
          eventDateId: parseInt(id),
          customerName: customerName.trim(),
          userId: authState.user.id,
          paymentSource: 'test-card-4242',
          seats: seatEntries,
        };
      } else {
        throw new Error('Invalid seating mode');
      }

      const response = await createBooking(bookingRequest);
      navigate(`/orders/${response.orderId}`);
    } catch (err) {
      const bookingErr = getBookingError(err);
      if (bookingErr) {
        setBookingError(bookingErr.message);
        // Refetch availability to update the UI
        if (id) {
          try {
            const updatedAvailability = await getAvailability(parseInt(id));
            setAvailability(updatedAvailability);
          } catch {
            // Ignore refetch errors
          }
        }
      } else {
        setBookingError(
          err instanceof Error
            ? err.message
            : 'Failed to create booking. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !eventDate || !availability) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error || 'Event not found'}
          onRetry={fetchData}
        />
      </div>
    );
  }

  const hasTicketsSelected =
    eventDate.seatingMode === 'GA'
      ? Object.values(gaQuantities).some((qty) => qty > 0)
      : selectedSeats.size > 0;

  const isFormValid =
    Boolean(authState?.user.id) && Boolean(customerName.trim()) && hasTicketsSelected;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {eventDate.event.title}
        </h1>
        <p className="text-gray-600 mb-4">{eventDate.event.description}</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {new Date(eventDate.date).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Venue</p>
              <p className="font-semibold text-gray-900">
                {eventDate.venue.name}
              </p>
              <p className="text-sm text-gray-600">
                Capacity: {eventDate.venue.capacity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {eventDate.seatingMode === 'GA' && availability.seatingMode === 'GA' && (
          <TicketTierSelector
            tiers={availability.tiers}
            quantities={gaQuantities}
            onQuantityChange={handleGATierQuantityChange}
          />
        )}

        {eventDate.seatingMode === 'SEATED' &&
          availability.seatingMode === 'SEATED' && (
            <SeatMap
              availability={availability}
              selectedSeats={selectedSeats}
              onSeatToggle={handleSeatToggle}
            />
          )}

        <div className="border-t border-gray-200 pt-6">
          <div className="space-y-4">
            {authState ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Booking as{' '}
                    <span className="font-semibold text-gray-900">
                      {authState.user.firstName} {authState.user.lastName}
                    </span>{' '}
                    ({authState.user.email})
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="customerName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Name on Tickets <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the attendee name"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  Please log in or create an account to complete your booking.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}

            {bookingError && <ErrorMessage message={bookingError} />}

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Book Tickets'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
