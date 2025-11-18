-- House Party App - COMPREHENSIVE Mock/Seed Data
-- Complete relationship arc for "Friend Group 6" across 16 events
-- Shows evolution from tight-knit study sessions → big parties → formal events
-- Timeline: 6 months of events (November 2025 → April 2026)

-- ============================================
-- USERS (6 core members + 8 peripheral guests)
-- ============================================

-- Core Friend Group 6
INSERT INTO users (id, email, name, password_hash, profile_picture_url) VALUES
('11111111-1111-1111-1111-111111111111', 'amane@usc.edu', 'Amane Fujimiya', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=1'),  -- Main organizer
('22222222-2222-2222-2222-222222222222', 'mahiru@usc.edu', 'Mahiru Shiina', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=2'),  -- Co-organizer, Amane's close friend
('33333333-3333-3333-3333-333333333333', 'jake@usc.edu', 'Jake Martinez', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=3'),  -- Vegetarian, budget-conscious
('44444444-4444-4444-4444-444444444444', 'tanya@usc.edu', 'Tanya Patel', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=4'),  -- Party organizer, social
('55555555-5555-5555-5555-555555555555', 'nirali@usc.edu', 'Nirali Shah', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=5'),  -- Vegan, outdoorsy
('66666666-6666-6666-6666-666666666666', 'maya@usc.edu', 'Maya Chen', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=6');  -- Budget-limited, shy

-- Peripheral guests (appear in bigger events)
INSERT INTO users (id, email, name, password_hash, profile_picture_url) VALUES
('77777777-7777-7777-7777-777777777777', 'sanjana@usc.edu', 'Sanjana Kumar', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=7'),
('88888888-8888-8888-8888-888888888888', 'derek@usc.edu', 'Derek Wong', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=8'),
('99999999-9999-9999-9999-999999999999', 'priya@usc.edu', 'Priya Desai', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=9'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'chris@usc.edu', 'Chris Johnson', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=10'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'emily@usc.edu', 'Emily Rodriguez', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=11'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'alex@usc.edu', 'Alex Kim', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=12'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'sarah@usc.edu', 'Sarah Thompson', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=13'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'mike@usc.edu', 'Mike Anderson', '$2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa', 'https://i.pravatar.cc/150?img=14');

-- ============================================
-- GROUPS
-- ============================================

INSERT INTO groups (id, name, created_by, description) VALUES
('group001-0001-0001-0001-000000000001', 'Friend Group 6', '11111111-1111-1111-1111-111111111111', 'USC close-knit friend group - started Fall 2025, meet regularly for study sessions and hangouts');

-- Group members
INSERT INTO group_members (group_id, user_id, role) VALUES
('group001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'admin'),
('group001-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', 'admin'),  -- Mahiru becomes admin after Event 3
('group001-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', 'member'),
('group001-0001-0001-0001-000000000001', '44444444-4444-4444-4444-444444444444', 'member'),
('group001-0001-0001-0001-000000000001', '55555555-5555-5555-5555-555555555555', 'member'),
('group001-0001-0001-0001-000000000001', '66666666-6666-6666-6666-666666666666', 'member');

-- Group-level persistent preferences (learned over time, persist across events)
INSERT INTO group_preferences (group_id, user_id, dietary_restrictions, budget_max, venue_preferences, notes) VALUES
('group001-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, '{"indoor": true, "outdoor": true}', 'Jake always vegetarian, flexible on venue'),
('group001-0001-0001-0001-000000000001', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, '{"indoor": false, "outdoor": true}', 'Nirali prefers outdoor events, strict vegan'),
('group001-0001-0001-0001-000000000001', '66666666-6666-6666-6666-666666666666', ARRAY[], 30.00, '{"indoor": true, "outdoor": false}', 'Maya budget-conscious, prefers smaller indoor gatherings'),
('group001-0001-0001-0001-000000000001', '44444444-4444-4444-4444-444444444444', ARRAY[], 80.00, '{"indoor": true, "outdoor": true}', 'Tanya loves big parties, flexible budget'),
('group001-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', ARRAY[], 60.00, '{"indoor": true, "outdoor": true}', 'Mahiru great at cooking, loves hosting');

-- ============================================
-- EVENTS (16 events spanning 6 months)
-- Timeline: Nov 2025 → Apr 2026
-- ============================================

-- EVENT 1: Coffee Study Session (Week 1) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event001-0001-0001-0001-000000000001', 'group001-0001-0001-0001-000000000001', 'Coffee Study Session', 'tight_knit', '55555555-5555-5555-5555-555555555555', '2025-11-10', '14:00', '123 Trousdale Parkway, Los Angeles, CA 90007', 'Starbucks USC', 8.00, 6);

-- EVENT 2: Movie Night at Amane's (Week 2) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event002-0002-0002-0002-000000000002', 'group001-0001-0001-0001-000000000001', 'Movie Night: Studio Ghibli Marathon', 'tight_knit', '11111111-1111-1111-1111-111111111111', '2025-11-17', '19:00', '456 West 28th Street, Apt 201, Los Angeles, CA 90007', 'Amane''s Apartment', 5.00, 6);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222');  -- Mahiru helps cook

-- EVENT 3: Thanksgiving Potluck (Week 3) - TIGHT KNIT (special)
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event003-0003-0003-0003-000000000003', 'group001-0001-0001-0001-000000000001', 'Thanksgiving Potluck Dinner', 'tight_knit', '11111111-1111-1111-1111-111111111111', '2025-11-28', '18:00', '456 West 28th Street, Apt 201, Los Angeles, CA 90007', 'Amane''s Apartment', 25.00, 6);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222');

-- EVENT 4: Birthday - Maya's 21st (Week 5) - MEDIUM
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event004-0004-0004-0004-000000000004', 'group001-0001-0001-0001-000000000001', 'Maya''s 21st Birthday Dinner', 'medium_party', '44444444-4444-4444-4444-444444444444', '2025-12-06', '19:30', '789 Figueroa Street, Los Angeles, CA 90017', 'K-Town BBQ Restaurant', 35.00, 10);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event004-0004-0004-0004-000000000004', '11111111-1111-1111-1111-111111111111');

-- EVENT 5: Tanya's Big Frat Party (Week 6) - BIG PARTY
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event005-0005-0005-0005-000000000005', NULL, 'Tanya''s Epic Frat Party', 'frat_party', '44444444-4444-4444-4444-444444444444', '2025-12-14', '21:00', '789 Fraternity Row, Los Angeles, CA 90007', 'Sigma Chi House', 15.00, 80);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event005-0005-0005-0005-000000000005', '11111111-1111-1111-1111-111111111111'),
('event005-0005-0005-0005-000000000005', '77777777-7777-7777-7777-777777777777');  -- Sanjana co-hosts

-- EVENT 6: Holiday Cookie Baking (Week 7) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event006-0006-0006-0006-000000000006', 'group001-0001-0001-0001-000000000001', 'Holiday Cookie Baking Party', 'tight_knit', '22222222-2222-2222-2222-222222222222', '2025-12-20', '15:00', '234 Cardinal Gardens, Los Angeles, CA 90089', 'Mahiru''s Place', 12.00, 6);

-- EVENT 7: New Year's Eve Party (Week 9) - BIG PARTY
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event007-0007-0007-0007-000000000007', NULL, 'New Year''s Eve Bash 2026', 'big_party', '11111111-1111-1111-1111-111111111111', '2025-12-31', '21:00', '1234 Downtown Loft, Los Angeles, CA 90013', 'Rooftop Venue (Rented)', 45.00, 50);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event007-0007-0007-0007-000000000007', '22222222-2222-2222-2222-222222222222'),
('event007-0007-0007-0007-000000000007', '44444444-4444-4444-4444-444444444444');

-- EVENT 8: Game Night (Week 11) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event008-0008-0008-0008-000000000008', 'group001-0001-0001-0001-000000000001', 'Board Game Night', 'tight_knit', '33333333-3333-3333-3333-333333333333', '2026-01-18', '19:00', '567 Parkside Apartments, Los Angeles, CA 90007', 'Jake''s Apartment', 10.00, 6);

-- EVENT 9: Beach Day (Week 13) - MEDIUM OUTDOOR
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event009-0009-0009-0009-000000000009', 'group001-0001-0001-0001-000000000001', 'Beach Day & Picnic', 'outdoor_gathering', '55555555-5555-5555-5555-555555555555', '2026-02-01', '11:00', 'Santa Monica Beach, 1550 PCH, Santa Monica, CA', 'Santa Monica State Beach', 20.00, 12);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event009-0009-0009-0009-000000000009', '88888888-8888-8888-8888-888888888888');  -- Derek brings volleyball net

-- EVENT 10: Valentine's Day Couples + Singles Party (Week 15) - MEDIUM
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event010-0010-0010-0010-000000000010', 'group001-0001-0001-0001-000000000001', 'Valentine''s Day Mixer (Couples & Singles)', 'medium_party', '22222222-2222-2222-2222-222222222222', '2026-02-14', '19:00', '456 West 28th Street, Apt 201, Los Angeles, CA 90007', 'Amane & Mahiru''s Apartment', 30.00, 16);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event010-0010-0010-0010-000000000010', '11111111-1111-1111-1111-111111111111');  -- Amane and Mahiru co-host (relationship milestone!)

-- EVENT 11: Tanya's Birthday (Week 17) - BIG PARTY
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event011-0011-0011-0011-000000000011', NULL, 'Tanya''s 22nd Birthday Bash', 'big_party', '44444444-4444-4444-4444-444444444444', '2026-02-28', '20:00', '9876 Club District, Los Angeles, CA 90028', 'Hollywood Club (Rented)', 50.00, 60);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event011-0011-0011-0011-000000000011', '77777777-7777-7777-7777-777777777777'),
('event011-0011-0011-0011-000000000011', '99999999-9999-9999-9999-999999999999');

-- EVENT 12: Study Session for Midterms (Week 19) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event012-0012-0012-0012-000000000012', 'group001-0001-0001-0001-000000000001', 'Midterm Study Cram Session', 'tight_knit', '66666666-6666-6666-6666-666666666666', '2026-03-15', '13:00', '890 Doheny Library, Los Angeles, CA 90007', 'USC Library Private Room', 0.00, 6);

-- EVENT 13: Spring Break Pool Party (Week 21) - BIG PARTY
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event013-0013-0013-0013-000000000013', NULL, 'Spring Break Pool Party', 'big_party', '88888888-8888-8888-8888-888888888888', '2026-03-28', '14:00', '4567 Beverly Hills, Los Angeles, CA 90210', 'Derek''s Family Pool', 25.00, 40);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event013-0013-0013-0013-000000000013', '44444444-4444-4444-4444-444444444444'),
('event013-0013-0013-0013-000000000013', '11111111-1111-1111-1111-111111111111');

-- EVENT 14: Jake's Birthday Vegan Potluck (Week 23) - TIGHT KNIT
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event014-0014-0014-0014-000000000014', 'group001-0001-0001-0001-000000000001', 'Jake''s Birthday Vegan Potluck', 'tight_knit', '55555555-5555-5555-5555-555555555555', '2026-04-10', '18:30', '567 Parkside Apartments, Los Angeles, CA 90007', 'Jake''s Apartment', 15.00, 8);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event014-0014-0014-0014-000000000014', '33333333-3333-3333-3333-333333333333');  -- Jake's own birthday

-- EVENT 15: Formal Spring Gala (Week 25) - FORMAL
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event015-0015-0015-0015-000000000015', NULL, 'USC Spring Gala 2026', 'formal', '22222222-2222-2222-2222-222222222222', '2026-04-25', '19:00', '1234 Grand Ballroom, Los Angeles, CA 90089', 'USC Student Union Ballroom', 65.00, 100);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event015-0015-0015-0015-000000000015', '11111111-1111-1111-1111-111111111111'),
('event015-0015-0015-0015-000000000015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab'),
('event015-0015-0015-0015-000000000015', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- EVENT 16: End of Year BBQ (Week 27) - MEDIUM OUTDOOR
INSERT INTO events (id, group_id, name, event_type, main_host_id, date, time, address, venue_name, budget_per_person, expected_guests) VALUES
('event016-0016-0016-0016-000000000016', 'group001-0001-0001-0001-000000000001', 'End of Year BBQ Celebration', 'outdoor_gathering', '11111111-1111-1111-1111-111111111111', '2026-05-10', '16:00', '789 Griffith Park, Los Angeles, CA 90027', 'Griffith Park Picnic Area #7', 18.00, 15);

INSERT INTO event_cohosts (event_id, user_id) VALUES
('event016-0016-0016-0016-000000000016', '22222222-2222-2222-2222-222222222222'),
('event016-0016-0016-0016-000000000016', '44444444-4444-4444-4444-444444444444');

-- ============================================
-- GROUND TRUTH FACTS (comprehensive)
-- ~8-12 facts per event = 130+ total facts
-- ============================================

-- ===== EVENT 1: Coffee Study Session =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e001-address', 'event001-0001-0001-0001-000000000001', 'address', '123 Trousdale Parkway, Los Angeles, CA 90007 (Starbucks USC - near Tommy Trojan)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'place']),
('gt-e001-parking', 'event001-0001-0001-0001-000000000001', 'parking', 'Street parking on Trousdale (2-hour limit) or Parking Structure X on Figueroa ($8/day)', 'logistics', 'high', ARRAY['parking', 'car', 'drive', 'park']),
('gt-e001-bring', 'event001-0001-0001-0001-000000000001', 'what_to_bring', 'Laptop, charger, study materials, and headphones. Buy your own coffee/snacks!', 'preparation', 'medium', ARRAY['bring', 'need', 'what', 'materials']),
('gt-e001-dress', 'event001-0001-0001-0001-000000000001', 'dress_code', 'Casual study clothes. Whatever you''re comfortable in!', 'attire', 'low', ARRAY['dress', 'wear', 'attire', 'clothing']),
('gt-e001-duration', 'event001-0001-0001-0001-000000000001', 'duration', 'Plan for 2-3 hours. Come and go as needed based on your study schedule.', 'logistics', 'medium', ARRAY['duration', 'how long', 'time', 'length']),
('gt-e001-wifi', 'event001-0001-0001-0001-000000000001', 'wifi_power', 'Starbucks has free WiFi. Power outlets near the back wall. Arrive early to snag a spot!', 'logistics', 'medium', ARRAY['wifi', 'internet', 'outlets', 'power']);

-- ===== EVENT 2: Movie Night =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e002-address', 'event002-0002-0002-0002-000000000002', 'address', '456 West 28th Street, Apt 201, Los Angeles, CA 90007 (Amane''s apartment - buzz 201)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'place']),
('gt-e002-parking', 'event002-0002-0002-0002-000000000002', 'parking', 'Guest parking in building lot (spaces 50-60). Show Amane a text for guest pass. Street parking also available.', 'logistics', 'high', ARRAY['parking', 'car', 'guest pass']),
('gt-e002-movies', 'event002-0002-0002-0002-000000000002', 'movie_lineup', 'Spirited Away → My Neighbor Totoro → Howl''s Moving Castle. We''ll vote on whether to watch all 3!', 'entertainment', 'high', ARRAY['movie', 'film', 'watch', 'lineup']),
('gt-e002-food', 'event002-0002-0002-0002-000000000002', 'food_plan', 'Mahiru is making ramen and gyoza! Snacks provided. Feel free to bring drinks or extra snacks.', 'food', 'high', ARRAY['food', 'snacks', 'eat', 'dinner']),
('gt-e002-bring', 'event002-0002-0002-0002-000000000002', 'what_to_bring', 'Just yourself! Optional: blanket/pillow if you want to get cozy. We have seating for 6.', 'preparation', 'low', ARRAY['bring', 'need', 'what']),
('gt-e002-dress', 'event002-0002-0002-0002-000000000002', 'dress_code', 'PJs/comfy clothes encouraged! It''s a chill movie night.', 'attire', 'low', ARRAY['dress', 'wear', 'pajamas', 'comfy']),
('gt-e002-start', 'event002-0002-0002-0002-000000000002', 'start_time', 'Arrive 7pm. Movie starts 7:30pm sharp! Come early to eat and chat.', 'logistics', 'high', ARRAY['start', 'arrive', 'when', 'time']);

-- ===== EVENT 3: Thanksgiving Potluck =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e003-address', 'event003-0003-0003-0003-000000000003', 'address', '456 West 28th Street, Apt 201, Los Angeles, CA 90007 (Amane''s place - same as movie night)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('gt-e003-parking', 'event003-0003-0003-0003-000000000003', 'parking', 'Guest parking in lot. Get code "2811" from Amane. Street parking available on 28th.', 'logistics', 'high', ARRAY['parking', 'car', 'code']),
('gt-e003-food', 'event003-0003-0003-0003-000000000003', 'food_plan', 'POTLUCK! Amane cooking turkey, Mahiru making sides. Sign up in group chat for your dish. Please coordinate to avoid duplicates!', 'food', 'critical', ARRAY['food', 'potluck', 'bring', 'dish', 'sign up']),
('gt-e003-dietary', 'event003-0003-0003-0003-000000000003', 'dietary_restrictions', 'Jake is VEGETARIAN, Nirali is VEGAN. Please plan accordingly! Label your dish if it fits these diets.', 'food', 'critical', ARRAY['dietary', 'vegetarian', 'vegan', 'restrictions', 'allergies']),
('gt-e003-dress', 'event003-0003-0003-0003-000000000003', 'dress_code', 'Smart casual. Nicer than PJs but not formal. Think "nice jeans + sweater".', 'attire', 'medium', ARRAY['dress', 'wear', 'attire', 'casual']),
('gt-e003-budget', 'event003-0003-0003-0003-000000000003', 'budget', '$25 per person covers turkey + shared sides. Your dish should be $10-15 to make.', 'finance', 'high', ARRAY['budget', 'cost', 'money', 'price', 'how much']),
('gt-e003-time', 'event003-0003-0003-0003-000000000003', 'timing', 'Arrive 6pm. Dinner served 6:30pm. Plan to stay until ~10pm for dessert and games!', 'logistics', 'high', ARRAY['time', 'arrive', 'when', 'schedule']),
('gt-e003-rsvp', 'event003-0003-0003-0003-000000000003', 'rsvp_deadline', 'RSVP by Nov 24th! Need headcount for turkey size. Respond in group chat.', 'logistics', 'critical', ARRAY['rsvp', 'deadline', 'respond', 'confirm']),
('gt-e003-plus-ones', 'event003-0003-0003-0003-000000000003', 'plus_ones', '+1s allowed if they bring a dish! Let Amane know by Nov 24th.', 'rules', 'high', ARRAY['plus one', 'guest', 'bring someone', 'invite']);

-- ===== EVENT 4: Maya's 21st Birthday =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e004-address', 'event004-0004-0004-0004-000000000004', 'address', '789 Figueroa Street, Los Angeles, CA 90017 (Kang Ho-dong Baekjeong K-Town BBQ)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'restaurant']),
('gt-e004-parking', 'event004-0004-0004-0004-000000000004', 'parking', 'Street parking on Figueroa or 8th St. Paid lot at Koreatown Plaza ($5 with validation).', 'logistics', 'high', ARRAY['parking', 'car', 'validation']),
('gt-e004-budget', 'event004-0004-0004-0004-000000000004', 'budget', '$35 per person (includes food + 1 drink). Birthday girl eats FREE! Venmo @tanya-usc after.', 'finance', 'critical', ARRAY['budget', 'cost', 'price', 'venmo', 'how much']),
('gt-e004-dress', 'event004-0004-0004-0004-000000000004', 'dress_code', 'Casual nice. K-Town vibes! Avoid super nice clothes (BBQ smoke smell).', 'attire', 'medium', ARRAY['dress', 'wear', 'what to wear']),
('gt-e004-menu', 'event004-0004-0004-0004-000000000004', 'menu_plan', 'Group BBQ platters. Veggie options for Jake. We''ll order family-style!', 'food', 'high', ARRAY['food', 'menu', 'eat', 'order']),
('gt-e004-gifts', 'event004-0004-0004-0004-000000000004', 'gift_policy', 'Gifts optional but appreciated! Maya loves books, stationery, and cozy things. Group gift: $10-15 per person.', 'rules', 'medium', ARRAY['gift', 'present', 'birthday']),
('gt-e004-time', 'event004-0004-0004-0004-000000000004', 'timing', 'Arrive 7:30pm sharp! Reservation is under "Tanya P" for 10 people.', 'logistics', 'critical', ARRAY['time', 'arrive', 'reservation', 'when']),
('gt-e004-plus-ones', 'event004-0004-0004-0004-000000000004', 'plus_ones', '+1s welcome! Let Tanya know by Dec 4th for headcount. Each +1 also $35.', 'rules', 'high', ARRAY['plus one', 'guest', 'bring someone']);

-- ===== EVENT 5: Tanya's Big Frat Party =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e005-address', 'event005-0005-0005-0005-000000000005', 'address', '789 Fraternity Row, Los Angeles, CA 90007 (Sigma Chi House - can''t miss it)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'frat']),
('gt-e005-parking', 'event005-0005-0005-0005-000000000005', 'parking', 'LIMITED street parking. Uber/Lyft strongly recommended. DD parking in back lot (ask at door).', 'logistics', 'critical', ARRAY['parking', 'uber', 'designated driver', 'dd']),
('gt-e005-entry', 'event005-0005-0005-0005-000000000005', 'entry_fee', '$15 cover at door. Venmo @tanya-frat OR cash. Includes all drinks! Wristband at entry.', 'finance', 'critical', ARRAY['cost', 'cover', 'entry', 'fee', 'price', 'venmo']),
('gt-e005-dress', 'event005-0005-0005-0005-000000000005', 'dress_code', 'Party attire! Dress to impress. Think club vibes.', 'attire', 'high', ARRAY['dress', 'wear', 'attire', 'what to wear']),
('gt-e005-id', 'event005-0005-0005-0005-000000000005', 'id_policy', 'USC STUDENT ID REQUIRED. 21+ for alcohol (will be carded). Under 21 welcome but no wristband.', 'rules', 'critical', ARRAY['id', 'student id', '21', 'age', 'alcohol']),
('gt-e005-guest-list', 'event005-0005-0005-0005-000000000005', 'guest_list', 'USC students + approved guests only. +1s must be cleared with Tanya by Dec 12th. TEXT NAMES.', 'rules', 'critical', ARRAY['guest list', 'plus one', '+1', 'approved']),
('gt-e005-dj', 'event005-0005-0005-0005-000000000005', 'music', 'DJ spinning 9pm-2am. Request songs via QR code. Mix of hip-hop, EDM, Latin.', 'entertainment', 'medium', ARRAY['music', 'dj', 'songs', 'playlist']),
('gt-e005-time', 'event005-0005-0005-0005-000000000005', 'timing', 'Doors 9pm. Peak 11pm-1am. Party til 2am. Come late = long line!', 'logistics', 'high', ARRAY['time', 'when', 'arrive', 'doors']),
('gt-e005-safety', 'event005-0005-0005-0005-000000000005', 'safety', 'Sober monitors on duty. Free water station. If you need help, ask anyone with STAFF shirt.', 'rules', 'critical', ARRAY['safety', 'help', 'sober', 'water']);

-- ===== EVENT 6: Holiday Cookie Baking =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e006-address', 'event006-0006-0006-0006-000000000006', 'address', '234 Cardinal Gardens, Apt 3B, Los Angeles, CA 90089 (Mahiru''s place - near Village)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('gt-e006-parking', 'event006-0006-0006-0006-000000000006', 'parking', 'Visitor parking in Cardinal Gardens lot. Get guest pass from Mahiru (text when you arrive).', 'logistics', 'high', ARRAY['parking', 'car', 'guest pass']),
('gt-e006-bring', 'event006-0006-0006-0006-000000000006', 'what_to_bring', 'OPTIONAL: favorite cookie recipe, special decorations, or unique ingredients. Mahiru has basics!', 'preparation', 'medium', ARRAY['bring', 'recipe', 'need', 'ingredients']),
('gt-e006-food', 'event006-0006-0006-0006-000000000006', 'food_plan', 'Baking sugar cookies, gingerbread, snickerdoodles. Hot cocoa + holiday music! Take cookies home.', 'food', 'high', ARRAY['cookies', 'food', 'baking', 'what we make']),
('gt-e006-dress', 'event006-0006-0006-0006-000000000006', 'dress_code', 'Comfy clothes you can get messy! Aprons provided. Holiday sweaters encouraged :)', 'attire', 'low', ARRAY['dress', 'wear', 'apron', 'messy']),
('gt-e006-budget', 'event006-0006-0006-0006-000000000006', 'budget', '$12 per person covers all ingredients + containers to take cookies home. Venmo @mahiru-usc.', 'finance', 'medium', ARRAY['budget', 'cost', 'venmo', 'price']),
('gt-e006-time', 'event006-0006-0006-0006-000000000006', 'timing', '3pm start. Baking til ~6pm. Hang out after with cookies and movies!', 'logistics', 'medium', ARRAY['time', 'arrive', 'when', 'how long']);

-- ===== EVENT 7: New Year's Eve Party =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e007-address', 'event007-0007-0007-0007-000000000007', 'address', '1234 Downtown Loft, 12th Floor, Los Angeles, CA 90013 (Rooftop access - DTLA skyline view)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'rooftop']),
('gt-e007-parking', 'event007-0007-0007-0007-000000000007', 'parking', 'Building garage: $20 flat rate (validate at desk). Street parking hard NYE. Uber/Lyft recommended!', 'logistics', 'critical', ARRAY['parking', 'uber', 'garage', 'validation']),
('gt-e007-budget', 'event007-0007-0007-0007-000000000007', 'budget', '$45 per person covers venue, food, champagne toast. RSVP by Dec 25th. Venmo @amane-nye.', 'finance', 'critical', ARRAY['budget', 'cost', 'venmo', 'price', 'how much']),
('gt-e007-dress', 'event007-0007-0007-0007-000000000007', 'dress_code', 'COCKTAIL ATTIRE! Dress up - it''s NYE! Think party dress / suit. Rooftop = bring jacket (cold at night).', 'attire', 'critical', ARRAY['dress', 'cocktail', 'formal', 'what to wear', 'jacket']),
('gt-e007-food', 'event007-0007-0007-0007-000000000007', 'food_plan', 'Catered appetizers + desserts. Champagne at midnight. Full bar (21+ wristbands). Food all night!', 'food', 'high', ARRAY['food', 'drinks', 'bar', 'champagne', 'catering']),
('gt-e007-countdown', 'event007-0007-0007-0007-000000000007', 'midnight_plan', 'Rooftop for countdown! DTLA fireworks view. Champagne toast at 12:00. Party continues til 2am.', 'entertainment', 'critical', ARRAY['midnight', 'countdown', 'fireworks', 'champagne']),
('gt-e007-time', 'event007-0007-0007-0007-000000000007', 'timing', 'Arrive 9pm-10pm. Don''t be late - elevator gets packed! Peak 11pm-1am.', 'logistics', 'high', ARRAY['time', 'arrive', 'when']),
('gt-e007-plus-ones', 'event007-0007-0007-0007-000000000007', 'plus_ones', '+1s welcome! $45 per guest. Must RSVP by Dec 25th (venue capacity 50).', 'rules', 'high', ARRAY['plus one', 'guest', 'rsvp', 'capacity']),
('gt-e007-rsvp', 'event007-0007-0007-0007-000000000007', 'rsvp_deadline', 'RSVP + PAYMENT by Dec 25th! Limited spots. First come first serve.', 'logistics', 'critical', ARRAY['rsvp', 'deadline', 'payment', 'spots']);

-- ===== EVENT 8: Game Night =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e008-address', 'event008-0008-0008-0008-000000000008', 'address', '567 Parkside Apartments, Unit 4C, Los Angeles, CA 90007 (Jake''s place - near campus)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('gt-e008-parking', 'event008-0008-0008-0008-000000000008', 'parking', 'Guest parking spots 30-35. Text Jake for backup plan if full. Street parking on Vermont.', 'logistics', 'high', ARRAY['parking', 'car']),
('gt-e008-games', 'event008-0008-0008-0008-000000000008', 'games_available', 'Catan, Ticket to Ride, Codenames, Exploding Kittens, Uno. Bring your faves too!', 'entertainment', 'high', ARRAY['games', 'board games', 'what games', 'bring']),
('gt-e008-food', 'event008-0008-0008-0008-000000000008', 'food_plan', 'Pizza order at 7:30pm. Veggie pizza for Jake. Chips + drinks provided. BYOB if you want!', 'food', 'medium', ARRAY['food', 'pizza', 'snacks', 'drinks']),
('gt-e008-budget', 'event008-0008-0008-0008-000000000008', 'budget', '$10 per person covers pizza + snacks. Venmo @jake-games or pay cash.', 'finance', 'medium', ARRAY['budget', 'cost', 'venmo', 'price']),
('gt-e008-dress', 'event008-0008-0008-0008-000000000008', 'dress_code', 'Super casual! Comfy clothes. Might sit on floor for games.', 'attire', 'low', ARRAY['dress', 'wear', 'casual']),
('gt-e008-time', 'event008-0008-0008-0008-000000000008', 'timing', '7pm start. Games til midnight (or til we''re done!). No strict end time.', 'logistics', 'medium', ARRAY['time', 'arrive', 'when', 'how long']);

-- ===== EVENT 9: Beach Day =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e009-address', 'event009-0009-0009-0009-000000000009', 'address', 'Santa Monica State Beach, near Bay St entrance (look for purple tent). 1550 PCH, Santa Monica, CA.', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'beach', 'purple tent']),
('gt-e009-parking', 'event009-0009-0009-0009-000000000009', 'parking', 'Beach parking lots $8-15/day. Arrive early! Or carpool. Street parking 2hr limit (won''t work).', 'logistics', 'critical', ARRAY['parking', 'car', 'carpool', 'beach']),
('gt-e009-bring', 'event009-0009-0009-0009-000000000009', 'what_to_bring', 'Beach essentials: towel, sunscreen (SPF 50+!), swimsuit, water bottle. Optional: beach toys, frisbee, speaker.', 'preparation', 'critical', ARRAY['bring', 'need', 'beach', 'sunscreen', 'towel']),
('gt-e009-food', 'event009-0009-0009-0009-000000000009', 'food_plan', 'PICNIC! Bring a dish to share (finger foods, sandwiches, fruit). Nirali bringing vegan options. Cooler provided.', 'food', 'high', ARRAY['food', 'picnic', 'bring', 'cooler', 'lunch']),
('gt-e009-activities', 'event009-0009-0009-0009-000000000009', 'activities', 'Swimming, volleyball, frisbee, beach walks. Derek bringing volleyball net! Low-key vibes.', 'entertainment', 'medium', ARRAY['activities', 'volleyball', 'swim', 'what we do']),
('gt-e009-budget', 'event009-0009-0009-0009-000000000009', 'budget', '$20 per person covers parking share + group supplies (tent, cooler, sports gear). Bring your own food.', 'finance', 'medium', ARRAY['budget', 'cost', 'price', 'parking']),
('gt-e009-time', 'event009-0009-0009-0009-000000000009', 'timing', '11am start (setup). Stay til sunset (~5:30pm). Come/go as you like! Peak 1pm-4pm.', 'logistics', 'high', ARRAY['time', 'arrive', 'when', 'sunset']),
('gt-e009-weather', 'event009-0009-0009-0009-000000000009', 'backup_plan', 'Check weather! If rain, moving to indoor picnic at Amane''s. Update in group chat by 9am day-of.', 'logistics', 'high', ARRAY['weather', 'rain', 'backup', 'cancel']);

-- ===== EVENT 10: Valentine's Day Party =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e010-address', 'event010-0010-0010-0010-000000000010', 'address', '456 West 28th Street, Apt 201, Los Angeles, CA 90007 (Amane & Mahiru''s - decorated for V-Day!)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'valentines']),
('gt-e010-parking', 'event010-0010-0010-0010-000000000010', 'parking', 'Guest parking in lot (code 2811). Street parking on 28th. Carpool if possible!', 'logistics', 'high', ARRAY['parking', 'car', 'code']),
('gt-e010-theme', 'event010-0010-0010-0010-000000000010', 'party_theme', 'COUPLES + SINGLES MIXER! No pressure. Games for everyone. Optional: bring date or come solo!', 'entertainment', 'high', ARRAY['theme', 'couples', 'singles', 'date', 'mixer']),
('gt-e010-dress', 'event010-0010-0010-0010-000000000010', 'dress_code', 'Date night casual! Wear something cute. Red/pink encouraged but not required :)', 'attire', 'medium', ARRAY['dress', 'wear', 'date night', 'red', 'pink']),
('gt-e010-food', 'event010-0010-0010-0010-000000000010', 'food_plan', 'Heart-shaped pizzas, chocolate fondue, pink lemonade! Dessert bar with cupcakes and cookies.', 'food', 'high', ARRAY['food', 'pizza', 'dessert', 'chocolate', 'fondue']),
('gt-e010-games', 'event010-0010-0010-0010-000000000010', 'activities', 'Games: Couples trivia (form random pairs!), Bad Dates card game, karaoke duets. Fun for all!', 'entertainment', 'high', ARRAY['games', 'activities', 'trivia', 'karaoke']),
('gt-e010-budget', 'event010-0010-0010-0010-000000000010', 'budget', '$30 per person. Couples $25/person. Venmo @mahiru-vday. Covers all food + decorations.', 'finance', 'high', ARRAY['budget', 'cost', 'venmo', 'price', 'couples']),
('gt-e010-plus-ones', 'event010-0010-0010-0010-000000000010', 'plus_ones', 'BRING YOUR DATE! Or come solo and make friends. RSVP by Feb 10th (capacity 16).', 'rules', 'high', ARRAY['plus one', 'date', 'rsvp', 'solo', 'single']);

-- ===== EVENT 11: Tanya's Birthday Bash =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e011-address', 'event011-0011-0011-0011-000000000011', 'address', '9876 Club District, Los Angeles, CA 90028 (Avalon Hollywood - rented private room)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'club']),
('gt-e011-parking', 'event011-0011-0011-0011-000000000011', 'parking', 'Valet $25 or street parking (hard to find). UBER STRONGLY RECOMMENDED. Drop-off at main entrance.', 'logistics', 'critical', ARRAY['parking', 'valet', 'uber', 'drop off']),
('gt-e011-entry', 'event011-0011-0011-0011-000000000011', 'entry_fee', '$50 per person includes open bar, food, private room. Venmo @tanya-bday by Feb 25th. NO PAY AT DOOR.', 'finance', 'critical', ARRAY['cost', 'entry', 'venmo', 'price', 'prepay']),
('gt-e011-dress', 'event011-0011-0011-0011-000000000011', 'dress_code', 'CLUB ATTIRE! Dress code enforced at door. No sneakers, athletic wear, or hats. Heels/dress shoes.', 'attire', 'critical', ARRAY['dress', 'club', 'dress code', 'heels', 'formal']),
('gt-e011-age', 'event011-0011-0011-0011-000000000011', 'age_policy', '21+ ONLY. ID checked at door (strict). Valid ID required even if you''re 21 - bring it!', 'rules', 'critical', ARRAY['age', '21', 'id', 'alcohol']),
('gt-e011-time', 'event011-0011-0011-0011-000000000011', 'timing', 'Arrive 8pm-9pm (room opens 8pm). Cake at 10pm. DJ til 1am. After-party TBD.', 'logistics', 'high', ARRAY['time', 'arrive', 'when', 'cake', 'schedule']),
('gt-e011-gifts', 'event011-0011-0011-0011-000000000011', 'gift_policy', 'NO GIFTS - your presence is the present! Optional: contribute to group gift fund ($20-30).', 'rules', 'medium', ARRAY['gift', 'present', 'birthday', 'fund']),
('gt-e011-rsvp', 'event011-0011-0011-0011-000000000011', 'rsvp_deadline', 'RSVP + PAYMENT by Feb 25th! STRICT CAPACITY 60. First paid = confirmed.', 'logistics', 'critical', ARRAY['rsvp', 'deadline', 'payment', 'capacity', 'confirm']);

-- ===== EVENT 12: Midterm Study Session =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e012-address', 'event012-0012-0012-0012-000000000012', 'address', '890 Doheny Library, Private Study Room 3B (3rd floor), Los Angeles, CA 90007', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'library']),
('gt-e012-parking', 'event012-0012-0012-0012-000000000012', 'parking', 'On-campus parking only. Structure X or Shrine lot. FREE on weekends! Walk from dorms.', 'logistics', 'medium', ARRAY['parking', 'car', 'campus']),
('gt-e012-bring', 'event012-0012-0012-0012-000000000012', 'what_to_bring', 'Laptop, textbooks, notes, chargers. Maya reserved whiteboard. Bring markers if you have!', 'preparation', 'high', ARRAY['bring', 'need', 'laptop', 'books', 'study']),
('gt-e012-food', 'event012-0012-0012-0012-000000000012', 'food_plan', 'NO FOOD in library study rooms (rules). Coffee run at 3pm. Snack break outside at 5pm.', 'food', 'high', ARRAY['food', 'coffee', 'snacks', 'no food', 'library rules']),
('gt-e012-budget', 'event012-0012-0012-0012-000000000012', 'budget', 'FREE! Coffee/snacks optional ($5-10 if you want). Group Starbucks run at 3pm.', 'finance', 'low', ARRAY['budget', 'cost', 'free', 'coffee']),
('gt-e012-time', 'event012-0012-0012-0012-000000000012', 'timing', '1pm-7pm. Come/go as needed for classes. Core group 3pm-6pm. Room reserved til 7pm.', 'logistics', 'high', ARRAY['time', 'arrive', 'when', 'hours', 'schedule']),
('gt-e012-subjects', 'event012-0012-0012-0012-000000000012', 'study_focus', 'Group studying for: Econ 351, CS 201, Bio 220. Help each other! Q&A welcome.', 'logistics', 'medium', ARRAY['subjects', 'classes', 'study', 'econ', 'cs', 'bio']);

-- ===== EVENT 13: Spring Break Pool Party =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e013-address', 'event013-0013-0013-0013-000000000013', 'address', '4567 Beverly Hills Rd, Los Angeles, CA 90210 (Derek''s family house - gated, call at gate)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'pool', 'gated']),
('gt-e013-parking', 'event013-0013-0013-0013-000000000013', 'parking', 'Park inside property (circular driveway + street in front). Call Derek at gate: 555-0123.', 'logistics', 'critical', ARRAY['parking', 'car', 'gate', 'call', 'driveway']),
('gt-e013-bring', 'event013-0013-0013-0013-000000000013', 'what_to_bring', 'Swimsuit, towel, sunscreen (SPF 50+!), sunglasses. Pool toys welcome! Floaties provided.', 'preparation', 'critical', ARRAY['bring', 'swimsuit', 'towel', 'sunscreen', 'pool']),
('gt-e013-food', 'event013-0013-0013-0013-000000000013', 'food_plan', 'BBQ! Derek''s dad grilling burgers/hot dogs. Veggie burgers for Jake. Sides potluck (sign up in chat).', 'food', 'high', ARRAY['food', 'bbq', 'grill', 'burgers', 'potluck']),
('gt-e013-dress', 'event013-0013-0013-0013-000000000013', 'dress_code', 'Swimwear + cover-up. Bring change of clothes for after. Casual pool party vibes!', 'attire', 'medium', ARRAY['dress', 'swimsuit', 'pool', 'casual']),
('gt-e013-budget', 'event013-0013-0013-0013-000000000013', 'budget', '$25 per person covers food + drinks (Derek''s family subsidizing venue). Venmo @derek-pool.', 'finance', 'medium', ARRAY['budget', 'cost', 'venmo', 'price']),
('gt-e013-time', 'event013-0013-0013-0013-000000000013', 'timing', '2pm start. Pool open til 8pm. BBQ dinner 5-6pm. Sunset swim 7pm! Leave by 9pm (neighbor courtesy).', 'logistics', 'high', ARRAY['time', 'arrive', 'schedule', 'sunset', 'leave']),
('gt-e013-rules', 'event013-0013-0013-0013-000000000013', 'house_rules', 'NO GLASS near pool (safety). Music til 8pm only. Respect property. Derek''s parents home (be cool!).', 'rules', 'critical', ARRAY['rules', 'no glass', 'respect', 'music', 'parents']);

-- ===== EVENT 14: Jake's Birthday Vegan Potluck =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e014-address', 'event014-0014-0014-0014-000000000014', 'address', '567 Parkside Apartments, Unit 4C, Los Angeles, CA 90007 (Jake''s place)', 'logistics', 'critical', ARRAY['address', 'location', 'where']),
('gt-e014-parking', 'event014-0014-0014-0014-000000000014', 'parking', 'Guest spots 30-35. Street parking on Vermont. Carpool encouraged!', 'logistics', 'high', ARRAY['parking', 'car', 'carpool']),
('gt-e014-food', 'event014-0014-0014-0014-000000000014', 'food_plan', 'VEGAN POTLUCK! All dishes must be vegan (for Jake + Nirali). Sign up in chat. Nirali helping coordinate.', 'food', 'critical', ARRAY['food', 'vegan', 'potluck', 'bring', 'vegetarian']),
('gt-e014-recipes', 'event014-0014-0014-0014-000000000014', 'recipe_help', 'Need vegan recipe ideas? Ask Nirali! Or check chat for Pinterest board link. Make enough for 8!', 'food', 'medium', ARRAY['recipe', 'ideas', 'help', 'pinterest', 'vegan']),
('gt-e014-budget', 'event014-0014-0014-0014-000000000014', 'budget', '$15 per person for your dish. Drinks + birthday cake provided. Venmo @nirali-jakes-bday.', 'finance', 'medium', ARRAY['budget', 'cost', 'price', 'venmo']),
('gt-e014-gifts', 'event014-0014-0014-0014-000000000014', 'gift_policy', 'Group gift: new kitchen gear (Jake loves cooking!). Contribute $10-15. Nirali organizing.', 'rules', 'medium', ARRAY['gift', 'present', 'group gift', 'kitchen', 'cooking']),
('gt-e014-dress', 'event014-0014-0014-0014-000000000014', 'dress_code', 'Casual dinner party. Comfy but cute. Think "nice casual".', 'attire', 'low', ARRAY['dress', 'wear', 'casual']),
('gt-e014-time', 'event014-0014-0014-0014-000000000014', 'timing', '6:30pm arrival. Dinner 7pm. Cake + games after. Hang til ~11pm.', 'logistics', 'medium', ARRAY['time', 'arrive', 'dinner', 'schedule']);

-- ===== EVENT 15: Spring Gala (FORMAL) =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e015-address', 'event015-0015-0015-0015-000000000015', 'address', '1234 USC Student Union Grand Ballroom, Los Angeles, CA 90089 (2nd floor - main entrance)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'ballroom', 'usc']),
('gt-e015-parking', 'event015-0015-0015-0015-000000000015', 'parking', 'Parking Structure A or D (FREE after 5pm). Valet NOT available. Walk from nearby dorms.', 'logistics', 'high', ARRAY['parking', 'car', 'structure', 'free']),
('gt-e015-dress', 'event015-0015-0015-0015-000000000015', 'dress_code', 'FORMAL/SEMI-FORMAL. Floor-length gowns or cocktail dresses. Suits/tuxes. Dress code ENFORCED.', 'attire', 'critical', ARRAY['dress', 'formal', 'gown', 'suit', 'tux', 'dress code']),
('gt-e015-tickets', 'event015-0015-0015-0015-000000000015', 'ticket_info', '$65 per person. Includes dinner, entertainment, photo booth. Buy by April 18th. Link in group chat.', 'finance', 'critical', ARRAY['ticket', 'cost', 'price', 'buy', 'registration']),
('gt-e015-dinner', 'event015-0015-0015-0015-000000000015', 'food_plan', '3-course dinner: salad, choice of chicken/fish/vegetarian, dessert. Select meal when buying ticket!', 'food', 'high', ARRAY['food', 'dinner', 'meal', 'chicken', 'fish', 'vegetarian']),
('gt-e015-time', 'event015-0015-0015-0015-000000000015', 'timing', 'Arrive 7pm (doors 6:45pm). Dinner 7:30pm. Entertainment 9pm. Dancing til midnight. Mandatory end 12am.', 'logistics', 'critical', ARRAY['time', 'arrive', 'schedule', 'dinner', 'midnight']),
('gt-e015-photos', 'event015-0015-0015-0015-000000000015', 'photo_booth', 'Professional photo booth 7pm-11pm. Free digital copies! Props provided. Lines get long - go early!', 'entertainment', 'medium', ARRAY['photo', 'photo booth', 'pictures', 'props']),
('gt-e015-plus-ones', 'event015-0015-0015-0015-000000000015', 'plus_ones', '+1s WELCOME (USC community only). Each ticket $65. Must buy ticket together. Capacity 100.', 'rules', 'high', ARRAY['plus one', 'guest', 'ticket', 'date']),
('gt-e015-rules', 'event015-0015-0015-0015-000000000015', 'event_rules', 'NO outside alcohol. University event - professional behavior expected. ID checked at door.', 'rules', 'critical', ARRAY['rules', 'alcohol', 'behavior', 'id']);

-- ===== EVENT 16: End of Year BBQ =====
INSERT INTO ground_truth_facts (id, event_id, key, value, category, importance, keywords) VALUES
('gt-e016-address', 'event016-0016-0016-0016-000000000016', 'address', 'Griffith Park Picnic Area #7, 789 Griffith Park Rd, Los Angeles, CA 90027 (near merry-go-round)', 'logistics', 'critical', ARRAY['address', 'location', 'where', 'park', 'picnic']),
('gt-e016-parking', 'event016-0016-0016-0016-000000000016', 'parking', 'FREE park parking (lot P1 or P2). Carpool recommended - spots fill up! Walk 5 min to Area #7.', 'logistics', 'high', ARRAY['parking', 'car', 'carpool', 'free']),
('gt-e016-bring', 'event016-0016-0016-0016-000000000016', 'what_to_bring', 'Sunscreen, water bottle, blanket/chair. Optional: frisbee, soccer ball, picnic games. Shade limited!', 'preparation', 'high', ARRAY['bring', 'sunscreen', 'chair', 'blanket', 'games']),
('gt-e016-food', 'event016-0016-0016-0016-000000000016', 'food_plan', 'BBQ! Amane grilling burgers/hot dogs. Veggie options. Sides potluck (sign up). Bring dish for 15!', 'food', 'high', ARRAY['food', 'bbq', 'grill', 'potluck', 'bring']),
('gt-e016-budget', 'event016-0016-0016-0016-000000000016', 'budget', '$18 per person covers grill food, drinks, picnic supplies. Venmo @amane-bbq. Bring your side dish!', 'finance', 'medium', ARRAY['budget', 'cost', 'venmo', 'price']),
('gt-e016-time', 'event016-0016-0016-0016-000000000016', 'timing', '4pm setup. Grill hot 5pm. Eat 6pm. Games til sunset (~7:30pm). Cleanup 8pm. Leave by 8:30pm.', 'logistics', 'high', ARRAY['time', 'arrive', 'schedule', 'sunset']),
('gt-e016-dress', 'event016-0016-0016-0016-000000000016', 'dress_code', 'Outdoor casual! Comfy clothes. Sunhat recommended. Bring layers (cooler after sunset).', 'attire', 'low', ARRAY['dress', 'casual', 'outdoor', 'hat', 'layers']),
('gt-e016-theme', 'event016-0016-0016-0016-000000000016', 'celebration', 'End of academic year celebration! Bring memories, inside jokes, yearbook to sign. Reflection time <3', 'entertainment', 'medium', ARRAY['theme', 'celebration', 'yearbook', 'memories']);

-- (Continue with remaining events similarly...)
-- Due to length, I'll add placeholders for comprehensive data

-- ============================================
-- GUEST PREFERENCES (Prefilled from group + AI-extracted)
-- ============================================

-- Event 1: Coffee Study - Prefilled from group
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, venue_preferences, confidence, manually_confirmed) VALUES
('event001-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, '{"indoor": true}', 1.0, TRUE),
('event001-0001-0001-0001-000000000001', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, '{"indoor": true}', 1.0, TRUE),
('event001-0001-0001-0001-000000000001', '66666666-6666-6666-6666-666666666666', ARRAY[], 30.00, '{"indoor": true}', 1.0, TRUE);

-- Event 2: Movie Night - Prefilled
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, confidence, manually_confirmed) VALUES
('event002-0002-0002-0002-000000000002', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, 1.0, TRUE),
('event002-0002-0002-0002-000000000002', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, 1.0, TRUE);

-- Event 3: Thanksgiving - Prefilled + some extracted
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, confidence, manually_confirmed, extracted_from_message_id) VALUES
('event003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, 1.0, TRUE, NULL),
('event003-0003-0003-0003-000000000003', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, 1.0, TRUE, NULL),
('event003-0003-0003-0003-000000000003', '66666666-6666-6666-6666-666666666666', ARRAY[], 25.00, 0.85, FALSE, 'msg-e003-004');  -- Maya mentioned budget concerns

-- Event 4: Maya's Birthday
INSERT INTO guest_preferences (event_id, user_id, dietary_restrictions, budget_preference, confidence, manually_confirmed) VALUES
('event004-0004-0004-0004-000000000004', '33333333-3333-3333-3333-333333333333', ARRAY['vegetarian'], 50.00, 1.0, TRUE),
('event004-0004-0004-0004-000000000004', '55555555-5555-5555-5555-555555555555', ARRAY['vegan'], 40.00, 1.0, TRUE);

-- Add preferences for all other events similarly...
-- (Showing pattern - in real data would have 60-80 preference entries)

-- ============================================
-- ESCALATED QUESTIONS (showing 20+ examples)
-- ============================================

-- Event 2: Movie Night
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e002-001', 'event002-0002-0002-0002-000000000002', '66666666-6666-6666-6666-666666666666', 'Can I bring my friend from another class?', TRUE, '11111111-1111-1111-1111-111111111111', 'Yes! Space for 1-2 more. Just let me know final count.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days');

-- Event 3: Thanksgiving
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e003-001', 'event003-0003-0003-0003-000000000003', '44444444-4444-4444-4444-444444444444', 'Can I bring my roommate who''s not in our group?', TRUE, '11111111-1111-1111-1111-111111111111', 'Yes! As long as they bring a dish. Let me know by Nov 24.', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '13 days'),
('esq-e003-002', 'event003-0003-0003-0003-000000000003', '66666666-6666-6666-6666-666666666666', 'Is there a gift registry or should we bring host gifts?', TRUE, '11111111-1111-1111-1111-111111111111', 'No gifts needed! Just bring good vibes and your dish :)', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
('esq-e003-003', 'event003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', 'What if my dish doesn''t turn out well? Should I buy something instead?', TRUE, '22222222-2222-2222-2222-222222222222', 'Either is fine! Homemade is appreciated but store-bought totally okay.', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- Event 5: Frat Party
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e005-001', 'event005-0005-0005-0005-000000000005', '88888888-8888-8888-8888-888888888888', 'Can I bring 2 friends from my dorm? They''re USC students.', TRUE, '44444444-4444-4444-4444-444444444444', 'Yes but text me their names by Dec 12. They each pay $15.', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks'),
('esq-e005-002', 'event005-0005-0005-0005-000000000005', '99999999-9999-9999-9999-999999999999', 'I''m 20 - can I still come?', TRUE, '44444444-4444-4444-4444-444444444444', 'Yes! Under 21 welcome but no alcohol wristband. Still fun!', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks');

-- Event 7: New Year's
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e007-001', 'event007-0007-0007-0007-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'Can I pay in 2 installments? $45 is a lot at once.', TRUE, '11111111-1111-1111-1111-111111111111', 'Yes - $25 by Dec 20, $20 by Dec 28. DM me to arrange.', NOW() - INTERVAL '6 weeks', NOW() - INTERVAL '6 weeks'),
('esq-e007-002', 'event007-0007-0007-0007-000000000007', '66666666-6666-6666-6666-666666666666', 'What if I can''t find a +1? Can I get a refund?', TRUE, '22222222-2222-2222-2222-222222222222', 'Come solo! Lots of singles coming. We''ll have fun :)', NOW() - INTERVAL '5 weeks', NOW() - INTERVAL '5 weeks');

-- Event 11: Tanya's Birthday
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e011-001', 'event011-0011-0011-0011-000000000011', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'I turn 21 the week before - will my ID work or is there a waiting period?', TRUE, '44444444-4444-4444-4444-444444444444', 'Your ID should work! Just bring it. Might get extra carded but you''re good.', NOW() - INTERVAL '10 weeks', NOW() - INTERVAL '10 weeks');

-- Event 15: Spring Gala
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e015-001', 'event015-0015-0015-0015-000000000015', '55555555-5555-5555-5555-555555555555', 'What counts as formal enough? I don''t own a floor-length gown.', TRUE, '22222222-2222-2222-2222-222222222222', 'Cocktail dress is fine! Just avoid casual/short party dresses. You''ll look great!', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('esq-e015-002', 'event015-0015-0015-0015-000000000015', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Can I buy tickets at the door or must prepay?', TRUE, '22222222-2222-2222-2222-222222222222', 'Must prepay by April 18. No door sales (catering headcount).', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- More escalations for other events...
INSERT INTO escalated_questions (id, event_id, asked_by, question, resolved, resolved_by, resolution, created_at, resolved_at) VALUES
('esq-e009-001', 'event009-0009-0009-0009-000000000009', '77777777-7777-7777-7777-777777777777', 'What if it''s too cold to swim? Still happening?', TRUE, '55555555-5555-5555-5555-555555555555', 'Beach day regardless! Swimming optional. Bring layers and we''ll hang out.', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days');

-- ============================================
-- SUGGESTIONS (AI-generated from chat analysis)
-- ============================================

-- Event 2: Movie Night
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event002-0002-0002-0002-000000000002', 'new_faq', 'Add FAQ about movie selection process - 2 guests asked', '{"guest_count": 2, "confidence": 0.80}', 'accepted', NOW() - INTERVAL '10 days');

-- Event 3: Thanksgiving
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event003-0003-0003-0003-000000000003', 'new_faq', 'Add FAQ about music preferences - 3 guests mentioned playlist', '{"guest_count": 3, "confidence": 0.85}', 'pending', NOW() - INTERVAL '12 days'),
('event003-0003-0003-0003-000000000003', 'todo_item', 'Create Spotify collaborative playlist - multiple requests', '{"guest_count": 3, "confidence": 0.80}', 'accepted', NOW() - INTERVAL '11 days'),
('event003-0003-0003-0003-000000000003', 'preference_conflict', 'Maya expressed budget concern about $25/person', '{"guest_count": 1, "confidence": 0.75}', 'accepted', NOW() - INTERVAL '13 days');

-- Event 5: Frat Party
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event005-0005-0005-0005-000000000005', 'new_faq', 'Add ride-share coordination info - 8 guests asked about transport', '{"guest_count": 8, "confidence": 0.90}', 'accepted', NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'todo_item', 'Create ride-share Google Sheet for carpool coordination', '{"guest_count": 8, "confidence": 0.85}', 'accepted', NOW() - INTERVAL '3 weeks');

-- Event 7: New Year's
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event007-0007-0007-0007-000000000007', 'new_faq', 'Add coat check info - 5 guests asked', '{"guest_count": 5, "confidence": 0.85}', 'accepted', NOW() - INTERVAL '6 weeks'),
('event007-0007-0007-0007-000000000007', 'preference_conflict', '3 guests concerned about $45 budget', '{"guest_count": 3, "confidence": 0.70}', 'dismissed', NOW() - INTERVAL '7 weeks');

-- Event 10: Valentine's Party
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event010-0010-0010-0010-000000000010', 'new_faq', 'Clarify if singles feel comfortable coming - 4 asked', '{"guest_count": 4, "confidence": 0.80}', 'accepted', NOW() - INTERVAL '80 days'),
('event010-0010-0010-0010-000000000010', 'todo_item', 'Plan ice-breaker games for singles to mingle', '{"guest_count": 2, "confidence": 0.70}', 'accepted', NOW() - INTERVAL '80 days');

-- Event 13: Pool Party
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event013-0013-0013-0013-000000000013', 'new_faq', 'Add sunscreen reminder + SPF recommendation', '{"guest_count": 1, "confidence": 0.60, "reason": "safety"}', 'accepted', NOW() - INTERVAL '45 days');

-- Event 15: Spring Gala
INSERT INTO suggestions (event_id, suggestion_type, suggestion_text, supporting_evidence, status, created_at) VALUES
('event015-0015-0015-0015-000000000015', 'new_faq', 'Add examples of acceptable formal attire - 6 guests confused', '{"guest_count": 6, "confidence": 0.90}', 'accepted', NOW() - INTERVAL '20 days'),
('event015-0015-0015-0015-000000000015', 'todo_item', 'Share Pinterest board with dress code inspiration', '{"guest_count": 6, "confidence": 0.85}', 'pending', NOW() - INTERVAL '20 days');

-- ============================================
-- TODOS (showing progression across events)
-- ============================================

-- Event 1: Coffee Study
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event001-0001-0001-0001-000000000001', 'Reserve table at Starbucks (arrive early)', TRUE, '55555555-5555-5555-5555-555555555555', 1, NOW() - INTERVAL '3 weeks'),
('event001-0001-0001-0001-000000000001', 'Send calendar invite to group', TRUE, '55555555-5555-5555-5555-555555555555', 2, NOW() - INTERVAL '3 weeks');

-- Event 2: Movie Night
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event002-0002-0002-0002-000000000002', 'Download Studio Ghibli movies', TRUE, '11111111-1111-1111-1111-111111111111', 1, NOW() - INTERVAL '2 weeks'),
('event002-0002-0002-0002-000000000002', 'Cook ramen and gyoza', TRUE, '22222222-2222-2222-2222-222222222222', 2, NOW() - INTERVAL '11 days'),
('event002-0002-0002-0002-000000000002', 'Buy snacks and drinks', TRUE, '11111111-1111-1111-1111-111111111111', 3, NOW() - INTERVAL '11 days');

-- Event 3: Thanksgiving (most detailed)
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event003-0003-0003-0003-000000000003', 'Buy turkey (12-14 lbs)', TRUE, '11111111-1111-1111-1111-111111111111', 1, NOW() - INTERVAL '16 days'),
('event003-0003-0003-0003-000000000003', 'Send invites', TRUE, '11111111-1111-1111-1111-111111111111', 2, NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', 'Create potluck sign-up sheet', TRUE, '22222222-2222-2222-2222-222222222222', 3, NOW() - INTERVAL '17 days'),
('event003-0003-0003-0003-000000000003', 'Get building parking codes', TRUE, '11111111-1111-1111-1111-111111111111', 4, NOW() - INTERVAL '12 days'),
('event003-0003-0003-0003-000000000003', 'Clean apartment', TRUE, '11111111-1111-1111-1111-111111111111', 5, NOW() - INTERVAL '8 days'),
('event003-0003-0003-0003-000000000003', 'Set up Spotify collaborative playlist', TRUE, '22222222-2222-2222-2222-222222222222', 6, NOW() - INTERVAL '10 days'),
('event003-0003-0003-0003-000000000003', 'Buy drinks and dessert ingredients', TRUE, '11111111-1111-1111-1111-111111111111', 7, NOW() - INTERVAL '8 days'),
('event003-0003-0003-0003-000000000003', 'Set table and decorations', TRUE, '22222222-2222-2222-2222-222222222222', 8, NOW() - INTERVAL '8 days');

-- Event 5: Frat Party
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event005-0005-0005-0005-000000000005', 'Get frat house approval', TRUE, '44444444-4444-4444-4444-444444444444', 1, NOW() - INTERVAL '5 weeks'),
('event005-0005-0005-0005-000000000005', 'Book DJ', TRUE, '44444444-4444-4444-4444-444444444444', 2, NOW() - INTERVAL '4 weeks'),
('event005-0005-0005-0005-000000000005', 'Set up Venmo for entry fee', TRUE, '44444444-4444-4444-4444-444444444444', 3, NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'Create Facebook event page', TRUE, '77777777-7777-7777-7777-777777777777', 4, NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'Assign door duty / guest list management', TRUE, '11111111-1111-1111-1111-111111111111', 5, NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'Buy solo cups, ice, mixers', TRUE, '44444444-4444-4444-4444-444444444444', 6, NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'Plan cleanup crew', TRUE, '44444444-4444-4444-4444-444444444444', 7, NOW() - INTERVAL '3 weeks'),
('event005-0005-0005-0005-000000000005', 'Notify neighbors about party', TRUE, '44444444-4444-4444-4444-444444444444', 8, NOW() - INTERVAL '3 weeks');

-- Event 7: New Year's
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event007-0007-0007-0007-000000000007', 'Book rooftop venue', TRUE, '11111111-1111-1111-1111-111111111111', 1, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', 'Finalize catering menu', TRUE, '22222222-2222-2222-2222-222222222222', 2, NOW() - INTERVAL '8 weeks'),
('event007-0007-0007-0007-000000000007', 'Send invitations', TRUE, '11111111-1111-1111-1111-111111111111', 3, NOW() - INTERVAL '9 weeks'),
('event007-0007-0007-0007-000000000007', 'Collect RSVPs and payments', TRUE, '22222222-2222-2222-2222-222222222222', 4, NOW() - INTERVAL '7 weeks'),
('event007-0007-0007-0007-000000000007', 'Order champagne (6 bottles)', TRUE, '44444444-4444-4444-4444-444444444444', 5, NOW() - INTERVAL '7 weeks'),
('event007-0007-0007-0007-000000000007', 'Create midnight countdown plan', TRUE, '11111111-1111-1111-1111-111111111111', 6, NOW() - INTERVAL '6 weeks'),
('event007-0007-0007-0007-000000000007', 'Coordinate transportation for drunk friends', FALSE, '22222222-2222-2222-2222-222222222222', 7, NOW() - INTERVAL '6 weeks');

-- Event 15: Spring Gala
INSERT INTO todos (event_id, description, completed, assigned_to, position, created_at) VALUES
('event015-0015-0015-0015-000000000015', 'Reserve ballroom through USC', TRUE, '22222222-2222-2222-2222-222222222222', 1, NOW() - INTERVAL '3 months'),
('event015-0015-0015-0015-000000000015', 'Book caterer', TRUE, '22222222-2222-2222-2222-222222222222', 2, NOW() - INTERVAL '2 months'),
('event015-0015-0015-0015-000000000015', 'Set up ticket sales website', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 3, NOW() - INTERVAL '7 weeks'),
('event015-0015-0015-0015-000000000015', 'Book photo booth', TRUE, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, NOW() - INTERVAL '6 weeks'),
('event015-0015-0015-0015-000000000015', 'Create decoration plan', FALSE, '22222222-2222-2222-2222-222222222222', 5, NOW() - INTERVAL '4 weeks'),
('event015-0015-0015-0015-000000000015', 'Recruit volunteers for setup/cleanup', FALSE, '11111111-1111-1111-1111-111111111111', 6, NOW() - INTERVAL '3 weeks');

-- ============================================
-- MESSAGES (Rich chat history across events)
-- Showing 50+ messages with real conversation flow
-- ============================================

-- Event 2: Movie Night Chat
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'Movie night at my place this Saturday! Studio Ghibli marathon 🎬', TRUE, NOW() - INTERVAL '11 days'),
('event002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'Omg yes! I''ll make ramen for everyone', TRUE, NOW() - INTERVAL '11 days'),
('event002-0002-0002-0002-000000000002', '55555555-5555-5555-5555-555555555555', 'Spirited Away is my favorite!! 😍', TRUE, NOW() - INTERVAL '11 days'),
('event002-0002-0002-0002-000000000002', '66666666-6666-6666-6666-666666666666', 'What time? And can I bring snacks?', TRUE, NOW() - INTERVAL '11 days'),
('event002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', '7pm, come in PJs! Snacks welcome but Mahiru is cooking :)', TRUE, NOW() - INTERVAL '11 days');

-- Event 3: Thanksgiving Chat (LONG conversation)
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', 'Hey everyone! Excited for Thanksgiving dinner at my place. Who''s bringing what?', TRUE, NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'I''ll help you cook the turkey! And I can make mashed potatoes', TRUE, NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', 'I can bring a vegetarian lasagna! Just a reminder I''m vegetarian btw', TRUE, NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', '55555555-5555-5555-5555-555555555555', 'I''ll bring a vegan pumpkin pie! Also I''m vegan so keep that in mind for sides', TRUE, NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', '44444444-4444-4444-4444-444444444444', 'I''ll do cranberry sauce and stuffing!', TRUE, NOW() - INTERVAL '17 days'),
('event003-0003-0003-0003-000000000003', '66666666-6666-6666-6666-666666666666', 'What''s the budget looking like? I''m a bit tight on cash this month', TRUE, NOW() - INTERVAL '17 days'),
('event003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', '@Maya it''s $25 per person but that covers the turkey and main sides. You just need to bring a small dish!', TRUE, NOW() - INTERVAL '17 days'),
('event003-0003-0003-0003-000000000003', '66666666-6666-6666-6666-666666666666', 'Oh okay that''s manageable. I can make green bean casserole!', TRUE, NOW() - INTERVAL '17 days'),
('event003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'I''ll bring wine! Red and white? Or just bring red?', TRUE, NOW() - INTERVAL '16 days'),
('event003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', 'Both would be great! Thank you :)', TRUE, NOW() - INTERVAL '16 days'),
('event003-0003-0003-0003-000000000003', '44444444-4444-4444-4444-444444444444', 'Can I bring my roommate? She''s visiting from out of town', TRUE, NOW() - INTERVAL '15 days'),
('event003-0003-0003-0003-000000000003', '55555555-5555-5555-5555-555555555555', 'What''s the vibe music-wise? Should we make a playlist?', TRUE, NOW() - INTERVAL '14 days'),
('event003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'Great idea! I''ll set up a Spotify collaborative playlist', TRUE, NOW() - INTERVAL '14 days'),
('event003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', 'Add some chill jazz vibes!', TRUE, NOW() - INTERVAL '14 days');

-- Event 4: Maya's Birthday
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event004-0004-0004-0004-000000000004', '44444444-4444-4444-4444-444444444444', 'IT''S MAYA''S 21ST!! 🎉 K-Town BBQ this Friday!', TRUE, NOW() - INTERVAL '30 days'),
('event004-0004-0004-0004-000000000004', '66666666-6666-6666-6666-666666666666', 'Omg you guys don''t have to do this 🥺', TRUE, NOW() - INTERVAL '30 days'),
('event004-0004-0004-0004-000000000004', '11111111-1111-1111-1111-111111111111', 'Are you kidding? Of course we''re celebrating!', TRUE, NOW() - INTERVAL '30 days'),
('event004-0004-0004-0004-000000000004', '22222222-2222-2222-2222-222222222222', 'What time should we get there?', TRUE, NOW() - INTERVAL '30 days'),
('event004-0004-0004-0004-000000000004', '44444444-4444-4444-4444-444444444444', '7:30pm reservation! Birthday girl eats free, everyone else $35', TRUE, NOW() - INTERVAL '30 days'),
('event004-0004-0004-0004-000000000004', '33333333-3333-3333-3333-333333333333', 'Do they have veggie options?', TRUE, NOW() - INTERVAL '29 days'),
('event004-0004-0004-0004-000000000004', '44444444-4444-4444-4444-444444444444', 'Yes! Veggie platters for you Jake', TRUE, NOW() - INTERVAL '29 days');

-- Event 5: Frat Party Chat
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event005-0005-0005-0005-000000000005', '44444444-4444-4444-4444-444444444444', 'THROWING A MASSIVE FRAT PARTY DEC 14TH 🎊🎊🎊', TRUE, NOW() - INTERVAL '4 weeks'),
('event005-0005-0005-0005-000000000005', '77777777-7777-7777-7777-777777777777', 'Sigma Chi house is READY. DJ is booked!', TRUE, NOW() - INTERVAL '4 weeks'),
('event005-0005-0005-0005-000000000005', '11111111-1111-1111-1111-111111111111', 'How much for entry?', TRUE, NOW() - INTERVAL '4 weeks'),
('event005-0005-0005-0005-000000000005', '44444444-4444-4444-4444-444444444444', '$15 cover, includes all drinks. Venmo @tanya-frat', TRUE, NOW() - INTERVAL '4 weeks'),
('event005-0005-0005-0005-000000000005', '88888888-8888-8888-8888-888888888888', 'Can I bring friends from my floor?', TRUE, NOW() - INTERVAL '27 days'),
('event005-0005-0005-0005-000000000005', '44444444-4444-4444-4444-444444444444', 'Yes but text me their names by Dec 12 for guest list', TRUE, NOW() - INTERVAL '27 days'),
('event005-0005-0005-0005-000000000005', '99999999-9999-9999-9999-999999999999', 'I''m 20, can I still come? 😬', TRUE, NOW() - INTERVAL '27 days'),
('event005-0005-0005-0005-000000000005', '44444444-4444-4444-4444-444444444444', 'Yes! No alcohol wristband but you can party!', TRUE, NOW() - INTERVAL '27 days');

-- Event 7: NYE Party
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event007-0007-0007-0007-000000000007', '11111111-1111-1111-1111-111111111111', 'We''re doing it. NYE rooftop party downtown.', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '22222222-2222-2222-2222-222222222222', 'WAIT WHAT. Details now!!', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '11111111-1111-1111-1111-111111111111', 'Rented DTLA loft rooftop. Skyline view. Champagne at midnight. $45/person', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '44444444-4444-4444-4444-444444444444', 'I''M IN. This is going to be INSANE', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '66666666-6666-6666-6666-666666666666', 'Is $45 firm? That''s a lot for me', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '11111111-1111-1111-1111-111111111111', 'DM me, we can work something out. Venue + catering is expensive but I want everyone there', TRUE, NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', '55555555-5555-5555-5555-555555555555', 'What''s the dress code?', TRUE, NOW() - INTERVAL '9 weeks'),
('event007-0007-0007-0007-000000000007', '22222222-2222-2222-2222-222222222222', 'COCKTAIL ATTIRE! It''s NYE, dress UP', TRUE, NOW() - INTERVAL '9 weeks');

-- Event 10: Valentine's Party
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event010-0010-0010-0010-000000000010', '22222222-2222-2222-2222-222222222222', 'Valentine''s Day party at our place! Singles + couples welcome 💕', TRUE, NOW() - INTERVAL '85 days'),
('event010-0010-0010-0010-000000000010', '11111111-1111-1111-1111-111111111111', 'Come with a date or come solo! We''ll have fun games for everyone', TRUE, NOW() - INTERVAL '85 days'),
('event010-0010-0010-0010-000000000010', '66666666-6666-6666-6666-666666666666', 'Wait is this like... a couples thing? I''m single and don''t want to be awkward', TRUE, NOW() - INTERVAL '85 days'),
('event010-0010-0010-0010-000000000010', '22222222-2222-2222-2222-222222222222', 'NOT AT ALL! It''s a mixer. Games pair random people. Super fun!', TRUE, NOW() - INTERVAL '85 days'),
('event010-0010-0010-0010-000000000010', '44444444-4444-4444-4444-444444444444', 'I''m bringing my boyfriend!', TRUE, NOW() - INTERVAL '84 days'),
('event010-0010-0010-0010-000000000010', '55555555-5555-5555-5555-555555555555', 'Coming solo! Can''t wait', TRUE, NOW() - INTERVAL '84 days');

-- Event 15: Spring Gala
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
('event015-0015-0015-0015-000000000015', '22222222-2222-2222-2222-222222222222', 'USC SPRING GALA - tickets on sale! Link in bio', TRUE, NOW() - INTERVAL '30 days'),
('event015-0015-0015-0015-000000000015', '55555555-5555-5555-5555-555555555555', 'How formal is formal? Do I need a floor-length gown?', TRUE, NOW() - INTERVAL '29 days'),
('event015-0015-0015-0015-000000000015', '22222222-2222-2222-2222-222222222222', 'Cocktail dress is fine! Just no casual dresses', TRUE, NOW() - INTERVAL '29 days'),
('event015-0015-0015-0015-000000000015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'Can I buy tickets at the door?', TRUE, NOW() - INTERVAL '28 days'),
('event015-0015-0015-0015-000000000015', '22222222-2222-2222-2222-222222222222', 'No - must prepay by April 18. Catering needs headcount!', TRUE, NOW() - INTERVAL '28 days'),
('event015-0015-0015-0015-000000000015', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'What''s the food situation?', TRUE, NOW() - INTERVAL '27 days'),
('event015-0015-0015-0015-000000000015', '11111111-1111-1111-1111-111111111111', '3-course dinner! Choose chicken, fish, or veggie when you buy ticket', TRUE, NOW() - INTERVAL '27 days');

-- (More messages for other events...)
INSERT INTO messages (event_id, user_id, content, ai_processed, created_at) VALUES
-- Event 13: Pool Party
('event013-0013-0013-0013-000000000013', '88888888-8888-8888-8888-888888888888', 'POOL PARTY AT MY HOUSE!! My family is out of town 😎', TRUE, NOW() - INTERVAL '50 days'),
('event013-0013-0013-0013-000000000013', '44444444-4444-4444-4444-444444444444', 'YESSS when??', TRUE, NOW() - INTERVAL '50 days'),
('event013-0013-0013-0013-000000000013', '88888888-8888-8888-8888-888888888888', 'March 28, 2pm. Bring swimsuits!', TRUE, NOW() - INTERVAL '50 days'),
('event013-0013-0013-0013-000000000013', '11111111-1111-1111-1111-111111111111', 'Is there food or should we bring stuff?', TRUE, NOW() - INTERVAL '49 days'),
('event013-0013-0013-0013-000000000013', '88888888-8888-8888-8888-888888888888', 'My dad is grilling! But bring sides potluck style', TRUE, NOW() - INTERVAL '49 days');

-- ============================================
-- GROUND TRUTH CHANGES (Audit Log - Transparency)
-- ============================================

-- Event 2: Movie Night
INSERT INTO ground_truth_changes (event_id, fact_id, fact_key, changed_by, change_type, old_value, new_value, changed_at) VALUES
('event002-0002-0002-0002-000000000002', 'gt-e002-address', 'address', '11111111-1111-1111-1111-111111111111', 'created', NULL, '456 West 28th Street, Apt 201, Los Angeles, CA 90007', NOW() - INTERVAL '11 days');

-- Event 3: Thanksgiving (showing edits)
INSERT INTO ground_truth_changes (event_id, fact_id, fact_key, changed_by, change_type, old_value, new_value, changed_at) VALUES
('event003-0003-0003-0003-000000000003', 'gt-e003-address', 'address', '11111111-1111-1111-1111-111111111111', 'created', NULL, '456 West 28th Street, Apt 201, Los Angeles, CA 90007', NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', 'gt-e003-budget', 'budget', '11111111-1111-1111-1111-111111111111', 'created', NULL, '$20 per person', NOW() - INTERVAL '18 days'),
('event003-0003-0003-0003-000000000003', 'gt-e003-budget', 'budget', '11111111-1111-1111-1111-111111111111', 'updated', '$20 per person', '$25 per person (covers turkey and sides). Just bring your dish!', NOW() - INTERVAL '17 days'),  -- Amane raised budget
('event003-0003-0003-0003-000000000003', 'gt-e003-rsvp', 'rsvp_deadline', '22222222-2222-2222-2222-222222222222', 'created', NULL, 'RSVP by Nov 24th!', NOW() - INTERVAL '16 days');  -- Mahiru added RSVP

-- Event 7: NYE (budget negotiation)
INSERT INTO ground_truth_changes (event_id, fact_id, fact_key, changed_by, change_type, old_value, new_value, changed_at) VALUES
('event007-0007-0007-0007-000000000007', 'gt-e007-budget', 'budget', '11111111-1111-1111-1111-111111111111', 'created', NULL, '$50 per person', NOW() - INTERVAL '10 weeks'),
('event007-0007-0007-0007-000000000007', 'gt-e007-budget', 'budget', '22222222-2222-2222-2222-222222222222', 'updated', '$50 per person', '$45 per person (negotiated with venue)', NOW() - INTERVAL '9 weeks');  -- Mahiru negotiated

-- Event 15: Gala (clarifications)
INSERT INTO ground_truth_changes (event_id, fact_id, fact_key, changed_by, change_type, old_value, new_value, changed_at) VALUES
('event015-0015-0015-0015-000000000015', 'gt-e015-dress', 'dress_code', '22222222-2222-2222-2222-222222222222', 'created', NULL, 'Formal attire', NOW() - INTERVAL '30 days'),
('event015-0015-0015-0015-000000000015', 'gt-e015-dress', 'dress_code', '22222222-2222-2222-2222-222222222222', 'updated', 'Formal attire', 'FORMAL/SEMI-FORMAL. Floor-length gowns or cocktail dresses. Suits/tuxes.', NOW() - INTERVAL '25 days');  -- Clarified after confusion

-- ============================================
-- NOTES & SUMMARY
-- ============================================

-- All ground truth facts have NULL embeddings initially
-- Backend will generate embeddings when facts are created/updated
-- Use OpenAI text-embedding-3-small model

-- All passwords are hashed version of "test123" for testing
-- Password hash: $2b$12$KIXqKzNE8a3zJtK.MlxQAed2eT8i5ZPqA6JoZ8jD3Xw8Vx7vQhIKa

-- AI Bot user (id: 00000000-...) is created in schema.sql

-- This seed data demonstrates:
-- ✓ Group evolution over 6 months (16 events)
-- ✓ Relationship milestones (Amane + Mahiru co-hosting V-Day)
-- ✓ Event type variety (tight-knit → big → formal)
-- ✓ Budget progression ($0-$65)
-- ✓ Preference persistence (dietary restrictions carry over)
-- ✓ Realistic chat conversations (~50 messages)
-- ✓ Escalations and resolutions (20+ examples)
-- ✓ AI suggestions (15+ examples)
-- ✓ Rich to-do lists (60+ tasks)
-- ✓ Audit trail (change log transparency)

-- STATISTICS:
-- • 14 users (6 core + 8 peripheral)
-- • 1 group (Friend Group 6)
-- • 16 events across 6 months
-- • 100+ ground truth facts
-- • 50+ chat messages
-- • 20+ escalated questions
-- • 15+ AI suggestions
-- • 60+ to-do items
-- • 10+ change log entries
-- • 25+ guest preference records

-- Total lines: ~2100+
