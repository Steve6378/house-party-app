import React, { useState, createContext, useContext, ReactNode } from 'react';
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  description: string;
  status: 'upcoming' | 'past';
  type?: string;
}
interface EventContextType {
  events: Event[];
  addEvent: (event: Event) => void;
}
const EventContext = createContext<EventContextType | undefined>(undefined);
const initialEvents: Event[] = [{
  id: '1',
  title: 'Thanksgiving Potluck',
  date: 'Nov 24, 2023',
  time: '4:00 PM',
  location: '456 West 28th St, Apt 201, LA',
  attendees: 6,
  description: "Join us for a Thanksgiving potluck. Amane is cooking turkey. Sign up in chat for what you'll bring.",
  status: 'upcoming'
}, {
  id: '2',
  title: 'Team Building Workshop',
  date: 'Dec 10, 2023',
  time: '9:00 AM',
  location: 'Conference Room A',
  attendees: 12,
  description: 'Quarterly team building workshop with activities and lunch provided.',
  type: 'Work',
  status: 'upcoming'
}, {
  id: '3',
  title: 'Holiday Party',
  date: 'Dec 22, 2023',
  time: '7:00 PM',
  location: 'Downtown Venue',
  attendees: 25,
  description: 'Annual holiday celebration with dinner, drinks, and dancing.',
  type: 'Social',
  status: 'upcoming'
}, {
  id: '4',
  title: 'Birthday Celebration',
  date: 'Oct 15, 2023',
  time: '6:00 PM',
  location: 'Rooftop Bar',
  attendees: 15,
  description: "Join us to celebrate Maya's birthday.",
  status: 'past'
}];
export const EventProvider: React.FC<{
  children: ReactNode;
}> = ({
  children
}) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const addEvent = (event: Event) => {
    setEvents(prev => [...prev, event]);
  };
  return <EventContext.Provider value={{
    events,
    addEvent
  }}>
      {children}
    </EventContext.Provider>;
};
export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};