-- House Party App - Mock/Seed Data
-- Based on "Friend Group 6" (Amane, Mahiru, Jake, Tanya, Nirali, Maya)

-- ============================================
-- USERS
-- ============================================

INSERT INTO users (id, email, name, password_hash) VALUES
('11111111-1111-1111-1111-111111111111', 'amane@usc.edu', 'Amane', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa'),  -- password: test123
('22222222-2222-2222-2222-222222222222', 'mahiru@usc.edu', 'Mahiru', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa'),
('33333333-3333-3333-3333-333333333333', 'jake@usc.edu', 'Jake', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa'),
('44444444-4444-4444-4444-444444444444', 'tanya@usc.edu', 'Tanya', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa'),
('55555555-5555-5555-5555-555555555555', 'nirali@usc.edu', 'Nirali', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa'),
('66666666-6666-6666-6666-666666666666', 'maya@usc.edu', 'Maya', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa');

-- ============================================
-- GROUPS
-- ============================================

INSERT INTO groups (id, name, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Friend Group 6', '11111111-1111-1111-1111-111111111111');

-- Group members
INSERT INTO group_members (group_id, user_id, role) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'member'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'member'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'member'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'member');

-- Group preferences (persistent across events)
INSERT INTO group_preferences (group_id, user_id, dietary_restrictions, budget_max, venue_preferences) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, '{"indoor": true, "outdoor": true}'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, '{"indoor": false, "outdoor": true}'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', ARRAY[], 30.00, '{"indoor": true, "outdoor": false}');

-- ============================================
-- EVENTS
-- ============================================

-- Event 1: Coffee Study Session (group event)
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person) VALUES
('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee Study Session', 'tight_knit', '55555555-5555-5555-5555-555555555555', '2025-11-25', '14:00', '123 Trousdale Parkway, Los Angeles, CA 90007', 'Starbucks USC', 8.00);

-- Event 2: Thanksgiving Dinner (group event)
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person) VALUES
('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Thanksgiving Dinner', 'tight_knit', '11111111-1111-1111-1111-111111111111', '2025-11-28', '18:00', '456 West 28th Street, Los Angeles, CA 90007', 'Amane''s Apartment', 25.00);

-- Event 3: Big Frat Party (one-off, no group)
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person) VALUES
('e3333333-3333-3333-3333-333333333333', NULL, 'Sanjana''s Big Frat Party', 'frat_party', '44444444-4444-4444-4444-444444444444', '2025-12-07', '21:00', '789 Fraternity Row, Los Angeles, CA 90007', 'Sigma Chi House', 15.00);

-- Co-hosts
INSERT INTO event_cohosts (event_id, user_id) VALUES
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),  -- Mahiru co-hosting Thanksgiving
('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');  -- Amane co-hosting frat party

-- ============================================
-- GROUND TRUTH FACTS
-- ============================================

-- Event 1: Coffee Study Session
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'address', '123 Trousdale Parkway, Los Angeles, CA 90007 (Starbucks USC)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('f1111112-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'parking', 'Street parking on Trousdale or parking structure on Figueroa', 'logistics', 'high', ARRAY['parking', 'car', 'park']),
('f1111113-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'what_to_bring', 'Just your laptop and study materials. Coffee is on you!', 'preparation', 'medium', ARRAY['bring', 'need', 'what']),
('f1111114-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'dress_code', 'Casual, whatever you''re comfortable studying in', 'attire', 'low', ARRAY['dress', 'wear', 'attire']);

-- Event 2: Thanksgiving Dinner
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('f2222221-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'address', '456 West 28th Street, Apt 201, Los Angeles, CA 90007 (Amane''s place)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('f2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'parking', 'Guest parking in building. Get code from Amane. Street parking also available.', 'logistics', 'high', ARRAY['parking', 'car']),
('f2222223-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'food_plan', 'Potluck style! Amane is cooking turkey. Please sign up for a dish in the group chat.', 'food', 'critical', ARRAY['food', 'bring', 'dish', 'potluck']),
('f2222224-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'dietary_restrictions', 'Jake is vegetarian, Nirali is vegan. Please plan accordingly!', 'food', 'critical', ARRAY['dietary', 'vegetarian', 'vegan', 'allergies']),
('f2222225-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'dress_code', 'Smart casual. No need to dress up too much, but not PJs :)', 'attire', 'medium', ARRAY['dress', 'wear', 'attire']),
('f2222226-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'budget', '$25 per person (covers turkey and sides). Just bring your dish!', 'finance', 'high', ARRAY['budget', 'cost', 'money', 'price']);

-- Event 3: Big Frat Party
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('f3333331-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'address', '789 Fraternity Row, Los Angeles, CA 90007 (Sigma Chi House)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('f3333332-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'parking', 'Limited street parking. Uber/Lyft recommended. Designated driver parking in back lot.', 'logistics', 'high', ARRAY['parking', 'car', 'uber']),
('f3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'entry_fee', '$15 cover at the door (Venmo @sanjana-usc). Includes drinks!', 'finance', 'critical', ARRAY['cost', 'price', 'fee', 'cover', 'venmo']),
('f3333334-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'dress_code', 'Party attire! Dress to impress.', 'attire', 'medium', ARRAY['dress', 'wear', 'attire']),
('f3333335-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'guest_list', 'USC students only. Bring your student ID. +1s allowed if cleared in advance.', 'rules', 'critical', ARRAY['guest', 'plus one', 'id', 'student']);

-- ============================================
-- GUEST PREFERENCES (Prefilled from group, or extracted)
-- ============================================

-- Event 1: Prefilled from group
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, venue_preferences, confidence, manually_confirmed) VALUES
('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, '{"indoor": true}', 1.0, TRUE),
('e1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, '{"outdoor": true}', 1.0, TRUE);

-- Event 2: Prefilled + some AI-extracted
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, confidence, manually_confirmed) VALUES
('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, 1.0, TRUE),
('e2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, 1.0, TRUE),
('e2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', ARRAY[], 30.00, 1.0, TRUE);

-- ============================================
-- ESCALATED QUESTIONS
-- ============================================

INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution) VALUES
('q1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Can I bring my roommate who''s not in the group?', TRUE, '11111111-1111-1111-1111-111111111111', 'Yes! As long as they bring a dish. Just let me know how many to expect.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('q2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Is there a gift registry or should we bring gifts?', FALSE, NULL, NULL, NOW() - INTERVAL '1 hour', NULL);

-- ============================================
-- SUGGESTIONS
-- ============================================

INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status) VALUES
('e2222222-2222-2222-2222-222222222222', 'new_faq', 'Add FAQ about music preferences - 3 guests asked about playlist', '{"guest_count": 3, "confidence": 0.85}', 'pending'),
('e2222222-2222-2222-2222-222222222222', 'todo_item', 'Set up Spotify collaborative playlist - multiple guests interested', '{"guest_count": 2, "confidence": 0.75}', 'pending'),
('e3333333-3333-3333-3333-333333333333', 'preference_conflict', 'Some guests expressed budget concerns about $15 entry fee', '{"guest_count": 1, "confidence": 0.60}', 'dismissed', NOW() - INTERVAL '1 day');

-- ============================================
-- TODOS
-- ============================================

-- Event 2: Thanksgiving Dinner to-dos
INSERT INTO todos (event_id, description, completed, assigned_to, position) VALUES
('e2222222-2222-2222-2222-222222222222', 'Buy turkey (12-14 lbs)', TRUE, '11111111-1111-1111-1111-111111111111', 1, NOW() - INTERVAL '3 days'),
('e2222222-2222-2222-2222-222222222222', 'Send invites', TRUE, '11111111-1111-1111-1111-111111111111', 2, NOW() - INTERVAL '5 days'),
('e2222222-2222-2222-2222-222222222222', 'Create potluck sign-up sheet', TRUE, '22222222-2222-2222-2222-222222222222', 3, NOW() - INTERVAL '4 days'),
('e2222222-2222-2222-2222-222222222222', 'Clean apartment', FALSE, '11111111-1111-1111-1111-111111111111', 4),
('e2222222-2222-2222-2222-222222222222', 'Get building parking codes', FALSE, '11111111-1111-1111-1111-111111111111', 5),
('e2222222-2222-2222-2222-222222222222', 'Set up music playlist', FALSE, '22222222-2222-2222-2222-222222222222', 6);

-- Event 3: Frat Party to-dos
INSERT INTO todos (event_id, description, completed, assigned_to, position) VALUES
('e3333333-3333-3333-3333-333333333333', 'Get frat house approval', TRUE, '44444444-4444-4444-4444-444444444444', 1, NOW() - INTERVAL '2 weeks'),
('e3333333-3333-3333-3333-333333333333', 'Book DJ', TRUE, '44444444-4444-4444-4444-444444444444', 2, NOW() - INTERVAL '1 week'),
('e3333333-3333-3333-3333-333333333333', 'Set up Venmo for entry fee', TRUE, '44444444-4444-4444-4444-444444444444', 3, NOW() - INTERVAL '5 days'),
('e3333333-3333-3333-3333-333333333333', 'Assign door duty / guest list', FALSE, '11111111-1111-1111-1111-111111111111', 4),
('e3333333-3333-3333-3333-333333333333', 'Plan cleanup crew', FALSE, '44444444-4444-4444-4444-444444444444', 5),
('e3333333-3333-3333-3333-333333333333', 'Notify neighbors', FALSE, '44444444-4444-4444-4444-444444444444', 6);

-- ============================================
-- MESSAGES (Group Chat Sample)
-- ============================================

-- Event 2: Thanksgiving Dinner chat
INSERT INTO messages (event_id, user_id, content, ai_processed) VALUES
('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Hey everyone! Excited for Thanksgiving dinner at my place. Who''s bringing what?', TRUE, NOW() - INTERVAL '5 days'),
('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'I can bring a vegetarian lasagna! Just a reminder I''m vegetarian btw', TRUE, NOW() - INTERVAL '5 days'),
('e2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'I''ll bring a vegan pumpkin pie. Can''t wait!', TRUE, NOW() - INTERVAL '5 days'),
('e2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'What''s the budget looking like? I''m a bit tight on cash this month', TRUE, NOW() - INTERVAL '4 days'),
('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '@Maya it''s $25 per person but that covers the turkey and main sides. You just need to bring a dish!', TRUE, NOW() - INTERVAL '4 days'),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'I''ll bring some wine! Red and white ok?', TRUE, NOW() - INTERVAL '3 days'),
('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Can I bring my roommate? She''s visiting from out of town', TRUE, NOW() - INTERVAL '2 days');

-- ============================================
-- GROUND TRUTH CHANGES (Audit Log)
-- ============================================

INSERT INTO ground_truth_changes (event_id, fact_id, fact_key, changed_by, change_type, old_value, new_value) VALUES
('e2222222-2222-2222-2222-222222222222', 'f2222221-2222-2222-2222-222222222222', 'address', '11111111-1111-1111-1111-111111111111', 'created', NULL, '456 West 28th Street, Apt 201, Los Angeles, CA 90007 (Amane''s place)', NOW() - INTERVAL '6 days'),
('e2222222-2222-2222-2222-222222222222', 'f2222226-2222-2222-2222-222222222222', 'budget', '11111111-1111-1111-1111-111111111111', 'created', NULL, '$25 per person (covers turkey and sides). Just bring your dish!', NOW() - INTERVAL '5 days'),
('e2222222-2222-2222-2222-222222222222', 'f2222226-2222-2222-2222-222222222222', 'budget', '22222222-2222-2222-2222-222222222222', 'updated', '$20 per person', '$25 per person (covers turkey and sides). Just bring your dish!', NOW() - INTERVAL '4 days');

-- ============================================
-- NOTES
-- ============================================

-- Embeddings for ground_truth_facts are NULL in seed data
-- They will be generated by the backend when facts are created/updated
-- For testing purposes, you can manually generate embeddings using:
-- UPDATE ground_truth_facts SET embedding = ... WHERE id = ...;

-- All passwords are hashed version of "test123" for testing
-- DO NOT use these in production!

-- AI Bot user (id: 00000000-...) is created in schema.sql
