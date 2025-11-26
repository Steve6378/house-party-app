import { useEffect } from 'react';
import { Heart } from 'lucide-react';
import EventCard from '../components/EventCard';
import { useFavorites } from '../utils/favorites';

function FavoritesPage() {
  const { favorites, init, initialized } = useFavorites();

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorite events to show</h3>
          <p className="text-gray-500">Add events to your favourites by clicking on the heart icon on any event</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-gray-600">
            {favorites.length} favorite event{favorites.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
