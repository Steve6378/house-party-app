# Yorru Frontend - Complete Build Plan

## Objective
Build a complete React/TypeScript frontend with black/purple/blue/teal theme that connects to the existing Railway backend.

## Design System
- **Primary (Blue)**: #6366f1 - #312e81
- **Secondary (Purple)**: #a855f7 - #581c87
- **Accent (Teal)**: #06b6d4 - #164e63
- **Dark**: #0f172a - #f8fafc
- **Theme**: Dark mode with glass-morphism effects

## User Flows

### Flow 1: HOST Creates Event
1. Login → Dashboard
2. Click **"Create Event"** button
3. **AI Conversation** (What/When/Where):
   - AI: "What's your event called?"
   - User: "Summer BBQ"
   - AI: "When is it happening?"
   - User: "July 15th at 6pm"
   - AI: "Where will it be?" → **Google Maps integration**
   - User: Selects location on map
4. Event created → **Redirects to Host Interface**

### Flow 2: HOST Interface (Post-Creation)
**Tabs:**
- **Overview**: Event details, attendee list
- **AI Assistant**:
  - Generate to-do lists
  - Create custom invitations
  - Make updates
  - Add co-hosts
- **Ground Truth**: Manage facts (address, parking, food, etc.)
- **Group Chat**: Monitor conversations
- **Documents**: Upload files
- **Photos**: View gallery

### Flow 3: GUEST Joins Event
1. Login → Dashboard
2. Click **"Join Event"** or accept invitation
3. **Goes to Event Page** with:
   - Event details
   - **Guest AI Assistant** (ask questions)
   - Group chat (participate)
   - Photos (view/upload)

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS (custom theme)
- React Router v6
- Zustand (state management)
- Axios (API calls)
- Socket.io client (real-time chat)
- React Big Calendar (calendar view)
- Google Maps JavaScript API
- Sonner (toast notifications)

## Frontend Structure

```
frontend/src/
├── pages/
│   ├── LoginPage.tsx              (done)
│   ├── RegisterPage.tsx           (done)
│   ├── DashboardPage.tsx          (done)
│   ├── CreateEventPage.tsx        (done - AI conversation)
│   ├── HostInterfacePage.tsx      (done - after event creation)
│   ├── EventPage.tsx              (done - guest view)
│   ├── CalendarPage.tsx           (done)
│   └── JoinEventPage.tsx          (done)
│
├── components/
│   ├── AIChat.tsx                 (reusable AI chat)
│   ├── GroupChat.tsx              (real-time messaging)
│   ├── EventCard.tsx              (event preview cards)
│   ├── PhotoGallery.tsx           (photo grid)
│   ├── DocumentList.tsx           (file management)
│   ├── TodoList.tsx               (task management)
│   ├── GroundTruthEditor.tsx      (fact management)
│   └── GoogleMapPicker.tsx        (location selection)
│
├── stores/
│   ├── authStore.ts               (user session)
│   ├── eventStore.ts              (current event)
│   └── chatStore.ts               (messages)
│
├── utils/
│   ├── api.ts                     (axios instance)
│   ├── socket.ts                  (Socket.io setup)
│   └── types.ts                   (TypeScript interfaces)
│
├── App.tsx                        (router setup)
└── main.tsx                       (entry point)
```

## API Integration

### Backend URL
**Railway**: https://your-app.up.railway.app
**Local Dev**: http://localhost:8000

### Key Endpoints
```
POST /api/auth/register
POST /api/auth/login
GET  /api/events
POST /api/events
GET  /api/events/{id}
POST /api/events/{id}/ground_truth
GET  /api/events/{id}/messages
POST /api/events/{id}/messages
POST /api/ai/query (guest questions)
POST /api/ai/host-assist (host tools)
```

## Features Checklist

### Authentication
- [x] Login page (dark theme)
- [x] Register page
- [x] Protected routes
- [x] JWT token storage

### Dashboard
- [x] Create Event button (host)
- [x] Join Event button (guest)
- [x] Your Events list
- [x] Pending Invitations
- [x] Calendar view link

### Event Creation (Host)
- [x] AI conversation flow
- [x] What: Event name input
- [x] When: Date/time picker
- [x] Where: Google Maps integration
- [x] Redirect to Host Interface

### Host Interface
- [x] Event overview tab
- [x] AI Assistant tab
  - [x] Generate to-do list
  - [x] Create invitation message
  - [x] Event updates
  - [x] Add co-hosts
- [x] Ground Truth tab (manage facts)
- [x] Group Chat tab
- [x] Documents tab (upload/download)
- [x] Photos tab

### Guest Interface
- [x] Event details view
- [x] Guest AI Assistant (Q&A)
- [x] Group chat
- [x] Photo gallery
- [x] Accept/decline invitation

### Real-time Features
- [x] Socket.io connection
- [x] Live chat updates
- [x] New message notifications

### Calendar
- [x] Month/week/day views
- [x] All events displayed
- [x] Click event to view details

## Deployment

### Step 1: Environment Variables
Create `.env.production`:
```
VITE_API_URL=https://your-app.up.railway.app
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC0pZESmcvudSPIJptKdTh5L46xkD_dyd0
VITE_SOCKET_URL=wss://your-app.up.railway.app
```

### Step 2: Build
```bash
npm run build
```

### Step 3: Deploy to Vercel
```bash
vercel --prod
```

### Step 4: Configure Domain
- Add yorru.net to Vercel
- Update DNS records
- SSL auto-provisioned

## UI Components Library

All components follow the dark theme with:
- Glass-morphism backgrounds
- Gradient buttons
- Smooth animations
- Responsive design
- Accessible color contrasts

## Next Steps

1. Install dependencies
2. Set up Tailwind config with custom colors
3. Build authentication pages
4. Create dashboard
5. Build AI event creation flow
6. Implement host interface
7. Implement guest interface
8. Add real-time chat
9. Test everything
10. Deploy to Vercel!

---

**Ready to build!**
