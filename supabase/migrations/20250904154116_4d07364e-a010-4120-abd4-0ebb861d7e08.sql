-- Remove all existing visa types
DELETE FROM visa_types;

-- Insert comprehensive UK visa types
INSERT INTO visa_types (name, country_id, description, duration_months, is_active) VALUES
-- Work Visas
('Skilled Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For skilled workers with job offers in the UK', 60, true),
('Global Talent Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For exceptional talent in specific fields (science, engineering, humanities, medicine, digital technology, arts and culture)', 60, true),
('Health and Care Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For healthcare professionals to work in eligible jobs in the UK health and care sector', 60, true),
('Seasonal Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For temporary work in agriculture and poultry sectors', 6, true),
('International Sportsperson Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For elite sportspeople and coaches', 36, true),
('Minister of Religion Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For religious workers', 36, true),
('Charity Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For unpaid voluntary work with certain charities', 12, true),
('Creative Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For creative and sporting professionals', 12, true),
('Government Authorised Exchange Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For approved exchange programmes', 24, true),

-- Business Visas
('Start-up Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For starting an innovative business in the UK', 24, true),
('Innovator Founder Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For experienced businesspeople setting up innovative businesses', 36, true),
('Self-sponsorship Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For business owners to sponsor themselves under Skilled Worker route', 60, true),
('Representative of an Overseas Business', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For senior employees establishing UK branch or subsidiary', 36, true),

-- Study Visas
('Student Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For studying at UK educational institutions', 48, true),
('Child Student Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For children aged 4 to 17 studying at independent schools', 72, true),
('Short-term Study Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For short courses up to 6 or 11 months', 11, true),

-- Family Visas
('Spouse/Partner Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For partners of British citizens or settled persons', 33, true),
('Fiancé(e) Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For getting married or entering civil partnership in the UK', 6, true),
('Child Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For children joining parents in the UK', 33, true),
('Parent Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For parents of British citizen children', 33, true),
('Adult Dependent Relative Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For adult relatives requiring long-term care', 33, true),

-- Visitor Visas
('Standard Visitor Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For tourism, business visits, and short-term activities', 6, true),
('Marriage Visitor Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For getting married or entering civil partnership', 6, true),
('Permitted Paid Engagement Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For specific paid engagements', 1, true),
('Transit Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For passing through the UK', 1, true),

-- Settlement Visas
('Indefinite Leave to Remain (ILR)', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'Permanent residence in the UK', NULL, true),
('British Citizenship', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'Full British citizenship', NULL, true),

-- Special Categories
('Youth Mobility Scheme', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For young people from eligible countries (18-30 years old)', 24, true),
('Ancestry Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For Commonwealth citizens with UK grandparent', 60, true),
('Domestic Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For domestic workers in private households', 6, true),
('Turkish Businessperson Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For Turkish nationals under ECAA arrangements', 12, true),
('Turkish Worker Visa', 'fc8cc059-253e-47cc-88ab-d210ec84709e', 'For Turkish workers under ECAA arrangements', 12, true);