-- Add missing tables to existing TrustArc schema

-- Fleet Owners
CREATE TABLE IF NOT EXISTS fleet_owners (
  fleet_owner_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  driver_id SERIAL PRIMARY KEY,
  fleet_owner_id INTEGER REFERENCES fleet_owners(fleet_owner_id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  license_number VARCHAR(100),
  license_expiry DATE,
  medical_expiry DATE,
  background_check_date DATE,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id SERIAL PRIMARY KEY,
  fleet_owner_id INTEGER REFERENCES fleet_owners(fleet_owner_id),
  registration_number VARCHAR(100) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  vehicle_class VARCHAR(20) DEFAULT 'sedan',
  seat_capacity INTEGER DEFAULT 4,
  luggage_capacity INTEGER DEFAULT 2,
  vin VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  last_inspection_date DATE,
  next_inspection_due DATE,
  mileage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  trip_id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(route_id),
  trip_date DATE NOT NULL,
  departure_time VARCHAR(10),
  arrival_time VARCHAR(10),
  vehicle_id INTEGER REFERENCES vehicles(vehicle_id),
  driver_id INTEGER REFERENCES drivers(driver_id),
  status VARCHAR(20) DEFAULT 'scheduled',
  seats_available INTEGER NOT NULL,
  seats_occupied INTEGER DEFAULT 0,
  actual_departure TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  booking_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES customers(customer_id),
  trip_id INTEGER REFERENCES trips(trip_id),
  subscription_id INTEGER REFERENCES subscriptions(subscription_id),
  booking_type VARCHAR(20) DEFAULT 'single',
  status VARCHAR(20) DEFAULT 'draft',
  seats_booked INTEGER DEFAULT 1,
  pickup_location VARCHAR(255),
  dropoff_location VARCHAR(255),
  special_requests TEXT,
  total_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2),
  hold_expiry TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  document_id SERIAL PRIMARY KEY,
  owner_type VARCHAR(50) NOT NULL,
  owner_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'uploaded',
  expiry_date DATE,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  uploaded_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Items
CREATE TABLE IF NOT EXISTS work_items (
  work_item_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  created_by VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link bookings to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS booking_id INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_route_date ON trips(route_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_assigned ON work_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Seed fleet owners
INSERT INTO fleet_owners (company_name, registration_number, tax_id, phone, email, city, status) VALUES
  ('Cape Transit Co', 'CT-2024-001', '9200123456', '+27 21 555 0100', 'info@capetransit.co.za', 'Cape Town', 'approved'),
  ('Johannesburg Shuttles', 'JHB-2024-015', '9012345678', '+27 11 555 0200', 'bookings@jhbshuttles.co.za', 'Johannesburg', 'approved'),
  ('Durban Express', 'DBN-2024-008', '9988776655', '+27 31 555 0300', 'admin@dbnexpress.co.za', 'Durban', 'pending')
ON CONFLICT DO NOTHING;

-- Seed drivers
INSERT INTO drivers (fleet_owner_id, full_name, email, phone, license_number, license_expiry, medical_expiry, status) VALUES
  (1, 'David Nkosi', 'david@capetransit.co.za', '+27 82 111 2222', 'CK123456789', '2027-06-15', '2026-12-01', 'approved'),
  (1, 'Sarah Williams', 'sarah@capetransit.co.za', '+27 83 222 3333', 'CK987654321', '2028-03-20', '2027-01-15', 'approved'),
  (2, 'Pieter van der Merwe', 'pieter@jhbshuttles.co.za', '+27 84 333 4444', 'GP456789123', '2027-08-20', '2027-02-28', 'approved'),
  (2, 'Thabo Mokoena', 'thabo@jhbshuttles.co.za', '+27 71 444 5555', 'GP789123456', '2028-01-10', '2026-11-20', 'active'),
  (3, 'Lerato Khumalo', 'lerato@dbnexpress.co.za', '+27 72 555 6666', 'KZN112233445', '2029-04-25', '2027-06-15', 'pending')
ON CONFLICT DO NOTHING;

-- Seed vehicles
INSERT INTO vehicles (fleet_owner_id, registration_number, make, model, year, color, vehicle_class, seat_capacity, luggage_capacity, status, last_inspection_date, next_inspection_due, mileage) VALUES
  (1, 'CA 123-456', 'Toyota', 'Quantum', 2023, 'White', 'van', 14, 10, 'active', '2026-01-15', '2026-07-15', 45000),
  (1, 'CA 789-012', 'Mercedes-Benz', 'Sprinter', 2024, 'Silver', 'bus', 22, 15, 'active', '2026-02-20', '2026-08-20', 28000),
  (2, 'JHB 456-789', 'VW', 'Crafter', 2023, 'Blue', 'van', 16, 12, 'active', '2026-03-10', '2026-09-10', 62000),
  (2, 'JHB 901-234', 'Toyota', 'HiAce', 2022, 'White', 'van', 12, 8, 'maintenance', '2025-10-05', '2026-04-05', 89000),
  (3, 'ND 555-777', 'Ford', 'Transit', 2024, 'Black', 'van', 15, 10, 'pending', NULL, NULL, 5000)
ON CONFLICT DO NOTHING;

-- Seed trips
INSERT INTO trips (route_id, trip_date, departure_time, arrival_time, vehicle_id, driver_id, status, seats_available, seats_occupied) VALUES
  (1, CURRENT_DATE + INTERVAL '1 day', '07:00', '07:45', 1, 1, 'scheduled', 14, 8),
  (1, CURRENT_DATE + INTERVAL '2 days', '07:00', '07:45', 1, 1, 'scheduled', 14, 12),
  (1, CURRENT_DATE + INTERVAL '3 days', '07:00', '07:45', 2, 2, 'scheduled', 22, 5),
  (2, CURRENT_DATE + INTERVAL '1 day', '06:30', '07:20', 3, 3, 'scheduled', 16, 10),
  (2, CURRENT_DATE + INTERVAL '2 days', '06:30', '07:20', 3, 4, 'scheduled', 16, 14),
  (3, CURRENT_DATE, '08:00', '08:25', 2, 2, 'in_progress', 22, 15),
  (4, CURRENT_DATE + INTERVAL '1 day', '07:30', '08:00', 1, 1, 'scheduled', 14, 6),
  (2, CURRENT_DATE - INTERVAL '1 day', '06:30', '07:20', 3, 3, 'completed', 16, 16)
ON CONFLICT DO NOTHING;

-- Seed bookings
INSERT INTO bookings (booking_number, customer_id, trip_id, booking_type, status, seats_booked, pickup_location, dropoff_location, total_amount, final_amount) VALUES
  ('BK-20260501-001', 1, 1, 'single', 'confirmed', 2, 'Cape Town Station', 'Stellenbosch University', 240.00, 240.00),
  ('BK-20260501-002', 2, 1, 'single', 'confirmed', 1, 'V&A Waterfront', 'Stellenbosch Central', 120.00, 120.00),
  ('BK-20260501-003', 3, 4, 'return', 'confirmed', 2, 'Sandton City', 'Pretoria CBD', 190.00, 190.00),
  ('BK-20260501-004', 4, 5, 'single', 'hold', 1, 'Rosebank', 'Hatfield', 95.00, 95.00),
  ('BK-20260501-005', 5, 2, 'subscription', 'confirmed', 2, 'Cape Town CBD', 'Stellenbosch', 240.00, 240.00),
  ('BK-20260501-006', 6, 7, 'single', 'draft', 1, 'Sea Point', 'Bellville', 85.00, 85.00)
ON CONFLICT DO NOTHING;

-- Seed documents
INSERT INTO documents (owner_type, owner_id, document_type, document_name, file_url, expiry_date, status, is_current) VALUES
  ('driver', 1, 'license', 'Driver License - David Nkosi', 'https://storage.example.com/docs/license_1.pdf', '2027-06-15', 'approved', TRUE),
  ('driver', 2, 'license', 'Driver License - Sarah Williams', 'https://storage.example.com/docs/license_2.pdf', '2028-03-20', 'approved', TRUE),
  ('driver', 3, 'license', 'Driver License - Pieter vd Merwe', 'https://storage.example.com/docs/license_3.pdf', '2027-08-20', 'approved', TRUE),
  ('vehicle', 1, 'vehicle_inspection', 'Toyota Quantum Inspection', 'https://storage.example.com/docs/inspection_1.pdf', '2026-07-15', 'approved', TRUE),
  ('vehicle', 3, 'vehicle_inspection', 'VW Crafter Inspection', 'https://storage.example.com/docs/inspection_3.pdf', '2026-09-10', 'approved', TRUE),
  ('fleet_owner', 1, 'insurance', 'Cape Transit Insurance 2026', 'https://storage.example.com/docs/insurance_1.pdf', NULL, 'approved', TRUE),
  ('fleet_owner', 2, 'insurance', 'JHB Shuttles Insurance 2026', 'https://storage.example.com/docs/insurance_2.pdf', NULL, 'approved', TRUE)
ON CONFLICT DO NOTHING;

-- Seed work items
INSERT INTO work_items (title, description, priority, assigned_to, created_by, entity_type, entity_id, due_date, status) VALUES
  ('Review new fleet owner application', 'Durban Express application needs review', 'medium', 'Admin', 'System', 'fleet_owner', 3, CURRENT_DATE + INTERVAL '3 days', 'open'),
  ('Vehicle inspection due', 'JHB 901-234 inspection was due 2026-04-05', 'high', 'Admin', 'System', 'vehicle', 4, CURRENT_DATE, 'open'),
  ('Driver license renewal', 'David Nkosi license expires June 2027', 'medium', 'Admin', 'System', 'driver', 1, '2027-05-15', 'open'),
  ('Process refund for cancelled trip', 'Trip refund pending for customer', 'urgent', 'Admin', 'System', 'booking', 1, CURRENT_DATE, 'in_progress'),
  ('Update route pricing', 'Review and update Q2 pricing for all routes', 'low', 'Admin', 'System', 'route', 1, CURRENT_DATE + INTERVAL '14 days', 'open')
ON CONFLICT DO NOTHING;
