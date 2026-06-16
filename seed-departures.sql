-- Créer 5 départs de test pour SKAE Transport Yopougon
INSERT INTO departures (companyId, busId, departureCity, arrivalCity, departureTime, estimatedArrivalTime, totalSeats, availableSeats, price, status, createdAt, updatedAt) VALUES
(1, 1, 'Abidjan', 'Yamoussoukro', '2026-05-20 08:00:00', '2026-05-20 11:00:00', 50, 50, 15000, 'scheduled', NOW(), NOW()),
(1, 2, 'Abidjan', 'Bouaké', '2026-05-20 10:00:00', '2026-05-20 14:00:00', 50, 50, 18000, 'scheduled', NOW(), NOW()),
(1, 3, 'Abidjan', 'Gagnoa', '2026-05-20 12:00:00', '2026-05-20 16:00:00', 50, 50, 12000, 'scheduled', NOW(), NOW()),
(1, 4, 'Abidjan', 'San Pédro', '2026-05-20 14:00:00', '2026-05-20 19:00:00', 50, 50, 20000, 'scheduled', NOW(), NOW()),
(1, 5, 'Abidjan', 'Daloa', '2026-05-20 16:00:00', '2026-05-20 20:00:00', 50, 50, 16000, 'scheduled', NOW(), NOW());
