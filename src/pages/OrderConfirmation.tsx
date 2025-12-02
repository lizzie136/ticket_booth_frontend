import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder } from '../api/endpoints';
import type { Order } from '../api/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getOrder(parseInt(id));
        setOrder(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load order details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error || 'Order not found'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">Your tickets have been reserved.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Order #{order.id}
        </h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium text-gray-900">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order Date:</span>
            <span className="font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-900 font-semibold">Total Amount:</span>
            <span className="font-bold text-gray-900">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tickets ({order.tickets.length})
          </h3>
          
          <div className="space-y-4">
            {order.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {ticket.eventTitle}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(ticket.eventDate).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Ticket Type:</span>{' '}
                        {ticket.ticketType}
                      </p>
                      {ticket.seatLabel && (
                        <p className="text-gray-600">
                          <span className="font-medium">Seat:</span>{' '}
                          {ticket.seatLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">Ticket #{ticket.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse More Events
        </Link>
      </div>
    </div>
  );
};

