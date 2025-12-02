import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { EventsList } from './pages/EventsList';
import { EventDateDetail } from './pages/EventDateDetail';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Login } from './pages/Login';  
import { SignUp } from './pages/SignUp';
import Orders from './pages/Orders';
import { Navigation } from './components/Navigation'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Ticketbooth
              </Link>
            </h1>
            <Navigation />
          </div>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<EventsList />} />
            <Route path="/event-dates/:id" element={<EventDateDetail />} />
            <Route path="/orders/:id" element={<OrderConfirmation />} />
            <Route path='/orders' element={<Orders/>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-gray-600 text-sm">
              © 2025 Ticketbooth. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

