# Future Features & Design Notes

This document tracks feature ideas and design decisions to implement later.

---

## Event Type Smart Features
**Status:** Design phase - implement after frontend is done
**Priority:** Medium

### Current State
Event types are just stored labels (e.g., "tight_knit", "big_party", "birthday"). They don't affect functionality.

### Proposed Functionality

Event types should drive different UX, suggestions, and available features:

#### 1. Smart Suggestions & Defaults

**tight_knit** (small, intimate gatherings):
- Auto-suggest guest count: 5-15 people
- Default visibility: private
- Enable features: detailed food preferences, seating arrangements
- Budget suggestions: higher per-person (nicer food/drinks)
- Recommended: RSVP required

**big_party** (large gatherings):
- Auto-suggest guest count: 50-200+ people
- Enable features: open invites, +1s allowed, parking info
- Suggested: DJ/music polls, crowd management
- Budget: lower per-person (bulk buying)

**frat_party**:
- Enable: keg tracker, beer pong tournament signup
- Auto-suggest: cover charge, security volunteers
- Recommended: noise curfew time, cleanup crew

**professional** (networking events):
- Enable: LinkedIn integration, business card exchange
- Disable: party games, alcohol tracking
- Auto-suggest: name tags, agenda/schedule, presentation setup
- Recommended: professional dress code note

**birthday/wedding** (celebrations):
- Enable: gift registry integration, RSVP deadline enforcement
- Auto-suggest: photo album, cake/special meal notes
- Special dietary needs tracker
- Memory/guestbook feature

**study_session** (academic):
- Enable: quiet hours, topic list, material sharing
- Suggested: break schedule, snack rotation
- Focus mode features

**game_night**:
- Enable: game library, player count requirements
- Suggested: setup time, skill levels
- Tournament brackets for competitive games

#### 2. Filter & Discovery
- Users can filter events: "Show me all professional events near me"
- Personalized recommendations: "You usually enjoy tight_knit events"
- Group suggestions based on past event types

#### 3. Context-Aware UI
Show/hide sections based on event type:
- Wedding → Gift registry tab, plus-ones, dietary restrictions
- Study session → Topics list, materials needed, quiet hours
- Gaming → Game library, setup requirements, player matching
- Professional → Agenda, speaker bios, networking time blocks

#### 4. AI-Powered Recommendations
- "Based on your tight_knit dinner party, here are wine pairings..."
- "For big parties with 100+ guests, consider these playlist suggestions..."
- "Similar professional events in your area had these features..."
- Event type-specific checklists and planning guides

#### 5. Analytics & Insights
- "Your tight_knit events typically have 85% attendance vs 60% for big parties"
- "Professional events you host usually run 30 minutes over schedule"
- Learn patterns: what works for different event types
- Compare your events to similar types

### Implementation Notes
- Event type should be stored as-is (custom text) for flexibility
- Feature mappings can be frontend-driven initially
- Later: backend could provide "event type templates" API
- Consider allowing hosts to override auto-suggestions
- May want common event types as presets with custom option

### Technical Considerations
- Frontend will need event type → feature mapping logic
- Could use a configuration file for type definitions
- Should be extensible (easy to add new types)
- Consider A/B testing different suggestions

---

## Other Future Features

_(Add more feature ideas here as they come up)_

