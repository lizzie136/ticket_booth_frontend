import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api/endpoints';
import type { Order } from '../api/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { getStoredAuth, AUTH_STORAGE_KEY, type StoredAuthState } from '../utils/auth';

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<StoredAuthState | null>(() => getStoredAuth());

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
    if (!authState?.user.id) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrders(authState.user.id);
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load your orders. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [authState]);

  if (!authState?.user.id) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Orders</h1>
        <p className="text-gray-600 mb-6">
          Please log in to view your past orders.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-3">Your Orders</h1>
        <p className="text-gray-600">You haven't placed any orders yet.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const primaryTicket = order.tickets[0];

          return (
            <Link
              to={`/orders/${order.id}`}
              key={order.id}
              className="block border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">
                  {primaryTicket?.eventTitle || `Order #${order.id}`}
                </span>
                <span className="text-sm text-gray-600">#{order.id}</span>
              </div>

              {primaryTicket && (
                <div className="text-sm text-gray-700 mb-1">
                  {new Date(primaryTicket.eventDate).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}

              <div className="text-sm text-gray-600 flex flex-wrap gap-2">
                <span>
                  Placed:{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>· Tickets: {order.tickets.length}</span>
                <span>· Total: ${order.totalAmount.toFixed(2)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
