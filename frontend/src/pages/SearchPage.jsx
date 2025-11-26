import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import EventCard from '../components/EventCard';
import { api } from '../utils/api.ts';
import { useFavorites } from '../utils/favorites';

function SearchPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const { init, initialized } = useFavorites();

  // Restore search state from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('searchPageState');
    if (savedState) {
      const { events: savedEvents, searched: wasSearched } = JSON.parse(savedState);
      setEvents(savedEvents || []);
      setSearched(wasSearched || false);
    }
  }, []);

  // Initialize favorites on mount (non-blocking)
  useEffect(() => {
    if (!initialized) {
      init().catch(err => {
        console.error('Failed to initialize favorites:', err);
        // Don't block the UI if favorites fail to load
      });
    }
  }, [initialized, init]);

  const handleSearch = async (params) => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await api.searchEvents(params);

      if (data._embedded && data._embedded.events) {
        // Sort events by ascending date/time
        const sortedEvents = data._embedded.events.sort((a, b) => {
          const dateA = new Date(
            (a.dates?.start?.localDate || '') + 'T' + (a.dates?.start?.localTime || '00:00:00')
          );
          const dateB = new Date(
            (b.dates?.start?.localDate || '') + 'T' + (b.dates?.start?.localTime || '00:00:00')
          );
          return dateA - dateB;
        });

        const finalEvents = sortedEvents.slice(0, 20);
        setEvents(finalEvents); // Max 20 events

        // Save state to sessionStorage
        sessionStorage.setItem('searchPageState', JSON.stringify({
          events: finalEvents,
          searched: true
        }));
      } else {
        setEvents([]);
        sessionStorage.setItem('searchPageState', JSON.stringify({
          events: [],
          searched: true
        }));
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <SearchForm onSearch={handleSearch} loading={loading} />

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Searching for events...</p>
        </div>
      )}

      {!loading && searched && events.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nothing found</h3>
          <p className="text-gray-500">Update the query line to find events near you</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Enter search criteria and click the Search button to find events
          </h3>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
