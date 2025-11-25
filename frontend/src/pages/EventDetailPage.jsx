import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, ExternalLink, Loader2 } from 'lucide-react';
import { Facebook, Twitter } from 'lucide-react';
import { api } from '../utils/api.ts';
import { useFavorites } from '../utils/favorites';
import { toast } from 'sonner';

function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [artistData, setArtistData] = useState({});
  const [loadingArtists, setLoadingArtists] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const favorite = event ? isFavorite(event.id) : false;

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getEventDetails(id);
      setEvent(data);

      // Load artist data if it's a music event
      if (data.classifications?.[0]?.segment?.name === 'Music') {
        loadArtistData(data);
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadArtistData = async (eventData) => {
    const attractions = eventData._embedded?.attractions || [];
    if (attractions.length === 0) return;

    setLoadingArtists(true);
    const artistDataMap = {};

    for (const attraction of attractions) {
      try {
        const data = await api.getArtist(attraction.name);
        if (data.artist) {
          artistDataMap[attraction.name] = data;
        }
      } catch (error) {
        console.error(`Failed to load artist ${attraction.name}:`, error);
      }
    }

    setArtistData(artistDataMap);
    setLoadingArtists(false);
  };

  const handleFavoriteClick = async () => {
    try {
      if (favorite) {
        await removeFavorite(event.id);
        toast.error(`${event.name} removed from favorites!`, {
          action: {
            label: 'Undo',
            onClick: async () => {
              await addFavorite(event);
              toast.success(`${event.name} re-added to favorites!`);
            },
          },
        });
      } else {
        await addFavorite(event);
        toast.success(`${event.name} added to favorites!`);
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page (preserves search state)
  };

  const getTicketStatusColor = (status) => {
    const statusMap = {
      onsale: 'bg-green-500',
      offsale: 'bg-red-500',
      canceled: 'bg-black',
      postponed: 'bg-orange-500',
      rescheduled: 'bg-orange-500',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-500';
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(event.url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check ${event.name} on Ticketmaster.`);
    const url = encodeURIComponent(event.url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <button onClick={() => navigate('/search')} className="text-blue-600 hover:underline">
          Back to Search
        </button>
      </div>
    );
  }

  const attractions = event._embedded?.attractions || [];
  const venue = event._embedded?.venues?.[0];
  const isMusic = event.classifications?.[0]?.segment?.name === 'Music';

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-3">
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center gap-2"
            >
              Buy Tickets
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleFavoriteClick}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Heart
                className={`w-6 h-6 ${
                  favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex justify-center gap-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 pb-3 font-medium transition-colors flex-1 text-center ${
              activeTab === 'info'
                ? 'border-b-2 border-black text-black bg-gray-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('artists')}
            disabled={!isMusic}
            className={`px-6 pb-3 font-medium transition-colors flex-1 text-center ${
              activeTab === 'artists'
                ? 'border-b-2 border-black text-black bg-gray-50'
                : isMusic
                ? 'text-gray-500 hover:text-gray-700'
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            Artist
          </button>
          <button
            onClick={() => setActiveTab('venue')}
            className={`px-6 pb-3 font-medium transition-colors flex-1 text-center ${
              activeTab === 'venue'
                ? 'border-b-2 border-black text-black bg-gray-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Venue
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <InfoTab event={event} onShareFacebook={shareOnFacebook} onShareTwitter={shareOnTwitter} getTicketStatusColor={getTicketStatusColor} />
      )}

      {activeTab === 'artists' && isMusic && (
        <ArtistsTab attractions={attractions} artistData={artistData} loading={loadingArtists} />
      )}

      {activeTab === 'venue' && venue && <VenueTab venue={venue} />}
    </div>
  );
}

// Info Tab Component
function InfoTab({ event, onShareFacebook, onShareTwitter, getTicketStatusColor }) {
  const date = event.dates?.start?.localDate;
  const time = event.dates?.start?.localTime;
  const attractions = event._embedded?.attractions || [];
  const venue = event._embedded?.venues?.[0];
  const priceRanges = event.priceRanges || [];
  const status = event.dates?.status?.code || 'onsale';
  const seatmap = event.seatmap?.staticUrl;

  // Build genres array
  const genres = [];
  const classification = event.classifications?.[0];
  if (classification) {
    if (classification.segment?.name) genres.push(classification.segment.name);
    if (classification.genre?.name) genres.push(classification.genre.name);
    if (classification.subGenre?.name) genres.push(classification.subGenre.name);
    if (classification.type?.name) genres.push(classification.type.name);
    if (classification.subType?.name) genres.push(classification.subType.name);
  }

  return (
    <div className="space-y-6">
      {/* Event Info */}
      <div className="space-y-4">
        {date && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Date</div>
            <div>{new Date(date + (time ? `T${time}` : '')).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: time ? 'numeric' : undefined,
              minute: time ? '2-digit' : undefined,
              hour12: true
            })}</div>
          </div>
        )}

        {attractions.length > 0 && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Artist/Team</div>
            <div>{attractions.map(a => a.name).join(', ')}</div>
          </div>
        )}

        {venue && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Venue</div>
            <div>{venue.name}</div>
          </div>
        )}

        {genres.length > 0 && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Genres</div>
            <div>{genres.join(', ')}</div>
          </div>
        )}

        {priceRanges.length > 0 && (
          <div>
            <div className="font-semibold text-gray-700 mb-1">Price Ranges</div>
            <div>${priceRanges[0].min} - ${priceRanges[0].max}</div>
          </div>
        )}

        <div>
          <div className="font-semibold text-gray-700 mb-1">Ticket Status</div>
          <span className={`inline-block px-3 py-1 rounded text-white text-sm ${getTicketStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div>
          <div className="font-semibold text-gray-700 mb-2">Share</div>
          <div className="flex gap-3">
            <button
              onClick={onShareFacebook}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
            </button>
            <button
              onClick={onShareTwitter}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              <Twitter className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Seatmap - Full Width Below */}
      {seatmap && (
        <div>
          <div className="font-semibold text-gray-700 mb-2">Seatmap</div>
          <img src={seatmap} alt="Seat Map" className="w-full rounded border border-gray-200" />
        </div>
      )}
    </div>
  );
}

// Artists Tab Component
function ArtistsTab({ attractions, artistData, loading }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {attractions.map((attraction) => {
        const data = artistData[attraction.name];
        if (!data || !data.artist) return null;

        const artist = data.artist;
        const albums = data.albums || [];

        return (
          <div key={attraction.name}>
            <div className="flex gap-6 mb-6">
              {artist.images && artist.images[0] && (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-32 h-32 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">{artist.name}</h3>
                <div className="space-y-1 text-gray-500">
                  <div className="flex gap-6">
                    <div>
                      <span className="font-semibold">Followers:</span>{' '}
                      {artist.followers?.total?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-semibold">Popularity:</span> {artist.popularity}%
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Genres:</span>{' '}
                    {artist.genres?.join(', ') || 'N/A'}
                  </div>
                  <a
                    href={artist.external_urls?.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-black text-white px-4 py-2 rounded mt-2 hover:bg-gray-800"
                  >
                    Open in Spotify
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {albums.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-4">Albums</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albums.map((album) => (
                    <a
                      key={album.id}
                      href={album.external_urls?.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-300 rounded hover:border-gray-400 transition-colors block overflow-hidden"
                    >
                      <img
                        src={album.images?.[0]?.url}
                        alt={album.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2">
                        <div className="text-sm font-medium truncate mb-1">{album.name}</div>
                        <div className="text-xs text-gray-500 text-left">{album.release_date || 'N/A'}</div>
                        <div className="text-xs text-gray-500 text-left">{album.total_tracks} tracks</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Venue Tab Component
function VenueTab({ venue }) {
  const address = [
    venue.address?.line1,
    venue.city?.name,
    venue.state?.stateCode || venue.state?.name,
    venue.country?.countryCode
  ].filter(Boolean).join(', ');

  const lat = venue.location?.latitude;
  const lng = venue.location?.longitude;
  const mapUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const image = venue.images?.[0]?.url;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">{venue.name}</h3>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 mb-4"
          >
            {address}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {venue.url && (
          <a
            href={venue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-full border border-gray-300"
          >
            See Events
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Image - Full Width on Mobile */}
      {image && (
        <div>
          <img src={image} alt={venue.name} className="w-full rounded border border-gray-200" />
        </div>
      )}

      {/* Parking and Rules - Full Width Below Image */}
      <div className="space-y-4">
        {venue.parkingDetail && (
          <div>
            <h4 className="font-semibold mb-2">Parking</h4>
            <p className="text-gray-700 text-sm whitespace-pre-line">{venue.parkingDetail}</p>
          </div>
        )}

        {venue.generalInfo?.generalRule && (
          <div>
            <h4 className="font-semibold mb-2">General Rule</h4>
            <p className="text-gray-700 text-sm whitespace-pre-line">{venue.generalInfo.generalRule}</p>
          </div>
        )}

        {venue.generalInfo?.childRule && (
          <div>
            <h4 className="font-semibold mb-2">Child Rule</h4>
            <p className="text-gray-700 text-sm whitespace-pre-line">{venue.generalInfo.childRule}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailPage;
