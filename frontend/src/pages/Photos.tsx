import React, { useState } from 'react';
import { UploadIcon, ImageIcon, XIcon } from 'lucide-react';
import { useEvents } from '../context/EventContext';
import { toast } from 'sonner';
interface Photo {
  id: string;
  url: string;
  eventId: string;
  uploadedBy: string;
  uploadedAt: Date;
}
const Photos: React.FC = () => {
  const {
    events
  } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [photos, setPhotos] = useState<Photo[]>([{
    id: '1',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    eventId: '1',
    uploadedBy: 'Amane',
    uploadedAt: new Date(2023, 10, 24)
  }, {
    id: '2',
    url: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800',
    eventId: '1',
    uploadedBy: 'Jake',
    uploadedAt: new Date(2023, 10, 24)
  }, {
    id: '3',
    url: 'https://images.unsplash.com/photo-1482275548304-a58859dc31b7?w=800',
    eventId: '1',
    uploadedBy: 'Maya',
    uploadedAt: new Date(2023, 10, 24)
  }]);
  const filteredPhotos = selectedEvent === 'all' ? photos : photos.filter(photo => photo.eventId === selectedEvent);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (selectedEvent === 'all') {
      toast.error('Please select a specific event to upload photos');
      return;
    }
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = event => {
        const newPhoto: Photo = {
          id: crypto.randomUUID(),
          url: event.target?.result as string,
          eventId: selectedEvent,
          uploadedBy: 'You',
          uploadedAt: new Date()
        };
        setPhotos(prev => [newPhoto, ...prev]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) uploaded successfully`);
  };
  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast.success('Photo deleted');
  };
  return <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Photos</h1>
        <p className="text-gray-600">View and upload photos from your events</p>
      </div>
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Event:
              </label>
              <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="all">All Events</option>
                {events.map(event => <option key={event.id} value={event.id}>
                    {event.title}
                  </option>)}
              </select>
            </div>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Photos
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
        <div className="p-6">
          {filteredPhotos.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map(photo => <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={photo.url} alt="Event photo" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                    <XIcon className="h-4 w-4" />
                  </button>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      by {photo.uploadedBy}
                    </p>
                    <p className="text-xs text-gray-500">
                      {photo.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>)}
            </div> : <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {selectedEvent === 'all' ? 'No photos uploaded yet' : 'No photos for this event yet'}
              </p>
              {selectedEvent !== 'all' && <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload First Photo
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>}
            </div>}
        </div>
      </div>
    </div>;
};
export default Photos;