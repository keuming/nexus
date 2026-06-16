# NEXUS - TODO

## Phase 1 : Base de données
- [x] Schéma complet : chambres, réservations, clients, caisse, services, housekeeping, inventaire, employés
- [x] Migration DB (pnpm db:push)

## Phase 2 : Backend tRPC
- [x] Routes chambres (CRUD + statut)
- [x] Routes réservations (CRUD + statuts)
- [x] Routes clients (CRUD + historique)
- [x] Routes caisse (encaissements, factures)
- [x] Routes services additionnels
- [x] Routes housekeeping (tâches, assignation)
- [x] Routes inventaire (stocks, alertes)
- [x] Routes analytics (KPI, rapports)
- [x] Routes employés (CRUD + rôles)
- [x] Routes dashboard (indicateurs agrégés)

## Phase 3 : Design & Layout
- [x] Palette de couleurs élégante (bleu marine, or, blanc cassé)
- [x] Typographie professionnelle (Google Fonts)
- [x] DashboardLayout avec sidebar navigation complète
- [x] Thème global index.css

## Phase 4 : Dashboard
- [x] KPI : Taux d'Occupation, RevPAR, ADR, CA Total
- [x] Graphique Statut des chambres (donut)
- [x] Graphique Répartition CA (barres)
- [x] Indicateurs rapides (Total chambres, Réservations, Panier moyen, Stock critique)
- [x] Tableau Réservations récentes
- [x] Bouton "Nouvelle réservation"

## Phase 5 : Chambres & Réservations
- [x] Liste des chambres avec statut en temps réel (Libre, Occupée, Maintenance, Réservée)
- [x] Création/édition de chambre (type, tarif, étage, description)
- [x] Formulaire de réservation complet
- [x] Calendrier de disponibilité
- [x] Gestion des statuts (En attente, Confirmée, Check-in, Check-out, Annulée)
- [x] Historique des réservations

## Phase 6 : Clients & Caisse
- [x] Profils clients (coordonnées, préférences)
- [x] Historique des séjours par client
- [x] Module caisse : encaissements, factures
- [x] Moyens de paiement (Espèces, CB, Virement, Mobile Money)
- [x] Rapports financiers
- [x] Accès caisse sécurisé par PIN

## Phase 7 : Services, Housekeeping & Inventaire
- [x] Catalogue de services additionnels (restaurant, spa, blanchisserie)
- [x] Facturation des extras sur réservation
- [x] Planning housekeeping
- [x] Assignation des tâches de nettoyage
- [x] Suivi statut chambres (Propre, Sale, En cours)
- [x] Gestion stocks inventaire (linge, produits, minibar)
- [x] Alertes réapprovisionnement

## Phase 8 : Analytics & Employés
- [x] Rapports détaillés (CA, occupation, RevPAR)
- [x] Graphiques de tendances
- [x] Prévisions d'occupation
- [x] Profils employés (rôles : Admin, Réceptionniste, Housekeeping, Manager)
- [x] Planning du personnel
- [x] Gestion des permissions par rôle

## Phase 9 : Tests & Livraison
- [x] Tests Vitest backend
- [x] Checkpoint final
- [x] Livraison à l'utilisateur

## Interface Publique Client

- [x] Schéma DB : table hotelProfiles (logo, pays, ville, type, description), table countries, table cities
- [x] Migration DB
- [x] Routes tRPC publiques : liste hôtels, recherche pays/ville/type, détail hôtel + chambres
- [x] Route inscription hôtel avec upload logo S3
- [x] Page d'accueil publique avec hero, recherche pays/ville/type, grille établissements
- [x] Formulaire inscription hôtel (pays, ville liée, nom hôtel, gérant, contact, email, logo)
- [x] Page publique établissement : logo, nom, chambres disponibles
- [x] Intégration logo dans le dashboard admin (sidebar + header)
- [x] Tests et checkpoint

## Système de Notation & Commentaires
- [x] Table reviews (hotelId, clientName, rating 1-5, comment, createdAt, approved)
- [x] Migration DB
- [x] Route tRPC : créer un avis (public)
- [x] Route tRPC : lister les avis d'un hôtel (public)
- [x] Route tRPC : approuver/supprimer un avis (admin)
- [x] Composant notation étoiles interactif sur page publique hôtel
- [x] Section commentaires avec pagination sur page publique hôtel
- [x] Note moyenne affichée sur la carte hôtel (PublicHome)
- [x] Section avis dans le dashboard admin (modération)
- [x] Tests et checkpoint

## Offres Spéciales
- [x] Table specialOffers (titre, description, remise %, dates validité, actif, hotelProfileId)
- [x] Migration DB
- [x] Routes tRPC : CRUD admin (créer, modifier, supprimer, lister)
- [x] Route tRPC publique : lister offres actives d'un hôtel
- [x] Page dashboard admin "Offres spéciales" (liste + formulaire)
- [x] Section offres spéciales sur la page publique hôtel
- [x] Badge "Offre" sur les cartes chambres concernées
- [x] Tests et checkpoint

## Galerie Photos Chambres
- [x] Table roomPhotos (roomId, url, fileKey, caption, sortOrder)
- [x] Migration DB
- [x] Route tRPC upload photo (multipart -> S3)
- [x] Route tRPC list photos par chambre
- [x] Route tRPC delete photo
- [x] Route tRPC reorder photos
- [x] Composant GalerieModal dans le dashboard Chambres
- [x] Upload drag-and-drop avec prévisualisation
- [x] Carousel photos sur la page publique hôtel
- [x] Tests et checkpoint

## Badge Offre Spéciale sur Chambres
- [x] Lier offres aux types de chambres (roomTypeId optionnel dans specialOffers)
- [x] Mettre à jour la route publique getRooms pour inclure les offres actives par chambre
- [x] Badge animé "Offre" sur le carousel photo de chaque chambre concernée
- [x] Badge "Offre" sur les cartes de la page d'accueil publique
- [x] Tests et checkpoint

## Confirmation / Refus des Réservations
- [x] Champs DB : refusalReason, confirmedAt, refusedAt dans la table reservations
- [x] Migration DB
- [x] Route tRPC reservations.confirm (admin)
- [x] Route tRPC reservations.refuse avec motif (admin)
- [x] Route tRPC reservations.getPending (réservations en attente)
- [x] Page "Réservations en attente" dans le dashboard avec actions Confirmer/Refuser
- [x] Modal de refus avec champ motif obligatoire
- [x] Badge compteur "En attente" dans la sidebar
- [x] Mise à jour page Réservations : boutons Confirmer/Refuser inline
- [x] Mise à jour Dashboard : widget "Réservations en attente"
- [x] Tests et checkpoint

## Filtre Budget sur l'Interface Publique
- [x] Route backend publicHotels.search accepte maxPrice (coût nuitée ≤ budget)
- [x] Champ "Budget max (FCFA)" dans le formulaire de recherche PublicHome
- [x] Filtrage des hôtels : afficher uniquement ceux ayant au moins une chambre ≤ budget
- [x] Affichage du prix "à partir de X FCFA" sur les cartes hôtel
- [x] Filtre budget sur la page publique de l'établissement (chambres affichées)
- [x] Tests et checkpoint

## Tri des Résultats de Recherche
- [x] Backend : enrichir publicHotels.search avec avgRating, reviewCount, roomCount
- [x] Sélecteur de tri (Prix croissant, Prix décroissant, Meilleure note, Popularité)
- [x] Tri côté client sur les résultats retournés
- [x] Affichage note moyenne (étoiles) sur les cartes hôtel
- [x] Affichage nb avis sur les cartes hôtel
- [x] Tests et checkpoint

## Partage Réseaux Sociaux
- [x] Composant ShareButton (WhatsApp, Facebook, X/Twitter, copier le lien)
- [x] Intégration dans la page publique hôtel (header)
- [x] Bouton partage sur les cartes résultats de recherche
- [x] Toast de confirmation "Lien copié !"
- [x] Tests et checkpoint

## Filtre Disponibilité par Dates
- [x] Route tRPC publicHotels.getAvailableRooms (hotelId, checkIn, checkOut)
- [x] Logique DB : exclure chambres avec réservation confirmée/check-in sur la période
- [x] Sélecteur dates arrivée/départ dans PublicHotel
- [x] Affichage "X chambres disponibles du JJ/MM au JJ/MM"
- [x] Pré-remplissage des dates dans le formulaire de réservation
- [x] Audit général et correction des bugs (TypeScript, types baseConditions, imports)
- [x] Tests et checkpoint

## Migration Transport Multi-Compagnies (NEXUS)
- [x] Schéma BDD : 13 tables transport (companies, bus_lines, buses, trips, departures, tickets, bookings, shipments, charges, route_fares, company_billing, staff, stations)
- [x] Migration BDD poussée (pnpm db:push)
- [x] Backend transport-db.ts : helpers DB pour tous les modules transport
- [x] Backend routers/transport.ts : routes tRPC public, compagnie, CSN
- [x] Routes publiques : companies, companiesByCountry, tripsByCompany, tripsByCountry, searchDepartures, occupiedSeats, book, bookPublic, trackShipment, verifyTicket
- [x] Routes CSN : stats, allCompanies, validateCompany, allBilling, generateBilling, updateBillingStatus
- [x] Routes compagnie : register, dashboard stats, busLines, buses, trips, departures, tickets, shipments, bookings, charges, staff, stations, routeFares, settings
- [x] Page RegisterCompany.tsx (inscription compagnie avec OAuth)
- [x] Page CsnDashboard.tsx (dashboard CSN avec validation compagnies et facturation)
- [x] Page TransportDashboard.tsx (dashboard compagnie multi-modules)
- [x] Page TransportSettings.tsx (paramètres compagnie : logo, couleurs, entête)
- [x] Page NexusHome.tsx (interface publique unifiée : pays → compagnie → trajets → réservation)
- [x] App.tsx mis à jour avec toutes les nouvelles routes
- [x] 0 erreur TypeScript, 19 tests passants

## Transport National/International + Multi-Activités
- [x] Schéma BDD : champ activityType (transport/restauration/expedition) dans transport_companies
- [x] Migration BDD
- [x] NexusHome.tsx : onglets National/International avec villes dynamiques par pays
- [x] NexusHome.tsx : section Restauration (commande en ligne)
- [x] NexusHome.tsx : section Expédition (formulaire + partage GPS livreur)
- [x] NexusHome.tsx : sélecteur type d'activité sur l'interface publique
- [x] RegisterCompany.tsx : champ sélection type d'activité avec icônes
- [x] TransportDashboard.tsx : dashboard conditionnel Restauration (Commandes + Commandes en ligne)
- [x] TransportDashboard.tsx : dashboard conditionnel Expédition (Demandes en ligne + agence)
- [x] 0 erreur TypeScript, 19 tests passants, checkpoint sauvegardé

## Catalogue Produits Restauration
- [x] Tables BDD : menu_categories + menu_items (avec photo S3, prix, disponibilité, ordre)
- [x] Migration BDD (pnpm db:push)
- [x] Backend helpers menu-db.ts : CRUD catégories et plats, upload photo S3, liste publique
- [x] Routes tRPC : menu.createCategory, updateCategory, deleteCategory, listCategories, reorderCategories
- [x] Routes tRPC : menu.createItem, updateItem, deleteItem, uploadItemPhoto, listItems, toggleAvailability
- [x] Route tRPC publique : menu.publicMenu (catégories + plats disponibles par compagnie)
- [x] Page MenuCatalogue.tsx : gestion complète catégories + plats avec upload photo drag-and-drop
- [x] Bouton "Gérer la carte" dans les actions rapides du dashboard restaurant
- [x] Route /transport/menu enregistrée dans App.tsx
- [x] Interface publique : menu interactif par catégorie avec photos, prix, panier
- [x] Interface publique : checkout (type livraison/sur place, formulaire, confirmation)
- [x] 0 erreur TypeScript, 19 tests passants, checkpoint sauvegardé

## Mise à jour UX + Commandes en ligne + Temps de préparation
- [x] Réduire intensité orange de 50% dans index.css (NexusHome hero + boutons)
- [x] Adapter couleurs de texte pour lisibilité sur fond atténué
- [x] Remplacer "NEXUS" par "NEXUS" partout (NexusHome.tsx, App.tsx, RegisterCompany.tsx, CsnDashboard.tsx, TransportDashboard.tsx)
- [x] Ajouter service client : +225 0504921096 / 0566479618 et clients@nexus.com dans footer/header
- [x] Schéma BDD : table online_orders (id, companyId, items JSON, customerName, phone, address, orderType, totalAmount, prepTime, status, createdAt)
- [x] Migration BDD
- [x] Route tRPC menu.createOnlineOrder (public)
- [x] Route tRPC menu.listOnlineOrders (compagnie)
- [x] Route tRPC menu.updateOrderStatus (compagnie)
- [x] Champ prepTime dans menu_items (temps de préparation en minutes)
- [x] Migration BDD pour prepTime
- [x] Afficher temps de préparation sur fiche plat (interface publique)
- [x] Calculer temps total estimé dans le récapitulatif du panier
- [x] Persister commande en BDD lors du checkout
- [x] Onglet "Commandes en ligne" dans dashboard restaurant avec statuts
- [x] TypeScript 0 erreur + tests + checkpoint

## Améliorations UX v2.1 — Notifications, Filtres, PDF, Couleurs
- [x] Intensité orange +35% dans NexusHome.tsx et index.css
- [x] Couleur expédition (bleu) remplacée par bleu doux (sky-500/600)
- [x] Filtres par statut dans l'onglet Commandes en ligne du dashboard restaurant
- [x] Barre de recherche par référence ou nom client dans l'onglet Commandes en ligne
- [x] Bouton "Imprimer" sur chaque commande → génère un ticket HTML imprimable (référence, articles, adresse, total)
- [x] Notification owner (notifyOwner) déclenchée côté serveur à chaque nouvelle commande restaurant
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Améliorations UX v2.2 — Polling, Stats, Zones, Couleurs, Footer
- [x] Couleurs finales : orange vif professionnel #E8751A + bleu doux sky-500/600
- [x] Polling auto 30s sur l'onglet Commandes en ligne (refetchInterval)
- [x] Stats restauration dans Finance : CA commandes du jour, nb livrées, panier moyen
- [x] Backend : table delivery_zones (companyId, name, extraMinutes, active)
- [x] Backend : routes tRPC menu.listDeliveryZones, menu.upsertDeliveryZone, menu.deleteDeliveryZone
- [x] Dashboard restaurant : section "Zones de livraison" dans l'onglet Finance
- [x] Header NexusHome : numéro service client visible (+225 0504921096 / 0566479618)
- [x] Retirer le lien "Dashboard" du header (caché)
- [x] Footer complet : logo, description, services, liens, contact, réseaux sociaux
- [x] Lien dashboard caché dans le "2" de "©2026" dans le footer
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Améliorations UX v2.3 — Zone checkout, Badge, Page À propos
- [x] Sélecteur de zone dans le checkout public (livraison) avec délai ajouté au temps total
- [x] Badge rouge "Nouvelles commandes" en temps réel sur l'onglet Commandes en ligne du dashboard
- [x] Page À propos (/about) : mission, chiffres clés, partenaires CSN
- [x] Lien "À propos" dans le footer (colonne Liens utiles)
- [x] Route /about dans App.tsx
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Améliorations UX v2.4 — Animations, QR Code, Répertoire, Avis, CSN, Paiement mobile
- [x] Installer dépendances : qrcode.react, framer-motion
- [x] Animations NexusHome : hero fade-in, cartes slide-in, onglets transition (framer-motion)
- [x] Schéma DB : table company_reviews (companyId, rating, comment, authorName, activityType, createdAt)
- [x] Schéma DB : table company_gallery (companyId, imageUrl, caption, displayOrder, createdAt)
- [x] Migration DB
- [x] Routes tRPC : transport.public.gallery, addGalleryImage, deleteGalleryImage, reviews, averageRating, createReview, directory
- [x] Dashboard : onglet QR Code avec génération QR + lien copiable par compagnie
- [x] Composant GalleryManager dans le dashboard (ajouter/supprimer images)
- [x] Page répertoire public /directory : liste compagnies par type avec logos, notes, galerie
- [x] Lien Répertoire dans le footer de NexusHome
- [x] Route /directory dans App.tsx
- [x] Stats CSN enrichies : commandes restaurant du jour + CA consolidé
- [x] Paiement mobile Wave/Orange Money/MTN/Moov : composant MobilePayment dans checkout restaurant
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Système de Crédits NEXUS v2.5
- [x] Schéma DB : table company_credits (companyId, balance, currency, countryCode, createdAt, updatedAt)
- [x] Schéma DB : table credit_transactions (companyId, type, amount, description, refType, refId, createdAt)
- [x] Migration DB
- [x] Helpers DB : getBalance, addCredits, debitCredit, getTransactions
- [x] Routes tRPC : credits.getBalance, credits.buyCredits, credits.getHistory
- [x] Débit automatique 1 point : billet vendu, réservation confirmée, commande restaurant, colis enregistré
- [x] Conversion 1 point = 125 FCFA en devise locale par pays
- [x] Page FACTURATION DES SERVICES NEXUS : solde, historique, achat de crédits (packs)
- [x] Bouton "CRÉDITS NEXUS" dans le menu onglets du dashboard (TransportDashboard)
- [x] Alerte solde faible (< 10 points) dans le dashboard
- [x] Extension pays africains subsahariens : 48 pays francophones + anglophones avec villes
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Améliorations v2.6 — Alerte solde, CSN crédits, Facture PDF
- [x] Alerte solde critique (< 5 points) : notifyOwner dans debitCredit côté serveur
- [x] Backend : helper getAllCreditsStats + route tRPC transport.csn.allCredits (enrichi)
- [x] Dashboard CSN : onglet "Crédits NEXUS" avec 4 KPIs + tableau compagnies (solde, achetés, dépensés, CA, dernière activité)
- [x] Facture HTML imprimable : bouton "Facture" sur chaque achat dans l'historique CreditsHub
- [x] Reçu : référence, date, points, montant en devise locale, contact NEXUS
- [x] TypeScript 0 erreur + 19 tests passants + checkpoint

## Améliorations v2.7 + Audit Complet
- [x] Avis clients dans le répertoire (/directory) : formulaire notation 1-5 étoiles + commentaire sur fiche compagnie
- [x] Rapport journalier automatique CSN : notifyOwner avec résumé ventes/commandes/crédits
- [x] Page légale /legal : conditions d'utilisation, politique crédits, mentions légales NEXUS
- [x] Lien /legal dans le footer
- [x] AUDIT : TypeScript 0 erreur
- [x] AUDIT : 19 tests Vitest passants
- [x] AUDIT : module Transport — routes tRPC OK, débit crédits OK, 0 erreur réseau
- [x] AUDIT : module Restaurant — commandes en ligne, statuts, impression ticket OK
- [x] AUDIT : module Crédits — solde, achat, débit auto, facture imprimable OK
- [x] AUDIT : module CSN — stats, compagnies, crédits, rapport journalier OK
- [x] AUDIT : Répertoire, QR Code, Galerie, About, Legal — routes et composants OK
- [x] AUDIT : génération tickets (printOrder) et factures (generateReceipt) vérifiée
- [x] Correction CSS @import Google Fonts déplacé dans index.html (plus d'avertissement PostCSS)
- [x] Aucune erreur tRPC dans les logs réseau (0 réponse 4xx/5xx)
- [x] Checkpoint final v2.7

## v3.0 — Nouvelles fonctionnalités majeures

### Gestion multi-utilisateurs par compagnie
- [ ] Table company_members (id, company_id, user_id, role: gérant/caissier/employé, pin_4digits, is_active, created_at)
- [ ] Table company_invitations (id, company_id, email, role, token, expires_at, accepted_at)
- [ ] Backend tRPC : inviter un membre, lister les membres, modifier le rôle, désactiver un compte
- [ ] Backend tRPC : vérifier le rôle dans les procédures sensibles (tarifs, paramètres)
- [ ] Frontend : onglet "Équipe" dans le dashboard compagnie (liste membres, inviter, désactiver)
- [ ] Frontend : accès restreint caissier (onglets visibles selon rôle)
- [ ] Frontend : connexion par PIN 4 chiffres pour les caissiers
- [ ] Middleware rôle : bloquer modification tarifs/paramètres si rôle = caissier

### Application mobile PWA
- [ ] Générer les icônes PWA (192x192, 512x512, maskable)
- [ ] Créer client/public/manifest.json avec nom, couleurs, icônes
- [ ] Créer client/public/sw.js (service worker : cache shell + assets)
- [ ] Enregistrer le service worker dans client/src/main.tsx
- [ ] Ajouter balises meta PWA dans client/index.html (theme-color, apple-touch-icon, etc.)
- [ ] Tester l'installation PWA sur mobile (bouton "Ajouter à l'écran d'accueil")

### Module de messagerie interne compagnie ↔ CSN
- [ ] Table internal_messages (id, company_id, sender_type: company/csn, sender_id, content, is_read, created_at)
- [ ] Backend tRPC : sendMessage, listMessages (par compagnie), markAsRead, getUnreadCount
- [ ] Frontend : onglet "Messages" dans le dashboard compagnie (fil de discussion)
- [ ] Frontend : onglet "Messages" dans le dashboard CSN (liste compagnies + fil de discussion)
- [ ] Badge compteur messages non lus dans les dashboards
- [ ] Polling 30s pour les nouveaux messages

## v3.0 — Nouvelles fonctionnalités

- [x] Gestion multi-utilisateurs : table company_members + schéma DB
- [x] Backend tRPC team router (addMember, updateMember, resetPin, deleteMember, verifyPin)
- [x] Interface TeamManager : liste membres, ajout caissier/employé, PIN, activation/désactivation
- [x] Onglet "Équipe" dans le dashboard compagnie (TransportDashboard)
- [x] Application mobile PWA : manifest.json avec icônes et shortcuts
- [x] Service worker sw.js (cache-first assets, offline fallback page)
- [x] 8 icônes PNG générées (72px → 512px) avec design NEXUS
- [x] Balises Apple/Android/OG dans index.html
- [x] Enregistrement service worker dans main.tsx
- [x] Table internal_messages dans le schéma DB
- [x] Backend messagerie : sendMessageAsCompany, sendMessageAsCsn, listMessages, markRead, unreadCount
- [x] Composant CompanyInbox : fil de discussion côté compagnie avec rafraîchissement auto
- [x] Composant CsnMessaging : inbox multi-compagnies côté admin NEXUS
- [x] Onglet "Messages CSN" dans le dashboard compagnie
- [x] Onglet "Messagerie" dans le dashboard CSN
- [x] Tests Vitest : 17 tests (PIN, rôles, messages, PWA manifest) — 36 tests total passent
- [x] 0 erreur TypeScript

## v3.1 — Bibliothèque, Footer & Galerie photos

- [x] Lien dashboard dans le footer sur le "2" de 2026
- [x] Table company_photos dans le schéma DB (companyId, url, caption, order)
- [x] Backend tRPC : uploadPhoto, listPhotos, deletePhoto (S3 + DB)
- [x] Outil d'ajout de photos avec légende dans le dashboard (onglet Galerie)
- [x] Page publique /bibliotheque : logos des compagnies actives
- [x] Page /bibliotheque/:companyId : galerie photos avec légendes
- [x] Lien "Bibliothèque" dans le header public (même ligne qu'Espace compagnies)

## v3.2 — Drag-and-drop, Bannière répertoire, Badge messages

- [x] Backend tRPC : photos.reorderPhotos (tableau d'IDs ordonnés → mise à jour sortOrder en DB)
- [x] Installer @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
- [x] PhotoGalleryManager : drag-and-drop avec @dnd-kit/sortable (SortableContext + DndContext)
- [x] Indicateur visuel de glissement (poignée, opacité, curseur grab)
- [x] Sauvegarde automatique de l'ordre après drop (mutation reorderPhotos)
- [x] Backend tRPC : photos.getFirstPhoto (companyId → première photo ou null)
- [x] Page /directory : bannière de la première photo sur chaque fiche compagnie
- [x] Badge rouge messages non lus dans la TabsList principale du dashboard compagnie
- [x] Badge rouge messages non lus dans la TabsList principale du dashboard CSN

## v3.3 — Lien footer "de" + Admins

- [x] Footer NexusHome : rendre le mot "de" de "Afrique de l'Ouest" cliquable vers le dashboard
- [x] SQL : UPDATE users SET role='admin' WHERE email='keuming@yahoo.fr'
- [x] SQL : UPDATE users SET role='admin' WHERE email='anicettefd.wayou@gmail.com'

## v3.4 — Push notifications, Carrousel accueil, Compression photos

- [x] Compression canvas côté client avant upload (max 1200px, qualité 0.82, JPEG)
- [x] Indicateur de taille avant/après compression dans PhotoGalleryManager
- [x] Limite 20 photos par compagnie avec message d'erreur clair
- [x] Section "Nos compagnies en images" sur la page d'accueil (carrousel auto-défilant)
- [x] Backend tRPC : photos.recentPublic (dernières N photos de compagnies actives)
- [x] Notifications push navigateur : demande de permission + affichage notification
- [x] Hook usePushNotifications : polling + Notification API (pas de VAPID serveur)
- [x] Badge sonore (beep) en complément de la notification visuelle

## v4.0 — Recrutement Commerciaux + Chatbot IA

- [x] Table commercial_candidates (nom, prénoms, contact, email, pays, ville, niveau_etude, langue, statut, createdAt)
- [x] Table chatbot_sessions (sessionId, visitorName, status: open/closed, createdAt)
- [x] Table chatbot_messages (sessionId, role: user/assistant/csn, content, createdAt)
- [x] Backend tRPC : recruitment.submit (public), recruitment.list (admin), recruitment.updateStatus
- [x] Backend tRPC : chatbot.startSession (public), chatbot.sendMessage (public + IA auto), chatbot.listSessions (admin), chatbot.replyAsCSN (admin), chatbot.markClosed (admin)
- [x] Bouton "Devenir commercial" sur la page d'accueil (section dédiée)
- [x] Formulaire de recrutement moderne (Dialog/Sheet) avec validation Zod
- [x] Widget chatbot flottant sur le frontend (coin bas-droit)
- [x] Réponse automatique IA (invokeLLM) + possibilité de prise en main CSN
- [x] Dashboard CSN : onglet "Recrutement" avec liste candidats + actions (mail/SMS/WhatsApp)
- [x] Dashboard CSN : onglet "Chatbot" avec sessions en cours et interface de réponse
- [x] Badge non-lus sur l'onglet Chatbot dans le dashboard CSN

## v4.1 — Connexion Admin Général (mot de passe)

- [x] Table admin_credentials (email, passwordHash, lastLogin, createdAt)
- [x] Migration DB (pnpm db:push)
- [x] Insérer les 2 profils admin avec mots de passe hashés (bcrypt)
- [x] Backend tRPC : adminLogin (email + password → JWT cookie admin)
- [x] Backend tRPC : adminLogout (effacer le cookie admin)
- [x] Backend tRPC : adminMe (vérifier le cookie admin)
- [x] Modal de connexion admin sur le clic du mot "de" dans le footer
- [x] Formulaire email + mot de passe avec validation
- [x] Redirection vers /csn-dashboard après connexion réussie
- [x] Séparation claire : connexion admin ≠ connexion compagnie (OAuth)

## v4.2 — Admin avancé, SEO, Rapport journalier, Carrousel

- [x] Backend : adminAuth.logout (effacer cookie admin)
- [x] Backend : adminAuth.listAdmins (liste des profils admin)
- [x] Backend : adminAuth.addAdmin (créer un profil admin)
- [x] Backend : adminAuth.toggleAdmin (activer/désactiver un profil)
- [x] Backend : adminAuth.deleteAdmin (supprimer un profil)
- [x] Backend : adminAuth.loginLogs (journal des 50 dernières connexions)
- [x] Backend : users.listAll (liste utilisateurs OAuth pour promotion)
- [x] Backend : users.promoteToAdmin / demoteFromAdmin
- [x] Dashboard CSN : bouton "Déconnexion" admin dans le header
- [x] Dashboard CSN : onglet "Accès Admin" (gestion des profils admin par mot de passe)
- [x] Dashboard CSN : onglet "Administrateurs" (promotion/rétrogradation utilisateurs OAuth)
- [x] Dashboard CSN : journal des connexions (email, date, heure)
- [x] SEO : hook usePageSEO (title + meta description dynamiques)
- [x] SEO : balises sur NexusHome (accueil), Bibliotheque, BibliothequeCompagnie, Directory
- [x] Rapport journalier : tâche cron 20h00 WAT → notification propriétaire
- [x] Rapport journalier : résumé ventes, nouvelles compagnies, messages non traités
- [x] Vérifier activation carrousel galerie sur la page d'accueil
- [x] Vérifier activation compression photos dans PhotoGalleryManager

## Correctif Carrousel Compagnies (v4.3)
- [x] Diagnostic : carrousel invisible car aucune compagnie avec statut "active" (seule compagnie est "pending")
- [x] Modifier photos.recentPublic pour inclure les compagnies "pending" en plus des "active"
- [x] Ajouter procédure photos.companiesForCarousel (retourne compagnies active+pending avec logo/description)
- [x] Réécrire CarrouselGalerie.tsx : fallback sur cartes compagnies si aucune photo disponible
- [x] Carrousel affiche maintenant les logos/initiales des compagnies avec fond sombre et badge "Partenaire NEXUS"
- [x] Skeleton de chargement animé pendant la requête
- [x] 3 nouveaux tests Vitest (photos.recentPublic, photos.companiesForCarousel, photos.getBannerPhotos)
- [x] 39 tests passants, 0 erreur TypeScript

## Correctif Chatbot Widget (v4.4)
- [x] Diagnostiquer le bug : champ de saisie disparaît après le 2ème message
- [x] Corriger le layout : hauteur fixe du widget, zone messages scrollable, champ de saisie toujours ancré en bas
- [x] Corriger le scroll automatique vers le dernier message
- [x] Tester avec plusieurs échanges consécutifs

## Refonte Dashboard CSN + Module Crédits (v4.5)
- [x] Analyser CsnDashboard.tsx existant
- [x] Schéma BDD : table credit_requests (companyId, amount, points, paymentMethod, paymentRef, status, validatedAt, creditedAt)
- [x] Migration BDD (pnpm db:push)
- [x] Backend : credit.requestCredit (compagnie soumet une demande)
- [x] Backend : credit.allRequests (CSN liste toutes les demandes avec filtre statut)
- [x] Backend : credit.confirmPayment (CSN valide manuellement)
- [x] Backend : credit.rejectRequest (CSN rejette avec motif)
- [x] Backend : credit.mobileMoneyWebhook (validation automatique dès paiement Mobile Money)
- [x] Refonte CsnDashboard.tsx : menu latéral gauche avec icônes et groupes
- [x] Sidebar réductible (mode compact avec icônes seules)
- [x] Section Crédits — Suivi : tableau des soldes par compagnie
- [x] Section Demandes de crédit : liste des demandes, filtres, actions Valider/Rejeter
- [x] Badge compteur demandes en attente dans la sidebar
- [x] Alertes rapides sur la Vue d'ensemble (compagnies en attente + demandes crédit)
- [x] Info webhook Mobile Money automatique dans le module crédits
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint et livraison

## v4.6 — Demandes crédit compagnie + CinetPay + Historique transactions

- [ ] Formulaire "Demander des crédits" dans le dashboard compagnie (onglet Crédits NEXUS)
- [ ] Sélecteur opérateur Mobile Money (Wave, Orange Money, MTN, Moov) + champ numéro de téléphone
- [ ] Affichage des demandes en cours dans le dashboard compagnie (statut, montant, date)
- [ ] Intégration CinetPay API : initiation de paiement + webhook de confirmation automatique
- [ ] Endpoint POST /api/cinetpay/webhook pour validation automatique dès paiement confirmé
- [ ] Fallback Wave API si CinetPay indisponible
- [ ] Historique détaillé des transactions par demande dans le module CSN
- [ ] Colonne "Voir transactions" dans le tableau des demandes CSN
- [ ] Panel latéral : liste des transactions liées à une demande (date, solde avant/après, type)
- [ ] Tests Vitest pour les nouvelles procédures
- [ ] Checkpoint et livraison

## v4.6 — Intégration Hub2 Mobile Money
- [ ] Rechercher et analyser l'API Hub2
- [ ] Annuler les changements CinetPay (supprimer cinetpay.ts, nettoyer index.ts)
- [ ] Créer le service Hub2 (initiation paiement, vérification, webhook)
- [ ] Ajouter getCreditRequestByHub2TxId dans transport-db.ts
- [ ] Route webhook Express /api/hub2/notify pour validation automatique
- [ ] Procédure tRPC : credit.initHub2Payment
- [ ] Formulaire de demande de crédit dans CreditsHub.tsx
- [ ] Affichage des demandes en cours dans CreditsHub.tsx
- [ ] Historique détaillé des transactions par demande dans CsnDashboard
- [ ] Tests Vitest pour le module Hub2
- [ ] Checkpoint et livraison

## v4.7 — Crédit manuel admin (29/03/2026)
- [x] Vérifier l'existant (dialog "Créditer manuellement" dans CreditRequestsPanel)
- [x] Procédure tRPC csn.adminCreditCompany : companyId, points, motif, référence paiement
- [x] Dialog de crédit manuel accessible depuis tableau Crédits-Suivi (bouton par ligne) + bouton global
- [x] Sélecteur de compagnie dans le dialog (si ouvert depuis le bouton global)
- [x] Champs : compagnie, nombre de points, motif (obligatoire), référence paiement (optionnel)
- [x] Message de succès avec détail (solde avant → après)
- [x] Affichage erreur si la procédure échoue
- [x] Invalidation du cache allCredits + allRequests après crédit
- [x] Bouton "Créditer" par ligne dans le tableau Crédits-Suivi
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint et livraison

## v4.8 — Sécurisation crédit manuel par PIN admin (29/03/2026)
- [x] Analyser le système d'auth existant (OAuth Manus, table users, sessions)
- [x] Ajouter colonnes confirmPinHash, confirmPinAttempts, confirmPinLockedUntil dans users
- [x] Migration BDD
- [x] Procédure tRPC csn.setConfirmPin : définir/changer son PIN (4-6 chiffres, hashé bcrypt)
- [x] Procédure tRPC csn.verifyConfirmPin : vérifier le PIN, verrouillage après 5 échecs
- [x] Procédure tRPC csn.hasPinDefined : vérifier si un PIN est défini
- [x] Modifier adminCreditCompany pour exiger confirmPin dans l'input
- [x] Dialog crédit manuel en 2 étapes : étape 1 infos, étape 2 saisie PIN
- [x] Masquer/afficher le PIN (toggle eye icon)
- [x] Feedback visuel : spinner pendant vérification, erreur si PIN incorrect
- [x] Verrouillage temporaire après 5 tentatives échouées
- [x] Panneau PinSetupCard dans la section Admins du dashboard CSN
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint et livraison

## v4.9 — Prise de relais humain dans le Chatbot IA (29/03/2026)
- [x] Analyser le module CsnChatbot et la table chatbot_sessions/messages
- [x] Ajouter champ humanTakeoverActive dans chatbot_sessions
- [x] Migration BDD
- [x] Procédure tRPC : chatbot.takeoverSession (admin prend le relais, suspend l'IA)
- [x] Procédure tRPC : chatbot.releaseSession (admin rend la main à l'IA)
- [x] Modifier chatbot.sendMessage pour ignorer l'IA si humanTakeoverActive = true
- [x] CsnChatbotPanel réécrit : bouton "Prendre le relais" / "Rendre à l'IA" dans l'en-tête
- [x] CsnChatbotPanel : champ de saisie admin toujours visible (replyAsCSN existant)
- [x] CsnChatbotPanel : badge "Agent humain actif" (bleu) vs "IA active" (vert)
- [x] CsnChatbotPanel : messages CSN distingués (fond bleu, icône casque)
- [x] CsnChatbotPanel : indicateur de mode dans la liste des sessions (icône UserCheck bleue)
- [x] Widget client : bandeau "Un agent NEXUS a pris le relais" quand hasCsnMessage
- [x] Widget client : header bascule vers "Agent NEXUS" / icône casque quand agent actif
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint et livraison

## v5.0 — Traduction multilingue FR/EN/ES (29/03/2026)
- [x] Analyser les pages publiques (NexusHome, ChatbotWidget, header, RegisterCompany, PublicHotel)
- [x] Créer client/src/lib/i18n.tsx : contexte LanguageContext + hook useI18n
- [x] Créer client/src/lib/translations.ts : dictionnaire complet FR/EN/ES (nav, activity, hero, carousel, search, booking, register, chatbot, footer, recruit)
- [x] Sélecteur de langue dans le header (drapeaux FR/EN/ES, persistance localStorage)
- [x] Appliquer traductions sur NexusHome.tsx (hero, recherche, onglets, résultats, footer, recrutement)
- [x] Appliquer traductions sur ChatbotWidget.tsx (messages, boutons, placeholders)
- [x] Appliquer traductions sur RegisterCompany.tsx (formulaire, labels, boutons, statuts)
- [x] Appliquer traductions sur CarrouselGalerie.tsx
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint et livraison

## v5.1 — Intervention admin dans les conversations chatbot (29/03/2026)
- [ ] Analyser l'état actuel du système chatbot (tables, routes tRPC, CsnChatbotPanel)
- [ ] Ajouter champs BDD : adminInterventionActive, adminMessages, escaladeReason dans chatbot_sessions
- [ ] Migration BDD (pnpm db:push)
- [ ] Procédure tRPC : chatbot.sendAdminMessage (sessionId, message, adminId)
- [ ] Procédure tRPC : chatbot.escalateToHuman (sessionId, reason, adminId)
- [ ] Procédure tRPC : chatbot.releaseToAI (sessionId, adminId)
- [ ] CsnChatbotPanel : bouton "Intervenir" pour chaque session active
- [ ] CsnChatbotPanel : champ de saisie admin pour envoyer des messages directs
- [ ] CsnChatbotPanel : badge "Agent humain actif" quand admin intervient
- [ ] CsnChatbotPanel : historique des interventions admin (timestamps, messages)
- [ ] ChatbotWidget : notification "Un agent NEXUS a pris le relais"
- [ ] ChatbotWidget : badge "Agent humain" dans le header de la conversation
- [ ] ChatbotWidget : messages admin distingués visuellement (fond bleu, icône casque)
- [ ] Tests Vitest pour les nouvelles procédures tRPC
- [ ] 0 erreur TypeScript
- [ ] Checkpoint et livraison

## v5.1 — Intervention admin dans les conversations (29/03/2026)
- [x] Ajouter champs BDD : adminInterventionActive, adminId, adminInterventionAt, adminInterventionReason
- [x] Créer procédures tRPC : sendAdminMessage, escalateToHuman, releaseFromAdmin
- [x] Améliorer CsnChatbotPanel : bouton Escalader, dialog escalade, badge admin intervient
- [x] Ajouter notifications ChatbotWidget : détection admin intervention, badge Admin CSN
- [x] 39 tests passants, 0 erreur TypeScript
- [x] Checkpoint v5.1

## v5.2 — Notifications en temps réel WebSocket/SSE (29/03/2026)
- [x] Installer ws (WebSocket) et configurer serveur WebSocket
- [x] Créer système de broadcast WebSocket pour notifications admin
- [x] Intégrer WebSocket au ChatbotWidget avec reconnexion automatique
- [x] Ajouter notifications visuelles et sonores
- [x] Tests Vitest (39 passants) et vérification TypeScript (0 erreurs)
- [x] Checkpoint v5.2

## v5.3 — Restauration dashboard CSN et statistiques agrégées (29/03/2026)
- [x] Restaurer le lien d'accès au dashboard CSN dans le header (bouton "CSN Dashboard")
- [x] Implémenter les statistiques agrégées (8 KPI : Compagnies, Billets, Expéditions, Commandes, Revenus)
- [x] Ajouter KPI Commandes et Revenu commandes au dashboard CSN
- [x] Tests Vitest (39 passants) et vérification TypeScript (0 erreurs)
- [x] Checkpoint v5.3

## v5.4 — Graphique de tendances et tableau détaillé des compagnies (29/03/2026)
- [x] Installer Recharts pour les graphiques
- [x] Créer procédure tRPC getTrendingData pour 30 jours
- [x] Implémenter graphique linéaire (billets + revenu)
- [x] Créer procédure tRPC getCompaniesDetailedStats
- [x] Implémenter tableau avec filtrage (statut) et tri (CA/billets/nom)
- [x] Tests Vitest (39 passants) et vérification TypeScript (0 erreurs)
- [x] Checkpoint v5.4

## v5.5 — Lien CSN Dashboard caché dans le footer (29/03/2026)
- [x] Retirer le bouton CSN Dashboard du header
- [x] Ajouter lien caché sur le mot "de" dans le footer ("Afrique de l'Ouest")
- [x] Tests Vitest (39 passants) et vérification TypeScript (0 erreurs)
- [x] Checkpoint v5.5

## v5.6 — Correction erreurs WebSocket (29/03/2026)
- [x] Analyser et corriger l'initialisation du serveur WebSocket (initWebSocket ajouté dans server/_core/index.ts)
- [x] Ajouter fallback gracieux si WebSocket indisponible (vérification WebSocket support)
- [x] Corriger le hook useWebSocket avec meilleure gestion d'erreurs (messages d'erreur détaillés, reconnexion automatique)
- [x] Tests Vitest (39 passants) et vérification TypeScript (0 erreurs)
- [x] Checkpoint v5.6

## v5.7 — Chat en temps réel admin-visiteur (29/03/2026)
- [ ] Analyser architecture et planifier système de chat
- [ ] Ajouter champs BDD pour messages de chat
- [ ] Créer procédures tRPC pour chat
- [ ] Implémenter broadcast WebSocket pour chat temps réel
- [ ] Interface de chat côté visiteur
- [ ] Interface de chat côté admin
- [ ] Tests Vitest et vérification TypeScript
- [ ] Checkpoint v5.7

## Chat en Temps Réel Admin-Visiteur (v5.7+)
- [x] Procédures tRPC pour le chat : sendChatMessage, getChatMessages, markMessagesAsRead
- [x] Mise à jour ChatbotWidget.tsx pour afficher le chat en temps réel
- [ ] Mise à jour CsnChatbotPanel.tsx pour le chat admin
- [x] Broadcasting WebSocket pour les messages de chat (méthode broadcastChatMessage ajoutée)
- [ ] Indicateurs de saisie et accusés de réception
- [ ] Tests Vitest pour les procédures de chat
- [ ] Checkpoint v5.7 : Chat en temps réel implémenté


## Module de Gestion Financière - Encaissement de Crédits (v5.8+)
- [x] Schéma BDD : table credit_purchases (companyId, amount, creditsGranted, paymentMethod, paymentStatus, stripePaymentId, hub2PaymentId, transactionDate)
- [x] Schéma BDD : table credit_transactions (companyId, creditAmount, type: "purchase"/"debit", reason, transactionDate)
- [x] Procédure tRPC : createCreditPurchase (companyId, amount, paymentMethod) → retourne paymentLink
- [x] Procédure tRPC : confirmCreditPayment (purchaseId, paymentId) → ajoute crédits au compte compagnie
- [x] Procédure tRPC : getCompanyCredits (companyId) → retourne solde crédit actuel
- [x] Procédure tRPC : getCreditPurchaseHistory (companyId) → historique des achats de crédits
- [x] Procédure tRPC : getAllCreditTransactions (admin) → toutes les transactions pour le dashboard CSN
- [x] Interface d'encaissement : modal avec sélection compagnie, montant, méthode de paiement (CreditPurchaseModal.tsx)
- [ ] Intégration Stripe : génération de lien de paiement pour carte bancaire
- [ ] Intégration Hub2 Mobile Money : génération de lien de paiement pour Mobile Money
- [x] Affichage solde en temps réel : widget dans dashboard CSN (CreditDashboard.tsx - vue admin)
- [x] Affichage solde en temps réel : widget dans dashboard compagnie (CreditDashboard.tsx - vue compagnie)
- [ ] Webhook Stripe : endpoint pour confirmer paiement et ajouter crédits
- [ ] Webhook Hub2 : endpoint pour confirmer paiement et ajouter crédits
- [x] Modal Support NEXUS : interface de chat avec le client depuis le chatbot (SupportCSNModal.tsx)
- [ ] Tests Vitest pour les procédures de gestion financière
- [ ] Checkpoint v5.8 : Module de gestion financière implémenté


## Intégration Support NEXUS au Chatbot (v5.9+)
- [x] Ajouter le bouton "Parler à un humain" dans ChatbotWidget.tsx
- [x] Intégrer SupportCSNModal dans ChatbotWidget.tsx
- [x] Afficher le bouton seulement quand une session est active
- [ ] Ajouter une notification quand l'admin prend le relais
- [ ] Tests Vitest pour le bouton et l'intégration
- [ ] Checkpoint v5.9 : Support NEXUS intégré au chatbot


## Intégration Module Financier au Dashboard CSN (v5.10+)
- [x] Créer la page CreditManagementPage.tsx pour afficher le CreditDashboard
- [x] Ajouter le lien "Crédits — Suivi" dans la navigation du DashboardLayout
- [x] Ajouter le lien "Demandes de crédit" pour voir les demandes en attente
- [x] Intégrer le CreditPurchaseModal dans la page de gestion des crédits
- [x] Afficher les statistiques en temps réel (total encaissé, crédits distribués, etc.)
- [ ] Tests Vitest pour la page de gestion financière
- [ ] Checkpoint v5.10 : Module financier intégré au dashboard CSN


## Dashboard Compagnie - Gestion des Crédits (v5.11+)
- [x] Créer la page CompanyCreditsPage.tsx pour afficher le solde et l'historique
- [x] Créer le composant CompanyCreditsWidget pour afficher le solde principal (intégré dans CompanyCreditsPage)
- [x] Ajouter le lien "Mes Crédits" dans la navigation du dashboard compagnie (onglet CRÉDITS NEXUS)
- [x] Afficher l'historique des achats avec statuts et dates
- [ ] Ajouter un graphique de tendance des crédits (optionnel)
- [ ] Intégrer le CreditDashboard en mode compagnie (isAdmin=false)
- [ ] Tests Vitest pour le dashboard compagnie
- [ ] Checkpoint v5.11 : Dashboard compagnie pour les crédits


## Réorganisation Dashboard Compagnie avec Menu Latéral (v5.12+)
- [x] Créer le composant CompanyDashboardLayout avec menu latéral gauche
- [x] Ajouter les icônes et les liens du menu latéral
- [x] Optimiser les requêtes tRPC avec staleTime et caching (trpc-config.ts créé)
- [x] Implémenter le lazy loading pour les onglets (useLazyTab hook créé)
- [x] Appliquer les configurations de cache aux requêtes TransportDashboard
- [x] Réduire les requêtes initiales au chargement (caching appliqué)
- [ ] Refactoriser TransportDashboard pour utiliser CompanyDashboardLayout (optionnel)
- [ ] Tests de performance et optimisation
- [ ] Checkpoint v5.13 : Optimisations de performance appliquées


## Correction - Espace de Saisie des Messages Admin (v5.14+)
- [x] Corriger CsnChatbotPanel pour afficher l'espace de saisie des messages (même si session fermée)
- [x] Ajouter la logique d'envoi des messages de l'admin (sendAdminMutation existante)
- [x] Afficher les messages de l'admin en temps réel dans le chatbot visiteur (via WebSocket)
- [ ] Tester la prise de relais admin
- [ ] Checkpoint v5.14 : Prise de relais admin fonctionnelle


## Tests et Améliorations - Prise de Relais Admin (v5.15+)
- [ ] Tester la prise de relais admin dans le navigateur
- [x] Ajouter un indicateur visuel "Support NEXUS" dans le chatbot visiteur (badge "Agent en ligne")
- [x] Implémenter les notifications toast pour l'admin (messages améliorés avec descriptions)
- [x] Implémenter les notifications toast pour le visiteur (via WebSocket onAdminIntervention)
- [ ] Vérifier que les messages s'affichent en temps réel
- [ ] Checkpoint v5.15 : Prise de relais admin avec indicateurs et notifications


## Mise à Jour Dashboard Compagnie - Crédits NEXUS (v5.16+)
- [x] Ajouter la section "Crédits NEXUS" au menu latéral du dashboard compagnie (déjà présente)
- [x] Créer une carte de solde de crédits en évidence (CompanyCreditsCard.tsx créé)
- [x] Ajouter un graphique d'historique des crédits (7 derniers jours avec LineChart)
- [x] Ajouter un bouton "Acheter des crédits" avec modal de sélection
- [x] Afficher les packages de crédits disponibles (via CreditPurchaseModal)
- [x] Afficher l'historique des achats de crédits avec statuts (tableau avec 5 derniers achats)
- [x] Intégrer les données de crédits au dashboard existant (TabsContent crédits mis à jour)
- [ ] Tests et vérification de l'intégration
- [ ] Checkpoint v5.16 : Dashboard compagnie mis à jour avec crédits NEXUS


## Correction - Intervention Admin et Menu Latéral Compagnie (v5.17+)
- [x] Ajouter le bouton "Intervenir en tant qu'admin" visible dans CsnChatbotPanel
- [x] Afficher l'espace de saisie des messages pour l'admin (déjà présent)
- [x] Intégrer le menu latéral gauche au dashboard compagnie (CompanyDashboardLayout)
- [x] Corriger les erreurs TypeScript et compiler
- [ ] Tester la prise de relais admin dans le chatbot CSN
- [ ] Tester le menu latéral du dashboard compagnie
- [ ] Checkpoint v5.17 : Intervention admin et menu latéral compagnie fonctionnels


## Ajout des Fonctionnalités Manquantes au Dashboard Compagnie (v5.18+)
- [ ] Analyser les codes sources fournis (Finance, Embarquement, Manifeste, etc.)
- [ ] Créer le module Finance avec gestion de caisse et PIN
- [ ] Créer le module Embarquement avec statuts en temps réel
- [ ] Créer le module Manifeste des passagers
- [ ] Créer le module Bagages Passager
- [ ] Créer le module Charges (dépenses)
- [ ] Créer le module Planning du personnel
- [ ] Créer le module Clients avec historique
- [ ] Créer le module Staff avec gestion des rôles
- [ ] Créer le module Configuration des stations et tarifs
- [ ] Intégrer tous les modules dans TransportDashboard
- [ ] Ajouter les routes dans App.tsx
- [ ] Tester l'intégration complète
- [ ] Checkpoint v5.18 : Toutes les fonctionnalités manquantes ajoutées


## Intégration Progressive des Modules Simplifiés (v5.20+)
- [x] Créer les procédures tRPC pour Finance (encaissement, décaissement, historique)
- [x] Créer le composant Finance simplifié
- [x] Créer les procédures tRPC pour Embarquement et Manifeste
- [x] Créer les composants Embarquement et Manifeste simplifiés
- [x] Intégrer les modules au TransportDashboard
- [x] Tester les modules avec Vitest
- [x] Checkpoint v5.20 : Modules Finance, Embarquement et Manifeste intégrés


## Amélioration des Modules de Gestion (v5.21+)
- [x] Ajouter la sélection de départ aux modules Embarquement et Manifeste
  - [x] Créer un sélecteur de départ dans EmbarquementModule
  - [x] Créer un sélecteur de départ dans ManifesteModule
  - [x] Mettre à jour les procédures tRPC pour accepter departureId
- [x] Implémenter l'export PDF professionnel
  - [x] Installer pdfkit ou jsPDF
  - [x] Créer un composant d'export PDF
  - [x] Ajouter le logo et les informations de l'entreprise
  - [x] Générer des manifestes PDF formatés
- [x] Ajouter les statistiques temps réel
  - [x] Implémenter le polling pour les mises à jour (refetchInterval)
  - [x] Afficher le nombre de passagers embarqués en direct
  - [x] Ajouter des indicateurs visuels (barres de progression)
- [x] Tester les nouvelles fonctionnalités
- [x] Checkpoint v5.21 : Modules améliorés avec sélection, PDF et temps réel


## Carrousel Transport/Restauration/Expédition (v5.22+)
- [x] Créer le composant ActivityCarousel identique au carrousel de recrutement
- [x] Intégrer le carrousel dans la page de réservation (NexusHome.tsx)
- [x] Ajouter les traductions pour les textes du carrousel
- [x] Tester le carrousel sur mobile et desktop
- [x] Checkpoint v5.22 : Carrousel Transport/Restauration/Expédition ajouté


## Correction et Améliorations (v5.23+)
- [x] Vérifier pourquoi les onglets Manifeste et autres mises à jour ne s'affichent pas (ils sont bien définis)
- [x] Ajouter des animations Framer Motion au carrousel (transitions entre sections)
- [x] Récupérer les partenaires dynamiques depuis la base de données
- [x] Implémenter les CTA contextuels (scroller vers formulaires)
- [x] Corriger l'erreur 'Cannot read properties of undefined'
- [x] Déplacer le carrousel au-dessus de l'espace de réservation
- [x] Tester toutes les corrections et améliorations
- [x] Checkpoint v5.23 : Corrections et améliorations appliquées


## Améliorations Avancées du Carrousel (v5.24+)
- [x] Créer un formulaire de contact modal pour demander un devis
  - [x] Créer le composant QuoteRequestModal
  - [x] Ajouter les champs : nom, email, téléphone, type de service, message
  - [x] Intégrer le formulaire au carrousel
  - [x] Créer la procédure tRPC pour envoyer la demande
- [x] Implémenter les statistiques temps réel
  - [x] Ajouter les compteurs : trajets actifs, restaurants ouverts, colis en transit
  - [x] Créer les procédures tRPC pour récupérer les statistiques
  - [x] Mettre à jour les cartes de statistiques avec les données dynamiques
- [x] Ajouter le système de filtrage des partenaires
  - [x] Créer un composant de filtres (note, prix, distance)
  - [x] Implémenter la logique de filtrage côté client
  - [x] Ajouter les contrôles de filtrage au carrousel
- [x] Tester toutes les nouvelles fonctionnalités
- [x] Checkpoint v5.24 : Améliorations avancées du carrousel


## Barre de Recherche Globale et Système de Favoris (v5.26+)
- [ ] Créer les procédures tRPC pour la recherche globale (trajets, restaurants, colis)
- [ ] Créer les procédures tRPC pour les favoris (ajouter, supprimer, lister)
- [ ] Créer le composant GlobalSearchBar pour le header
- [ ] Implémenter le système de favoris avec icône cœur
- [ ] Intégrer la barre de recherche dans le header
- [ ] Créer une page de favoris pour afficher les éléments sauvegardés
- [ ] Tester toutes les fonctionnalités
- [ ] Checkpoint v5.26 : Barre de recherche et système de favoris implémentés


## Audit et Améliorations UX - Sélection Pays/Ville
- [ ] Auditer tous les endroits avec sélection pays/ville
- [ ] Créer composant SearchableSelect réutilisable
- [ ] Remplacer tous les Select pays/ville par SearchableSelect
- [ ] Ajouter champ de recherche pour filtrer par 1ère/2ème lettre

## Authentification Client et Dashboard
- [ ] Créer table clients avec champs (email, password, nom, prénom, téléphone, pays, ville)
- [ ] Implémenter signup/login pour clients
- [ ] Créer dashboard client pour suivi des réservations
- [ ] Ajouter boutons "S'inscrire" et "Se connecter" à la barre de menu
- [ ] Créer procédures tRPC pour client auth (signup, login, logout)
- [ ] Ajouter tests Vitest pour authentification client


## Chatbot et Gestion Clients
- [x] Ajouter champ de saisie admin dans le chatbot AI
- [x] Créer bouton CLIENTS dans le sidebar gauche
- [ ] Créer page ClientsManagement pour afficher les clients avec détails
- [ ] Créer dashboard client avec authentification
- [ ] Ajouter boutons signup/login à la barre de menu
- [ ] Tester le flux complet d'authentification et réservations


## Encaissement et Gestion Financière
- [ ] Créer la table cashier_transactions pour gérer les encaissements
- [ ] Créer les procédures tRPC pour l'encaissement (createTransaction, listTransactions)
- [ ] Créer le composant CashierModule pour l'interface d'encaissement
- [ ] Ajouter le bouton ENCAISSER dans la page Finance
- [ ] Implémenter la génération de billets après encaissement
- [ ] Ajouter la sécurité par code PIN pour l'accès à la caisse
- [ ] Tester le flux complet d'encaissement

## Bouton ENCAISSER + Génération Tickets + Départs NexusHome
- [x] Composant CashierEncaisserModule.tsx : bouton ENCAISSER prominent dans FinanceModule
- [x] Sélection type de transaction (billet, expédition, service, autre)
- [x] Sélection moyen de paiement (espèces, carte, mobile money, chèque, virement)
- [x] Génération automatique du numéro de reçu (RCP-TIMESTAMP-RANDOM)
- [x] Composant TicketPrintModal.tsx : modal d'impression de billet style TGV
- [x] QR code intégré dans le billet (qrcode.react installé)
- [x] Bouton "Imprimer" dans la liste des billets (TransportDashboard)
- [x] Section "Prochains départs disponibles" dans NexusHome (TodayDepartures)
- [x] Grille de cartes départs avec logo compagnie, trajet, prix, places disponibles
- [x] Badge "Aujourd'hui" sur les départs du jour
- [x] Rafraîchissement automatique toutes les 2 minutes
- [x] Bouton "Réserver" directement depuis la section départs
- [x] 9 nouveaux tests Vitest (71 tests au total, tous passants)
- [x] Checkpoint sauvegardé

## Ajout types Hôtels et Boutiques dans les compagnies
- [x] Mettre à jour l'enum activityType dans drizzle/schema.ts (ajouter "hotel" et "boutique")
- [x] Migration BDD (pnpm db:push)
- [x] Mettre à jour les routers backend (transport.ts, carousel.ts, transport-db.ts)
- [x] Mettre à jour RegisterCompany.tsx (icônes Hotel + ShoppingBag, grille 5 colonnes)
- [x] Mettre à jour ActivityCarousel.tsx (slides Hôtellerie et Boutiques avec partenaires)
- [x] Mettre à jour CompanyQRCode.tsx (labels hotel/boutique)
- [x] Mettre à jour QuoteRequestModal.tsx (enum hotel/boutique)
- [x] Mettre à jour NexusHome.tsx (onglets + HotelPanel + BoutiquePanel)
- [x] 71 tests Vitest passants
- [x] Checkpoint sauvegardé

## CTA Carousel : Créer compte compagnie + Postuler maintenant
- [x] ActivityCarousel : remplacer "Demander un devis" par "Créer un compte compagnie" (lien vers /transport/register)
- [x] ActivityCarousel : icône Building2 + navigation directe vers RegisterCompany
- [x] Section recrutement : bouton "Postuler maintenant" (déjà configuré via i18n key "apply")
- [x] 71 tests Vitest passants
- [x] Checkpoint sauvegardé

## RegisterCompany : formulaire toujours visible + bouton SE CONNECTER
- [ ] Supprimer la redirection automatique vers le dashboard dans RegisterCompany.tsx
- [ ] Ajouter un bouton "SE CONNECTER" pour les utilisateurs qui ont déjà un compte
- [ ] Renommer "companiesSpace" en "Espace Partenaires" dans la navbar NexusHome

## Corrections urgentes (01/04/2026)
- [x] Alias /transport/register → /register-company dans App.tsx
- [x] Renommer companiesSpace en "Accès Compagnie" avec traductions multilingues (fr/en/es)
- [x] Corriger erreur WebSocket ChatbotWidget (ne pas connecter si sessionToken vide)

## Corrections et nouvelles activités (01/04/2026)
- [x] Correction nom "CSN" → "NEXUS" dans tout le projet
- [x] Ajout type "agence_voyage" dans le schéma DB et le routeur
- [x] Ajout "Agence Voyage" dans le formulaire RegisterCompany (6 types)
- [x] Variables isHotel, isBoutique, isAgenceVoyage dans TransportDashboard
- [x] Onglets spécifiques Hôtel (Chambres, Réservations, Services)
- [x] Onglets spécifiques Boutique (Catalogue, Ventes/Caisse, Stock)
- [x] Onglets spécifiques Agence Voyage (Vols, Billets avion, Forfaits)
- [x] Stats overview adaptées par type d'activité (Hôtel, Boutique, Agence)
- [x] Quick actions adaptées par type d'activité
- [x] Icône header dynamique selon type d'activité
- [x] Module Services hôteliers (Restauration, Pressing, Piscine, Room Service, Spa, Transport, Conférence, Parking)
- [ ] Connecter les stats réelles pour Hôtel/Boutique/Agence via tRPC
- [ ] Formulaires de saisie pour Hôtel (check-in/check-out, réservation)
- [ ] Formulaires de saisie pour Boutique (ticket de caisse, produit)
- [ ] Formulaires de saisie pour Agence Voyage (billet avion, forfait)

## Audit Complet & Production (01/04/2026)
- [x] Audit TypeScript complet : 0 erreur
- [x] Tests Vitest : 71 tests passants (7 fichiers)
- [x] Vérification appels tRPC frontend/backend : cohérence totale
- [x] Vérification logs réseau : 0 erreur HTTP 4xx/5xx
- [x] Build de production : succès (3714 modules transformés)
- [x] Module Lignes retiré du menu Admin CSN
- [x] Module Lignes ajouté dans le dashboard Transport (onglet Lignes)
- [x] Actions CRUD dans Gestion des Compagnies Admin CSN (Valider, Modifier, Suspendre, Supprimer)
- [x] Bouton Valider pour activer les comptes compagnies en attente
- [x] Filtres dans la liste des compagnies (type, statut, date, recherche)
- [x] Accès conditionnel au dashboard (pending/suspended/rejected avec messages explicatifs)
- [x] Sous-titres dynamiques par type d'activité dans le header
- [x] Formulaire d'inscription enrichi avec champs spécifiques par type d'activité
- [x] Dashboard Agence de Voyage (onglets Vols, Billets, Forfaits)
- [x] Checkpoint production sauvegardé

## Formulaire Candidature Business Développeur

- [x] Ajouter upload CV + lettre de motivation (S3) dans le formulaire existant
- [x] Ajouter champs enrichis : expérience commerciale, secteur ciblé, motivation
- [x] Configurer notification email vers recrutement@nexus.africa (notifyOwner)
- [x] Créer page dédiée /careers/apply
- [x] Lier le bouton "Postuler maintenant" du carousel à /careers/apply

## Indexation SEO

- [x] Corriger BASE_URL dans useSEO.ts (nexus.manus.space → www.nexus.africa)
- [x] Créer robots.txt avec sitemap URL
- [x] Créer route serveur /sitemap.xml dynamique (toutes les pages publiques)
- [x] Ajouter données structurées Schema.org (Organization + WebSite + Service) dans index.html
- [x] Mettre à jour og:url et og:image dans index.html avec le vrai domaine
- [x] Ajouter useSEO dans About, CareersApply, RegisterCompany, Legal
- [x] robots.txt avec Disallow sur toutes les pages privées

## Pages de destination SEO par service

- [x] Créer page /transport-abidjan (Transport interurbain Côte d'Ivoire)
- [x] Créer page /hotels-abidjan (Hôtels et hébergements Abidjan)
- [x] Créer page /agences-voyage-abidjan (Agences de voyage Abidjan)
- [x] Créer page /boutiques-abidjan (Boutiques et restaurants en ligne Abidjan)
- [x] Ajouter les 4 routes dans App.tsx
- [x] Mettre à jour sitemap.xml avec les 4 nouvelles URLs (11 URLs au total)
- [x] Liens internes croisés entre toutes les pages SEO (footer navigation)

## Chatbot mobile/PWA

- [x] Corriger l'affichage du chatbot sur mobile/PWA : fenêtre plein écran sur mobile, safe-area iOS, z-index 9999, font-size 16px pour éviter zoom iOS, scroll natif touch

## Module Business Développeur (BDev)

- [x] Créer table `business_developers` dans drizzle/schema.ts (id, bdId 7 chars, nom, prénoms, contact, email, whatsapp, login, indicatif, phone, pinHash, statut, createdAt)
- [x] Ajouter champ `bdId` (nullable) dans table `transport_companies`
- [x] Migrer le schéma DB (`pnpm db:push`) — succès
- [x] Créer server/routers/businessDev.ts (register, login PIN, getMyCompanies, getStats, admin: list, getGlobalStats, updateStatus)
- [x] Créer page publique /bdev/register (formulaire création compte BDev avec génération ID automatique)
- [x] Créer page publique /bdev/login (connexion PIN)
- [x] Créer page /bdev/dashboard (liste compagnies, CA, crédits par période)
- [x] Ajouter onglet "Business Développeurs" dans CsnDashboard + composant BDevManagementPanel
- [x] Ajouter champ "ID Business Développeur" dans formulaire RegisterCompany
- [x] Ajouter routes /bdev/* dans App.tsx
- [x] 0 erreur TypeScript, 71 tests passants

## Commission Business Développeur

- [x] Ajouter champ `commissionRate` (défaut 5.00%) dans table `business_developers`
- [x] Migrer le schéma DB (`pnpm db:push`) — succès
- [x] Mettre à jour routeur tRPC : calcul commission = CA × commissionRate
- [x] Procédure admin : updateCommissionRate (modifier le taux par BDev)
- [x] Dashboard BDev : carte verte "Commission à percevoir" avec taux et montant total
- [x] Panel admin CSN : total commissions à verser, taux moyen, édition inline du taux par BDev
- [x] 0 erreur TypeScript, 71 tests passants

## Lien Espace BDev dans le header

- [x] Ajouter boutons "Espace BDev" (Se connecter) et "Devenir BDev" (Créer compte) dans le carousel Recrutement en cours de NexusHome
- [x] Bouton "Espace BDev" → /bdev/login, bouton "Devenir BDev" → /bdev/register
- [x] Design cohrent : fond blanc/10, bordure blanche, responsive mobile

## Document Conditions d'Utilisation et Rémunération BDev

- [x] Créer document Markdown complet : CONDITIONS_UTILISATION_NEXUS.md (220 lignes, 7 sections)
- [x] Intégrer les informations essentielles dans le SYSTEM_PROMPT du chatbot
- [x] Chatbot enrichi avec tarifs, frais, commissions, processus d'inscription
- [x] 0 erreur TypeScript, 71 tests passants

- [x] Mettre à jour le SYSTEM_PROMPT du chatbot avec le processus d'obtention et de partage de l'ID BDev


## Chatbot PWA — Problème d'accessibilité (RÉSOLU)

- [x] Diagnostiquer : ChatbotWidget était monté uniquement dans NexusHome, pas visible sur autres pages
- [x] Corriger : ChatbotWidget monté globalement dans App.tsx, visible sur toutes les pages
- [x] Corriger le Service Worker (sw.js) : exclure les requetes WebSocket de l'interception
- [x] Corriger le hook useWebSocket : ne pas tenter de connexion si sessionToken est vide
- [x] Chatbot maintenant accessible sur PWA smartphone sur toutes les routes
- [x] 0 erreur TypeScript, 71 tests passants
- [x] Chatbot visible avec bouton flottant orange "Need help?" sur toutes les pages
- [x] WebSocket fonctionne correctement sans erreurs repetees


## Conditions Générales — Page Publique et Dashboard BDev (RÉSOLU)

- [x] Créer page publique /conditions avec les conditions générales complètes (HTML riche)
- [x] Ajouter lien "Conditions Générales" dans le footer pointant vers /conditions
- [x] Ajouter route /conditions dans App.tsx
- [x] Ajouter section "Conditions Générales" dans le dashboard BDev avec tarifs et commissions
- [x] Afficher les conditions avec les tarifs, frais, commissions, processus d'inscription
- [x] Bouton "Voir les Conditions Complètes" dans le dashboard BDev pointant vers /conditions
- [ ] Tester sur desktop et mobile
- [ ] 0 erreur TypeScript, 71 tests passants
- [ ] Checkpoint et livraison


## Problème de Connexion Dashboard — Rôle Admin Manquant

- [ ] Vérifier le compte keumingo@gmail.com dans la base de données
- [ ] Définir le rôle à `admin` pour keumingo@gmail.com
- [ ] Tester l'accès au dashboard principal
- [ ] Vérifier que le message "Accès réservé à l'Administrateur" disparaît
- [ ] Checkpoint et livraison


## Dashboard Hôtellerie — Modification des Boutons

- [ ] Supprimer les boutons : Départ, Expédition, Flotte
- [ ] Remplacer "Billetterie" par "Reçu de paiement"
- [ ] Tester les modifications sur desktop et mobile
- [ ] Checkpoint et livraison


## Dashboards Spécifiques par Type d'Activité

### Dashboard Transport (✅ Déjà bon)
- [x] Accueil, Départs, Billetterie, Réservations, Expéditions, Flotte, Finance, QR Code, Crédits, Équipe, Messages, Galerie

### Dashboard Hotel (RESOLU)
- [x] Creer HotelDashboardLayout.tsx avec les sections : Accueil, Reservations, Clients, Chambres, Services, Recu de paiement, Finance, Equipe, Messages, Galerie
- [x] Implementer les KPIs hoteliers : Taux d'occupation, RevPAR, ADR, CA Total
- [x] Creer HotelDashboard.tsx pour gerer les sections
- [x] Ajouter la section "Recu de paiement" pour les factures
- [x] 71 tests passants

### Dashboard Restauration (RESOLU)
- [x] Creer RestaurantDashboardLayout.tsx avec les sections : Accueil, Commandes, Tables, Menu, Recu de paiement, Finance, Equipe, Messages, Galerie
- [x] Implementer les KPIs restauration : Commandes, CA, Clients, Temps moyen
- [x] Creer RestaurantDashboard.tsx pour gerer les sections
- [x] Ajouter la section "Recu de paiement" pour les factures
- [x] 71 tests passants

### Logique de Selection (RESOLU)
- [x] Creer CompanyDashboard.tsx wrapper pour selectionner le bon dashboard selon activityType
- [x] Ajouter le champ activityType a getAllCompanies() dans transport-db.ts
- [x] Tester la selection automatique selon le type d'activite
- [x] Corriger les caracteres speciaux dans NexusHome.tsx


## Contrat Business Développeur — Recrutement (RESOLU)

- [x] Créer le contrat professionnel Business Développeur en Markdown
- [x] Définir clairement le statut Free-Lance initial
- [x] Mettre à jour les critères CDI : cumul de 100 points (coeff 10 pour transport)
- [x] Détailler les commissions et rémunération
- [x] Convertir le contrat en PDF
- [x] Uploader le PDF sur CDN (v2)
- [x] Mettre à jour le lien du PDF dans le dashboard BDev
- [x] 71 tests passants
- [ ] Créer un badge moderne orange/noir pour les BDev

## Mise à Jour Contrat v2 (RESOLU)

- [x] Remplacer les critères CDI par cumul de 100 points
- [x] Ajouter coefficient 10 pour compagnies de transport (10 compagnies = 100 points)
- [x] Ajouter tous les types d'activité : hôtel, restaurant, transport, gaz, expédition
- [x] Augmenter prime recrutement transport : 250 000 FCFA (vs 25 000 pour autres)
- [x] Ajouter exemples de calcul avec transport
- [x] Convertir en PDF (v2)
- [x] Uploader sur CDN (v2)
- [x] Mettre à jour lien dashboard BDev
- [x] 71 tests passants


## Badge Personnalisé avec ID BDev — RESOLU

- [x] Créer un composant React BDevBadgeGenerator pour générer le badge avec l'ID BDev
- [x] Ajouter le composant dans le dashboard BDev
- [x] Afficher l'ID BDev sur le badge (ex: BD65350)
- [x] Génération dynamique du badge avec Canvas API
- [x] Bouton Télécharger mon Badge Personnalisé pour télécharger en PNG
- [x] Design : dégradé orange gauche, noir droit, ligne diagonale orange
- [x] Badge circulaire BD en haut à gauche
- [x] Texte NEXUS BUSINESS DEVELOPER en blanc
- [x] ID BDev affiché en gris sur le badge
- [x] 71 tests passants

## Lien de Parrainage Personnalisé BDev — RESOLU

- [x] Ajouter le champ referrerBdevId dans la table businessDevelopers
- [x] Créer un composant BDevReferralLink avec affichage du lien unique
- [x] Ajouter bouton "Copier" pour copier le lien de parrainage
- [x] Ajouter boutons de partage WhatsApp et LinkedIn
- [x] Intégrer le composant dans le dashboard BDev
- [x] Ajouter la logique d'extraction du paramètre ?bdev=BD-XXXXX dans RegisterCompany
- [x] Pré-remplir le champ bdId lors de l'inscription via le lien de parrainage
- [x] Migration de base de données appliquée avec succès
- [x] 71 tests passants


## Argumentaire de Prospection BDev — RESOLU

- [x] Créer argumentaire complet pour Transport (augmentation CA, réduction coûts, cas d'usage, tarifs)
- [x] Créer argumentaire complet pour Restaurants (visibilité, réservations, panier moyen, avis)
- [x] Créer argumentaire complet pour Hôtels (taux occupation, revenue management, avis, tarifs)
- [x] Créer argumentaire complet pour Expédition (nouveaux clients, optimisation tournées, satisfaction)
- [x] Ajouter stratégie de prospection générale (5 étapes de vente, avantages compétitifs)
- [x] Ajouter ressources pour BDev (lien parrainage, badge, contrat, support)
- [x] Convertir en PDF professionnel (419 KB)
- [x] Uploader sur CDN
- [x] Ajouter bouton de téléchargement dans le dashboard BDev
- [x] 71 tests passants, 0 erreurs TypeScript

## Correction Carrousel de Compagnies — RESOLU
- [x] Identifier le problème : carrousel en bas au lieu d'en haut
- [x] Analyser la structure de NexusHome.tsx et PublicHome.tsx
- [x] Corriger la procédure companiesForCarousel pour retourner TOUTES les compagnies
- [x] Modifier CarrouselGalerie pour afficher les compagnies EN PRIORITÉ
- [x] Placer le carrousel EN HAUT de la page (avant ActivityCarousel)
- [x] Vérifier que les 7 compagnies s'affichent correctement
- [x] Tests : 76 tests passants

## Audit Complet de la Base de Données — RESOLU
- [x] Vérifier la connexion à TiDB Cloud
- [x] Vérifier les 50+ tables et schémas
- [x] Vérifier les procédures tRPC pour les compagnies
- [x] Vérifier les procédures tRPC pour les commerciaux
- [x] Vérifier la communication Dashboard ↔ Base de données
- [x] Vérifier la communication Site Public ↔ Base de données
- [x] Vérifier les enregistrements de compagnies et commerciaux
- [x] Générer un rapport d'audit complet (AUDIT_DATABASE.md)
- [x] Aucun problème critique détecté

## Nettoyage et Préparation Publication — RESOLU
- [x] Supprimer les fichiers temporaires d'audit
- [x] Supprimer le fichier audit.test.ts (erreur d'importation)
- [x] Exécuter tous les tests (76 tests passants)
- [x] Vérifier le serveur (running)
- [x] Mettre à jour todo.md avec les tâches complétées
- [x] Créer checkpoint pour publication

## Upload d'image pour la galerie publique (Remplacer logo par photo)
- [x] Ajouter champ d'upload d'image au formulaire "Modifier la compagnie"
- [x] Afficher aperçu de l'image sélectionnée avant enregistrement
- [x] Implémenter logique d'upload vers S3
- [x] Mettre à jour la base de données avec l'URL de l'image
- [x] Afficher l'image dans la galerie publique au lieu du fond noir + initiale
- [x] Tester le formulaire et vérifier l'affichage dans la galerie

## Gestion de photos lors de la création de compagnie
- [x] Ajouter une section de gestion de photos au formulaire "Ajouter une compagnie"
- [x] Permettre l'upload de plusieurs photos avec aperçu
- [x] Sélectionner la photo de couverture (celle affichée dans la galerie)
- [x] Uploader toutes les photos vers S3 lors de la création
- [x] Sauvegarder la photo de couverture comme galleryImageUrl
- [x] Tester le formulaire et vérifier l'affichage dans la galerie

## Galerie multi-photos pour chaque compagnie
- [ ] Analyser et planifier le schéma de base de données pour les photos multiples
- [x] Créer un composant GalleryManager pour gérer les photos (upload, légendes, réorganisation)
- [x] Implémenter les routes tRPC pour gérer les photos (créer, mettre à jour, supprimer)
- [x] Créer un composant GalleryCarousel pour afficher les photos sur la page détail de la compagnie
- [x] Tester la galerie multi-photos et vérifier l'affichage

## Correction bug bandes noires dans la galerie CarrouselGalerie
- [x] Diagnostic : les bandes noires sont intégrées dans l'image source (60px noir en haut et en bas d'une image 640x480)
- [x] Solution : utiliser img tag avec object-fit:cover + transform:scale(1.35) pour zoomer et couper les bandes
- [x] Technique padding-bottom:100% pour forcer le ratio carré au lieu de aspect-square
- [x] Overlay hover avec z-index pour rester au-dessus de l'image zoomée
- [x] Vérification visuelle sur le serveur de dev : bandes noires éliminées

## Suppression bordure orange de la carte avec image
- [x] Supprimer border-2 border-[#E8751A] du conteneur de l'image dans CarrouselGalerie

## Correction affichage noms compagnies + filtrage par catégorie
- [x] Corriger l'affichage des noms de compagnies sur les cartes (noms invisibles actuellement)
- [x] Ajouter des onglets de filtrage par catégorie (TOUS + Transport, Restauration, Hôtel, etc.)
- [x] Ranger les compagnies par catégorie dans la galerie

## Bug: Ajout restaurant remplace un restaurant existant
- [x] Investiguer et corriger le bug où l'ajout d'un nouveau restaurant écrase/remplace un restaurant existant

## Retirer badge PARTENAIRE NEXUS des cartes galerie
- [x] Supprimer le texte "PARTENAIRE NEXUS" en orange des cartes avec image et sans image dans CarrouselGalerie

## Changer la police de la galerie
- [x] Changer la police d'écriture des textes de la galerie pour une police plus moderne et adaptée (Poppins)

## Augmenter la taille de police sur mobile
- [x] Augmenter la taille de la police des noms de compagnies sur mobile pour meilleure lisibilité

## Optimisation Open Graph pour réseaux sociaux
- [x] Créer une page de partage par compagnie (/share/company/:id) avec Open Graph meta tags
- [x] Ajouter meta tags dynamiques (og:image, og:title, og:description) pour chaque compagnie
- [x] Ajouter boutons de partage dans la galerie

## Déplacement bouton Partager
- [x] Retirer le bouton Partager des cartes de la galerie CarrouselGalerie
- [x] Ajouter le bouton Partager à la page de détail CompanyDetail

## Bug: Erreur 404 lors de l'accès au dashboard CSN
- [ ] Vérifier que le compte admin a le rôle 'admin' dans la base de données
- [ ] Corriger le système d'authentification/autorisation pour le dashboard CSN

## Ajouter lien CSN dashboard dans le footer
- [x] Ajouter un lien vers /csn-dashboard sous le mot "de" du texte "Afrique de l'ouest" dans le footer


## Module Commande & Livraison Bouteilles de Gaz
- [ ] Schéma BDD : tables gas_bottles, gas_suppliers, gas_orders, gas_order_items, gas_deliveries
- [ ] Migration BDD (pnpm db:push)
- [ ] Backend helpers gas-db.ts : CRUD bouteilles, commandes, livraisons
- [ ] Routes tRPC publiques : liste bouteilles, recherche fournisseurs, créer commande
- [ ] Routes tRPC fournisseur : CRUD bouteilles, gestion prix, tableau de bord commandes
- [ ] Routes tRPC admin : gestion fournisseurs, tarifs livraison (B6: 200 FCFA, B12: 300 FCFA)
- [ ] Page GasOrderPage.tsx : interface PWA moderne pour commander bouteilles
- [ ] Page GasSupplierDashboard.tsx : dashboard fournisseur gestion bouteilles et prix
- [ ] Composant GasBottleCard : affichage bouteille avec prix et options
- [ ] Composant GasOrderForm : formulaire commande avec adresse livraison
- [ ] Composant GasDeliveryTracking : suivi livraison en temps réel
- [ ] Tests vitest pour module gazOrder
- [ ] Checkpoint final module gazOrder


## Module Commande & Livraison de Gaz

- [x] Schéma BDD gazOrder (5 tables: gas_suppliers, gas_bottles, gas_orders, gas_order_items, gas_deliveries)
- [x] Migration BDD (pnpm db:push)
- [x] Helpers backend gas-db.ts avec 20+ fonctions (create, get, update, stats)
- [x] Routeur tRPC gasRouter avec procédures complètes (suppliers, bottles, orders, stats)
- [x] Page de commande PWA moderne (/gas-order) avec interface client
- [x] Dashboard fournisseur (/gas-supplier-dashboard) avec gestion bouteilles et commandes
- [x] Tests vitest pour gazOrder (gas.test.ts)
- [x] Frais de livraison: 200 FCFA (B6), 300 FCFA (B12)
- [x] Gestion du stock avec alerte stock faible
- [x] Statuts de commande: pending, confirmed, in_delivery, delivered, cancelled
- [x] Statistiques fournisseur: total commandes, revenu, taux de conversion
- [x] Intégration routes App.tsx (/gas-order, /gas-supplier-dashboard)
- [x] 0 erreur TypeScript, build stable

## Réorganisation Carousel de Réservation

- [x] Ajouter bouton "Commande de Gaz" à ActivityCarousel
- [x] Importer icône Fuel de lucide-react
- [x] Ajouter élément gaz avec stats (B6 & B12, livraison rapide, tarifs compétitifs)
- [x] Réorganiser NexusHome: ActivityCarousel juste après le menu
- [x] Déplacer galerie après ActivityCarousel
- [x] Bannière publicitaire reste sous la galerie
- [x] 0 erreur TypeScript, build stable


## Audit et Correction Module Gaz

- [x] Auditer la base de données gazOrder et corriger les erreurs
- [x] Nettoyer les données de test (supprimer les 2 compagnies test)
- [x] Intégrer ZAZA DEPOT comme fournisseur principal
- [x] Créer page d'accueil gaz moderne avec localisation géographique
- [x] Implémenter galerie de fournisseurs proches (1km rayon)
- [x] Créer parcours de commande fluide avec panier
- [x] Ajouter lien gaz sur page d'accueil principale (nexus.africa)
- [x] Affichage des compagnies (fournisseurs) avec bouteilles disponibles
- [x] Intégration géolocalisation client
- [ ] Sélection mode de paiement dans le parcours
- [ ] Validation complète du parcours de commande


## Parcours de Commande/Réservation Galerie

- [x] Créer modal CompanyBookingModal avec 5 étapes
- [x] Étape 1: Sélection du service (transport, restauration, hôtel, expédition, gaz)
- [x] Étape 2: Sélection compagnie (affichage filtré par type)
- [x] Étape 3: Détails client (prénom, nom, téléphone, email, adresse)
- [x] Étape 4: Sélection mode de paiement (espèces, mobile money, carte, virement)
- [x] Étape 5: Confirmation avec numéro de réservation
- [x] Intégrer modal dans CarrouselGalerie
- [x] Remplacer Link par button pour ouvrir le modal au clic
- [x] Progress indicator avec 5 étapes
- [x] Validation des champs obligatoires
- [x] Résumé de la réservation avant paiement
- [x] Prix gaz corrects: B6 2300 FCFA, B12 5500 FCFA (sans frais)
- [x] Suppression B20 de la liste
- [x] Affichage des compagnies filtrées par type
- [x] 0 erreur TypeScript, build stable


## Système Complet de Gestion des Commandes de Gaz (Flux en Cascade)

### Phase 1: Mise à jour BDD
- [ ] Ajouter table `gas_deliverymen` (livreurs)
- [ ] Ajouter colonne `deliverymanId` à `gas_orders`
- [ ] Ajouter colonne `selectedSupplierId` à `gas_orders` (fournisseur choisi par livreur)
- [ ] Ajouter statuts: pending → assigned_to_deliveryman → validated_by_deliveryman → delivered
- [ ] Ajouter table `gas_order_notifications` pour tracker les notifications

### Phase 2: Helpers Backend
- [ ] Créer helpers pour les livreurs (CRUD, recherche par localisation)
- [ ] Créer helpers pour notifier tous les fournisseurs d'une nouvelle commande
- [ ] Créer helpers pour notifier tous les livreurs d'une nouvelle commande
- [ ] Créer helpers pour assigner une commande à un livreur
- [ ] Créer helpers pour valider une commande (livreur sélectionne fournisseur)
- [ ] Créer helpers pour confirmer la livraison

### Phase 1: Schéma BDD et Helpers Backend
- [x] Tables BDD: gas_deliverymen, gas_order_notifications
- [x] Colonnes gas_orders: deliverymanId, selectedSupplierId, status
- [x] Helpers backend: gas-deliverymen-db.ts (20+ fonctions)
- [x] Audit BDD: suppression compagnies test, intégration ZAZA DEPOT

### Phase 2: Procédures tRPC
- [x] Routeur deliverymen: getById, getByUserId, listActive, listByLocation
- [x] Routeur notifications: getUnreadForSupplier, getUnreadForDeliveryman, markAsRead
- [x] Routeur workflow: getAssignedToDeliveryman, getPendingForSupplier, assignToDeliveryman, validateByDeliveryman, confirmDelivery
- [x] Intégration dans gas.ts avec 3 routers

### Phase 3: Dashboard Livreur PWA
- [x] Page DeliverymanDashboard.tsx avec 3 sections
- [x] Afficher les commandes assignées au livreur
- [x] Détails client, adresse, montant total
- [x] Sélection fournisseur et validation commande
- [x] Confirmation livraison avec statut
- [x] Onglet notifications non lues
- [x] Route /gas-deliveryman-dashboard

### Phase 4: Notifications Temps Réel
- [x] Hook useRealtimeNotifications avec polling 5s
- [x] Notifications non lues pour livreurs
- [x] Notifications non lues pour fournisseurs
- [x] Marquage notifications comme lues

### Phase 5: Dashboard Fournisseur PWA
- [ ] Afficher les commandes pending (en attente d'acceptation)
- [ ] Afficher les commandes assigned (assignées à un livreur)
- [ ] Bouton pour accepter/refuser une commande
- [ ] Affichage du livreur assigné et du client
- [ ] Historique des commandes livrées
- [ ] Statistiques: total commandes, revenu, taux d'acceptation

### Phase 6: Dashboard Client
- [ ] Afficher l'historique des commandes
- [ ] Afficher le statut en temps réel (pending, assigned, validated, delivered)
- [ ] Afficher le livreur assigné et le fournisseur sélectionné
- [ ] Notification quand la commande est livrée

### Phase 7: Tests Vitest
- [ ] Tester la création de commande et notification des fournisseurs
- [ ] Tester la notification des livreurs
- [ ] Tester l'assignation d'une commande au livreur
- [ ] Tester la validation par le livreur
- [ ] Tester la confirmation de livraison

### Phase 8: Optimisations
- [ ] Remplacer polling par WebSocket pour notifications temps réel
- [ ] Ajouter SMS/Email notifications
- [ ] Tester flux complet sur mobile PWA
- [ ] Valider statuts de commande en cascade

## Phase Finale: Intégration Flux Réel

- [x] Déplacer carousel de réservation en haut de la page (gradient orange)
- [x] Connecter procédure create à notifySuppliersByBottleType
- [x] Connecter procédure create à notifyAllDeliverymen
- [ ] Ajouter SMS/Email notifications automatiques
- [ ] Créer système de notation client
- [ ] Tester flux complet end-to-end


## Implémentation WebSockets pour Notifications Temps Réel

- [ ] Créer serveur WebSocket avec ws ou socket.io
- [ ] Implémenter hook useWebSocketNotifications côté client
- [ ] Mettre à jour DeliverymanDashboard pour utiliser WebSocket
- [ ] Mettre à jour GasSupplierDashboardV2 pour utiliser WebSocket
- [ ] Ajouter reconnexion automatique en cas de déconnexion
- [ ] Ajouter gestion des erreurs WebSocket
- [ ] Tester notifications en temps réel sans délai
- [ ] Valider sur mobile PWA


## Corrections Urgentes - Commande de Gaz

- [x] Corriger l'erreur WebSocket en redémarrant le serveur
- [x] Ajouter le composant Toaster de Sonner à App.tsx pour afficher les toasts
- [x] Corriger la fonction notifySuppliersByBottleType dans gas-deliverymen-db.ts (syntaxe Drizzle ORM incorrecte)
- [x] Ajouter l'import de gasSuppliers dans gas-deliverymen-db.ts
- [x] Tester le flux complet de commande de gaz (sélection fournisseur → ajout au panier → remplissage formulaire → confirmation)
- [x] Écrire et exécuter les tests vitest pour valider le flux de commande
- [x] Bouton "Ajouter au Panier" : fonctionne correctement avec feedback visuel (toast)
- [x] Bouton "Confirmer la Commande" : fonctionne correctement et déclenche la mutation
- [x] Modal de succès : affiche le message personnalisé avec numéro de commande et montant total
- [ ] Mettre à jour les prix des bouteilles :
  - B6 : 2500 FCFA (2200 fournisseur + 200 livreur + 100 NEXUS)
  - B12 : 5800 FCFA (5500 fournisseur + 200 livreur + 100 NEXUS)
  - B25 : à définir


## Audit Complet et Corrections - Administration Générale

### Phase 1 : Implémentation des procédures tRPC
- [ ] Créer procédures tRPC pour Expédition (seedTestExpeditions)
- [ ] Créer procédures tRPC pour Hôtel (seedTestHotels)
- [ ] Créer procédures tRPC pour Boutique (seedTestProducts)
- [ ] Créer procédures tRPC pour Agence de Voyage
- [ ] Créer procédures tRPC pour Résidence Meublée
- [ ] Créer procédures tRPC pour Loisirs
- [ ] Créer procédures tRPC pour Location & Vente

### Phase 2 : Correction des dysfonctionnements Restaurant
- [ ] Vérifier que le bouton "Créer le menu de test" fonctionne
- [ ] Tester la création de catégories
- [ ] Tester la création de plats
- [ ] Tester la création de zones de livraison
- [ ] Vérifier l'affichage du menu dans NexusHome après création

### Phase 3 : Correction des dysfonctionnements Hôtel
- [ ] Corriger le bouton "Réserver une chambre" (non fonctionnel)
- [ ] Implémenter le formulaire de réservation
- [ ] Tester le flux complet de réservation

### Phase 4 : Correction des dysfonctionnements Expédition
- [ ] Ajouter des compagnies d'expédition de test
- [ ] Afficher les compagnies sur la page Expédition
- [ ] Implémenter le formulaire d'expédition

### Phase 5 : Correction des dysfonctionnements Transport
- [ ] Ajouter des départs de test
- [ ] Afficher les départs sur la page Transport
- [ ] Tester la recherche de trajets

### Phase 6-10 : Tests des flux complets
- [ ] Tester flux complet Restaurant (sélection → menu → panier → commande → paiement → confirmation)
- [ ] Tester flux complet Hôtel (sélection → chambres → réservation → paiement → confirmation)
- [ ] Tester flux complet Expédition (sélection → tarifs → formulaire → paiement → confirmation)
- [ ] Tester flux complet Transport (recherche → sélection → réservation → paiement → confirmation)
- [ ] Valider flux complet Gaz (déjà testé avec succès)

### Phase 11 : Finalisation
- [ ] Mettre à jour todo.md avec tous les éléments complétés
- [ ] Créer checkpoint final
- [ ] Livrer la plateforme complète au client


## AUDIT COMPLET DES FLUX DE COMMANDE/RÉSERVATION

### Résultats de l'Audit
- [x] Audit Transport - "Aucun départ disponible" identifié
- [x] Audit Restaurant - "Carte non disponible" identifié
- [x] Audit Hôtel - Bouton non fonctionnel identifié
- [x] Audit Expédition - "Partners coming soon" identifié
- [x] Audit Gaz - ✅ Fonctionnel validé
- [x] Page AdminGeneral.tsx créée avec 8 onglets

### Corrections à Implémenter - Transport (CRITIQUE)
- [ ] Vérifier la structure des tables (transport_departures, busLines, trips)
- [ ] Corriger la requête de recherche avec les bonnes jointures
- [ ] Tester la recherche avec les départs créés (5 départs insérés)
- [ ] Implémenter le flux complet de réservation
- [ ] Ajouter les validations et confirmations

### Corrections à Implémenter - Restaurant (CRITIQUE)
- [ ] Créer des menus de test pour Bushman Café via menu.seedTestMenus
- [ ] Implémenter le formulaire de commande
- [ ] Ajouter le panier
- [ ] Implémenter le paiement
- [ ] Ajouter les notifications au restaurant

### Corrections à Implémenter - Hôtel (HAUTE)
- [ ] Corriger le gestionnaire du bouton "Réserver une chambre"
- [ ] Créer le modal de réservation
- [ ] Créer les chambres de test
- [ ] Implémenter le flux complet
- [ ] Ajouter les confirmations

### Corrections à Implémenter - Expédition (HAUTE)
- [ ] Créer les compagnies d'expédition de test
- [ ] Implémenter le formulaire de commande
- [ ] Ajouter le calcul des tarifs
- [ ] Implémenter le flux complet
- [ ] Ajouter le suivi

### Page d'Administration Générale
- [x] Créer la page AdminGeneral.tsx
- [x] Ajouter l'onglet Restaurant avec bouton "Créer le menu de test"
- [ ] Implémenter les procédures tRPC pour tous les onglets
- [ ] Ajouter les onglets Expédition, Hôtel, Boutique
- [ ] Ajouter les onglets Agence, Résidence, Loisirs, Location

### Tests de Validation
- [ ] Tester le flux complet Transport
- [ ] Tester le flux complet Restaurant
- [ ] Tester le flux complet Hôtel
- [ ] Tester le flux complet Expédition
- [ ] Écrire les tests vitest pour chaque flux


## AUDIT COMPLET DES FLUX - RÉSULTATS ET SOLUTIONS

### Flux Validés ✅
- [x] Gaz - Flux complet fonctionnel (sélection → offres → panier → commande → confirmation)

### Dysfonctionnements Critiques Identifiés 🔴
- [ ] Transport - "Aucun départ disponible" (cause: compagnies inexistantes, solution: créer trips valides)
- [ ] Restaurant - "Carte non disponible" (cause: pas de menu, solution: utiliser AdminGeneral)
- [ ] Hôtel - Bouton non fonctionnel (cause: gestionnaire manquant, solution: implémenter modal)
- [ ] Expédition - "Partners coming soon" (cause: pas de compagnies, solution: créer données test)

### Outils Créés 🛠️
- [x] Page AdminGeneral.tsx avec 8 onglets de configuration
- [x] Bouton CONFIGURATION ajouté au Dashboard Admin
- [x] Bouton CONFIGURATION ajouté au CSN Dashboard
- [x] Procédure tRPC menu.seedTestMenus pour créer menus automatiquement
- [x] Rapport d'audit complet avec solutions recommandées (/home/ubuntu/AUDIT_FINAL_SOLUTIONS.md)

### Plan d'Action Recommandé 📋
**Phase 1 (Jour 1) - Corrections Critiques:**
- [ ] Transport: Créer trips valides pour MATS TRANSPORT (210001) et UTB (210002)
- [ ] Restaurant: Utiliser AdminGeneral pour créer menus de test
- [ ] Hôtel: Implémenter bouton et modal de réservation

**Phase 2 (Jour 2) - Corrections Importantes:**
- [ ] Expédition: Créer compagnies de test et tarifs
- [ ] Boutique: Vérifier structure et créer produits de test
- [ ] Tests: Valider les 5 flux principaux

**Phase 3 (Semaine 1) - Modules Complets:**
- [ ] Agence de Voyage: Implémenter module complet
- [ ] Résidence Meublée: Implémenter module complet
- [ ] Loisirs: Implémenter module complet
- [ ] Location & Vente: Implémenter module complet
