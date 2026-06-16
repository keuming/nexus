// Pays et villes d'Afrique subsaharienne — francophones et anglophones
export interface Country {
  id: number;
  name: string;
  code: string;
  currency: string;
  flag: string;
}
export interface City {
  id: number;
  countryId: number;
  name: string;
}

export const COUNTRIES: Country[] = [
  // ── Afrique de l'Ouest francophone ──────────────────────────────────────────
  { id: 1,  name: "Côte d'Ivoire",       code: "CI", currency: "XOF", flag: "🇨🇮" },
  { id: 2,  name: "Sénégal",             code: "SN", currency: "XOF", flag: "🇸🇳" },
  { id: 3,  name: "Mali",                code: "ML", currency: "XOF", flag: "🇲🇱" },
  { id: 4,  name: "Burkina Faso",        code: "BF", currency: "XOF", flag: "🇧🇫" },
  { id: 5,  name: "Guinée Conakry",      code: "GN", currency: "GNF", flag: "🇬🇳" },
  { id: 6,  name: "Guinée-Bissau",       code: "GW", currency: "XOF", flag: "🇬🇼" },
  { id: 7,  name: "Togo",                code: "TG", currency: "XOF", flag: "🇹🇬" },
  { id: 8,  name: "Bénin",               code: "BJ", currency: "XOF", flag: "🇧🇯" },
  { id: 9,  name: "Niger",               code: "NE", currency: "XOF", flag: "🇳🇪" },
  { id: 10, name: "Mauritanie",          code: "MR", currency: "MRU", flag: "🇲🇷" },
  // ── Afrique de l'Ouest anglophone ───────────────────────────────────────────
  { id: 11, name: "Nigeria",             code: "NG", currency: "NGN", flag: "🇳🇬" },
  { id: 12, name: "Ghana",               code: "GH", currency: "GHS", flag: "🇬🇭" },
  { id: 13, name: "Sierra Leone",        code: "SL", currency: "SLL", flag: "🇸🇱" },
  { id: 14, name: "Libéria",             code: "LR", currency: "LRD", flag: "🇱🇷" },
  { id: 15, name: "Gambie",              code: "GM", currency: "GMD", flag: "🇬🇲" },
  // ── Afrique centrale francophone ────────────────────────────────────────────
  { id: 16, name: "Cameroun",            code: "CM", currency: "XAF", flag: "🇨🇲" },
  { id: 17, name: "Gabon",               code: "GA", currency: "XAF", flag: "🇬🇦" },
  { id: 18, name: "Congo-Brazzaville",   code: "CG", currency: "XAF", flag: "🇨🇬" },
  { id: 19, name: "RD Congo",            code: "CD", currency: "CDF", flag: "🇨🇩" },
  { id: 20, name: "Centrafrique",        code: "CF", currency: "XAF", flag: "🇨🇫" },
  { id: 21, name: "Tchad",               code: "TD", currency: "XAF", flag: "🇹🇩" },
  { id: 22, name: "Guinée équatoriale",  code: "GQ", currency: "XAF", flag: "🇬🇶" },
  { id: 23, name: "São Tomé-et-Príncipe",code: "ST", currency: "STN", flag: "🇸🇹" },
  // ── Afrique centrale anglophone ─────────────────────────────────────────────
  { id: 24, name: "Soudan du Sud",       code: "SS", currency: "SSP", flag: "🇸🇸" },
  // ── Afrique de l'Est francophone ────────────────────────────────────────────
  { id: 25, name: "Madagascar",          code: "MG", currency: "MGA", flag: "🇲🇬" },
  { id: 26, name: "Comores",             code: "KM", currency: "KMF", flag: "🇰🇲" },
  { id: 27, name: "Djibouti",            code: "DJ", currency: "DJF", flag: "🇩🇯" },
  { id: 28, name: "Burundi",             code: "BI", currency: "BIF", flag: "🇧🇮" },
  { id: 29, name: "Rwanda",              code: "RW", currency: "RWF", flag: "🇷🇼" },
  // ── Afrique de l'Est anglophone ─────────────────────────────────────────────
  { id: 30, name: "Kenya",               code: "KE", currency: "KES", flag: "🇰🇪" },
  { id: 31, name: "Tanzanie",            code: "TZ", currency: "TZS", flag: "🇹🇿" },
  { id: 32, name: "Ouganda",             code: "UG", currency: "UGX", flag: "🇺🇬" },
  { id: 33, name: "Éthiopie",            code: "ET", currency: "ETB", flag: "🇪🇹" },
  { id: 34, name: "Somalie",             code: "SO", currency: "SOS", flag: "🇸🇴" },
  { id: 35, name: "Érythrée",            code: "ER", currency: "ERN", flag: "🇪🇷" },
  { id: 36, name: "Zambie",              code: "ZM", currency: "ZMW", flag: "🇿🇲" },
  { id: 37, name: "Malawi",              code: "MW", currency: "MWK", flag: "🇲🇼" },
  { id: 38, name: "Zimbabwe",            code: "ZW", currency: "USD", flag: "🇿🇼" },
  { id: 39, name: "Mozambique",          code: "MZ", currency: "MZN", flag: "🇲🇿" },
  { id: 40, name: "Maurice",             code: "MU", currency: "MUR", flag: "🇲🇺" },
  { id: 41, name: "Seychelles",          code: "SC", currency: "SCR", flag: "🇸🇨" },
  // ── Afrique australe ────────────────────────────────────────────────────────
  { id: 42, name: "Afrique du Sud",      code: "ZA", currency: "ZAR", flag: "🇿🇦" },
  { id: 43, name: "Angola",              code: "AO", currency: "AOA", flag: "🇦🇴" },
  { id: 44, name: "Namibie",             code: "NA", currency: "NAD", flag: "🇳🇦" },
  { id: 45, name: "Botswana",            code: "BW", currency: "BWP", flag: "🇧🇼" },
  { id: 46, name: "Lesotho",             code: "LS", currency: "LSL", flag: "🇱🇸" },
  { id: 47, name: "Eswatini",            code: "SZ", currency: "SZL", flag: "🇸🇿" },
  { id: 48, name: "Cap-Vert",            code: "CV", currency: "CVE", flag: "🇨🇻" },
];

export const CITIES: City[] = [
  // ── Côte d'Ivoire (1) ───────────────────────────────────────────────────────
  { id: 101, countryId: 1, name: "Abidjan" },
  { id: 102, countryId: 1, name: "Bouaké" },
  { id: 103, countryId: 1, name: "Daloa" },
  { id: 104, countryId: 1, name: "Yamoussoukro" },
  { id: 105, countryId: 1, name: "San-Pédro" },
  { id: 106, countryId: 1, name: "Korhogo" },
  { id: 107, countryId: 1, name: "Man" },
  { id: 108, countryId: 1, name: "Gagnoa" },
  { id: 109, countryId: 1, name: "Abengourou" },
  { id: 110, countryId: 1, name: "Divo" },
  { id: 111, countryId: 1, name: "Bondoukou" },
  { id: 112, countryId: 1, name: "Odienné" },
  { id: 113, countryId: 1, name: "Soubré" },
  { id: 114, countryId: 1, name: "Issia" },
  { id: 115, countryId: 1, name: "Duekoué" },
  { id: 116, countryId: 1, name: "Guiglo" },
  { id: 117, countryId: 1, name: "Bouna" },
  { id: 118, countryId: 1, name: "Sassandra" },
  { id: 119, countryId: 1, name: "Agboville" },
  { id: 120, countryId: 1, name: "Adzopé" },
  // ── Sénégal (2) ─────────────────────────────────────────────────────────────
  { id: 201, countryId: 2, name: "Dakar" },
  { id: 202, countryId: 2, name: "Thiès" },
  { id: 203, countryId: 2, name: "Kaolack" },
  { id: 204, countryId: 2, name: "Saint-Louis" },
  { id: 205, countryId: 2, name: "Ziguinchor" },
  { id: 206, countryId: 2, name: "Diourbel" },
  { id: 207, countryId: 2, name: "Tambacounda" },
  { id: 208, countryId: 2, name: "Kolda" },
  { id: 209, countryId: 2, name: "Mbour" },
  { id: 210, countryId: 2, name: "Louga" },
  { id: 211, countryId: 2, name: "Touba" },
  { id: 212, countryId: 2, name: "Fatick" },
  // ── Mali (3) ────────────────────────────────────────────────────────────────
  { id: 301, countryId: 3, name: "Bamako" },
  { id: 302, countryId: 3, name: "Sikasso" },
  { id: 303, countryId: 3, name: "Mopti" },
  { id: 304, countryId: 3, name: "Ségou" },
  { id: 305, countryId: 3, name: "Kayes" },
  { id: 306, countryId: 3, name: "Koutiala" },
  { id: 307, countryId: 3, name: "Gao" },
  { id: 308, countryId: 3, name: "Tombouctou" },
  { id: 309, countryId: 3, name: "Kidal" },
  { id: 310, countryId: 3, name: "San" },
  // ── Burkina Faso (4) ────────────────────────────────────────────────────────
  { id: 401, countryId: 4, name: "Ouagadougou" },
  { id: 402, countryId: 4, name: "Bobo-Dioulasso" },
  { id: 403, countryId: 4, name: "Koudougou" },
  { id: 404, countryId: 4, name: "Banfora" },
  { id: 405, countryId: 4, name: "Ouahigouya" },
  { id: 406, countryId: 4, name: "Kaya" },
  { id: 407, countryId: 4, name: "Tenkodogo" },
  { id: 408, countryId: 4, name: "Fada N'Gourma" },
  { id: 409, countryId: 4, name: "Dédougou" },
  { id: 410, countryId: 4, name: "Dori" },
  // ── Guinée Conakry (5) ──────────────────────────────────────────────────────
  { id: 501, countryId: 5, name: "Conakry" },
  { id: 502, countryId: 5, name: "Nzérékoré" },
  { id: 503, countryId: 5, name: "Kankan" },
  { id: 504, countryId: 5, name: "Kindia" },
  { id: 505, countryId: 5, name: "Labé" },
  { id: 506, countryId: 5, name: "Mamou" },
  { id: 507, countryId: 5, name: "Boké" },
  { id: 508, countryId: 5, name: "Faranah" },
  { id: 509, countryId: 5, name: "Guéckédou" },
  { id: 510, countryId: 5, name: "Kissidougou" },
  // ── Guinée-Bissau (6) ───────────────────────────────────────────────────────
  { id: 601, countryId: 6, name: "Bissau" },
  { id: 602, countryId: 6, name: "Bafatá" },
  { id: 603, countryId: 6, name: "Gabú" },
  { id: 604, countryId: 6, name: "Cacheu" },
  { id: 605, countryId: 6, name: "Bolama" },
  // ── Togo (7) ────────────────────────────────────────────────────────────────
  { id: 701, countryId: 7, name: "Lomé" },
  { id: 702, countryId: 7, name: "Sokodé" },
  { id: 703, countryId: 7, name: "Kara" },
  { id: 704, countryId: 7, name: "Atakpamé" },
  { id: 705, countryId: 7, name: "Dapaong" },
  { id: 706, countryId: 7, name: "Tsévié" },
  { id: 707, countryId: 7, name: "Aného" },
  { id: 708, countryId: 7, name: "Bassar" },
  { id: 709, countryId: 7, name: "Notsé" },
  // ── Bénin (8) ───────────────────────────────────────────────────────────────
  { id: 801, countryId: 8, name: "Cotonou" },
  { id: 802, countryId: 8, name: "Porto-Novo" },
  { id: 803, countryId: 8, name: "Parakou" },
  { id: 804, countryId: 8, name: "Abomey-Calavi" },
  { id: 805, countryId: 8, name: "Bohicon" },
  { id: 806, countryId: 8, name: "Natitingou" },
  { id: 807, countryId: 8, name: "Djougou" },
  { id: 808, countryId: 8, name: "Kandi" },
  { id: 809, countryId: 8, name: "Abomey" },
  { id: 810, countryId: 8, name: "Ouidah" },
  // ── Niger (9) ───────────────────────────────────────────────────────────────
  { id: 901, countryId: 9, name: "Niamey" },
  { id: 902, countryId: 9, name: "Zinder" },
  { id: 903, countryId: 9, name: "Maradi" },
  { id: 904, countryId: 9, name: "Agadez" },
  { id: 905, countryId: 9, name: "Tahoua" },
  { id: 906, countryId: 9, name: "Dosso" },
  { id: 907, countryId: 9, name: "Diffa" },
  { id: 908, countryId: 9, name: "Tillabéri" },
  // ── Mauritanie (10) ─────────────────────────────────────────────────────────
  { id: 1001, countryId: 10, name: "Nouakchott" },
  { id: 1002, countryId: 10, name: "Nouadhibou" },
  { id: 1003, countryId: 10, name: "Rosso" },
  { id: 1004, countryId: 10, name: "Kaédi" },
  { id: 1005, countryId: 10, name: "Zouerate" },
  { id: 1006, countryId: 10, name: "Atar" },
  // ── Nigeria (11) ────────────────────────────────────────────────────────────
  { id: 1101, countryId: 11, name: "Lagos" },
  { id: 1102, countryId: 11, name: "Abuja" },
  { id: 1103, countryId: 11, name: "Kano" },
  { id: 1104, countryId: 11, name: "Ibadan" },
  { id: 1105, countryId: 11, name: "Port Harcourt" },
  { id: 1106, countryId: 11, name: "Benin City" },
  { id: 1107, countryId: 11, name: "Enugu" },
  { id: 1108, countryId: 11, name: "Kaduna" },
  { id: 1109, countryId: 11, name: "Maiduguri" },
  { id: 1110, countryId: 11, name: "Zaria" },
  { id: 1111, countryId: 11, name: "Aba" },
  { id: 1112, countryId: 11, name: "Onitsha" },
  { id: 1113, countryId: 11, name: "Warri" },
  { id: 1114, countryId: 11, name: "Sokoto" },
  { id: 1115, countryId: 11, name: "Ilorin" },
  // ── Ghana (12) ──────────────────────────────────────────────────────────────
  { id: 1201, countryId: 12, name: "Accra" },
  { id: 1202, countryId: 12, name: "Kumasi" },
  { id: 1203, countryId: 12, name: "Tamale" },
  { id: 1204, countryId: 12, name: "Takoradi" },
  { id: 1205, countryId: 12, name: "Cape Coast" },
  { id: 1206, countryId: 12, name: "Sunyani" },
  { id: 1207, countryId: 12, name: "Bolgatanga" },
  { id: 1208, countryId: 12, name: "Wa" },
  { id: 1209, countryId: 12, name: "Ho" },
  { id: 1210, countryId: 12, name: "Koforidua" },
  // ── Sierra Leone (13) ───────────────────────────────────────────────────────
  { id: 1301, countryId: 13, name: "Freetown" },
  { id: 1302, countryId: 13, name: "Bo" },
  { id: 1303, countryId: 13, name: "Kenema" },
  { id: 1304, countryId: 13, name: "Makeni" },
  { id: 1305, countryId: 13, name: "Koidu" },
  // ── Libéria (14) ────────────────────────────────────────────────────────────
  { id: 1401, countryId: 14, name: "Monrovia" },
  { id: 1402, countryId: 14, name: "Gbarnga" },
  { id: 1403, countryId: 14, name: "Buchanan" },
  { id: 1404, countryId: 14, name: "Voinjama" },
  { id: 1405, countryId: 14, name: "Harper" },
  // ── Gambie (15) ─────────────────────────────────────────────────────────────
  { id: 1501, countryId: 15, name: "Banjul" },
  { id: 1502, countryId: 15, name: "Serekunda" },
  { id: 1503, countryId: 15, name: "Brikama" },
  { id: 1504, countryId: 15, name: "Farafenni" },
  // ── Cameroun (16) ───────────────────────────────────────────────────────────
  { id: 1601, countryId: 16, name: "Yaoundé" },
  { id: 1602, countryId: 16, name: "Douala" },
  { id: 1603, countryId: 16, name: "Garoua" },
  { id: 1604, countryId: 16, name: "Bamenda" },
  { id: 1605, countryId: 16, name: "Maroua" },
  { id: 1606, countryId: 16, name: "Bafoussam" },
  { id: 1607, countryId: 16, name: "Ngaoundéré" },
  { id: 1608, countryId: 16, name: "Bertoua" },
  { id: 1609, countryId: 16, name: "Ebolowa" },
  { id: 1610, countryId: 16, name: "Kribi" },
  // ── Gabon (17) ──────────────────────────────────────────────────────────────
  { id: 1701, countryId: 17, name: "Libreville" },
  { id: 1702, countryId: 17, name: "Port-Gentil" },
  { id: 1703, countryId: 17, name: "Franceville" },
  { id: 1704, countryId: 17, name: "Oyem" },
  { id: 1705, countryId: 17, name: "Moanda" },
  { id: 1706, countryId: 17, name: "Lambaréné" },
  // ── Congo-Brazzaville (18) ──────────────────────────────────────────────────
  { id: 1801, countryId: 18, name: "Brazzaville" },
  { id: 1802, countryId: 18, name: "Pointe-Noire" },
  { id: 1803, countryId: 18, name: "Dolisie" },
  { id: 1804, countryId: 18, name: "Nkayi" },
  { id: 1805, countryId: 18, name: "Impfondo" },
  { id: 1806, countryId: 18, name: "Ouesso" },
  // ── RD Congo (19) ───────────────────────────────────────────────────────────
  { id: 1901, countryId: 19, name: "Kinshasa" },
  { id: 1902, countryId: 19, name: "Lubumbashi" },
  { id: 1903, countryId: 19, name: "Mbuji-Mayi" },
  { id: 1904, countryId: 19, name: "Kananga" },
  { id: 1905, countryId: 19, name: "Kisangani" },
  { id: 1906, countryId: 19, name: "Bukavu" },
  { id: 1907, countryId: 19, name: "Goma" },
  { id: 1908, countryId: 19, name: "Bunia" },
  { id: 1909, countryId: 19, name: "Matadi" },
  { id: 1910, countryId: 19, name: "Kolwezi" },
  // ── Centrafrique (20) ───────────────────────────────────────────────────────
  { id: 2001, countryId: 20, name: "Bangui" },
  { id: 2002, countryId: 20, name: "Bimbo" },
  { id: 2003, countryId: 20, name: "Mbaïki" },
  { id: 2004, countryId: 20, name: "Berberati" },
  { id: 2005, countryId: 20, name: "Bambari" },
  // ── Tchad (21) ──────────────────────────────────────────────────────────────
  { id: 2101, countryId: 21, name: "N'Djamena" },
  { id: 2102, countryId: 21, name: "Moundou" },
  { id: 2103, countryId: 21, name: "Sarh" },
  { id: 2104, countryId: 21, name: "Abéché" },
  { id: 2105, countryId: 21, name: "Kélo" },
  { id: 2106, countryId: 21, name: "Koumra" },
  // ── Guinée équatoriale (22) ─────────────────────────────────────────────────
  { id: 2201, countryId: 22, name: "Malabo" },
  { id: 2202, countryId: 22, name: "Bata" },
  { id: 2203, countryId: 22, name: "Ebebiyín" },
  // ── São Tomé-et-Príncipe (23) ───────────────────────────────────────────────
  { id: 2301, countryId: 23, name: "São Tomé" },
  { id: 2302, countryId: 23, name: "Santo António" },
  // ── Soudan du Sud (24) ──────────────────────────────────────────────────────
  { id: 2401, countryId: 24, name: "Juba" },
  { id: 2402, countryId: 24, name: "Wau" },
  { id: 2403, countryId: 24, name: "Malakal" },
  { id: 2404, countryId: 24, name: "Yei" },
  // ── Madagascar (25) ─────────────────────────────────────────────────────────
  { id: 2501, countryId: 25, name: "Antananarivo" },
  { id: 2502, countryId: 25, name: "Toamasina" },
  { id: 2503, countryId: 25, name: "Antsirabe" },
  { id: 2504, countryId: 25, name: "Fianarantsoa" },
  { id: 2505, countryId: 25, name: "Mahajanga" },
  { id: 2506, countryId: 25, name: "Toliara" },
  { id: 2507, countryId: 25, name: "Antsiranana" },
  // ── Comores (26) ────────────────────────────────────────────────────────────
  { id: 2601, countryId: 26, name: "Moroni" },
  { id: 2602, countryId: 26, name: "Mutsamudu" },
  { id: 2603, countryId: 26, name: "Fomboni" },
  // ── Djibouti (27) ───────────────────────────────────────────────────────────
  { id: 2701, countryId: 27, name: "Djibouti" },
  { id: 2702, countryId: 27, name: "Ali Sabieh" },
  { id: 2703, countryId: 27, name: "Tadjoura" },
  // ── Burundi (28) ────────────────────────────────────────────────────────────
  { id: 2801, countryId: 28, name: "Gitega" },
  { id: 2802, countryId: 28, name: "Bujumbura" },
  { id: 2803, countryId: 28, name: "Ngozi" },
  { id: 2804, countryId: 28, name: "Rumonge" },
  // ── Rwanda (29) ─────────────────────────────────────────────────────────────
  { id: 2901, countryId: 29, name: "Kigali" },
  { id: 2902, countryId: 29, name: "Butare" },
  { id: 2903, countryId: 29, name: "Gisenyi" },
  { id: 2904, countryId: 29, name: "Ruhengeri" },
  // ── Kenya (30) ──────────────────────────────────────────────────────────────
  { id: 3001, countryId: 30, name: "Nairobi" },
  { id: 3002, countryId: 30, name: "Mombasa" },
  { id: 3003, countryId: 30, name: "Kisumu" },
  { id: 3004, countryId: 30, name: "Nakuru" },
  { id: 3005, countryId: 30, name: "Eldoret" },
  { id: 3006, countryId: 30, name: "Thika" },
  { id: 3007, countryId: 30, name: "Malindi" },
  // ── Tanzanie (31) ───────────────────────────────────────────────────────────
  { id: 3101, countryId: 31, name: "Dodoma" },
  { id: 3102, countryId: 31, name: "Dar es Salaam" },
  { id: 3103, countryId: 31, name: "Mwanza" },
  { id: 3104, countryId: 31, name: "Arusha" },
  { id: 3105, countryId: 31, name: "Moshi" },
  { id: 3106, countryId: 31, name: "Tanga" },
  { id: 3107, countryId: 31, name: "Zanzibar" },
  // ── Ouganda (32) ────────────────────────────────────────────────────────────
  { id: 3201, countryId: 32, name: "Kampala" },
  { id: 3202, countryId: 32, name: "Gulu" },
  { id: 3203, countryId: 32, name: "Lira" },
  { id: 3204, countryId: 32, name: "Mbarara" },
  { id: 3205, countryId: 32, name: "Jinja" },
  { id: 3206, countryId: 32, name: "Entebbe" },
  // ── Éthiopie (33) ───────────────────────────────────────────────────────────
  { id: 3301, countryId: 33, name: "Addis-Abeba" },
  { id: 3302, countryId: 33, name: "Dire Dawa" },
  { id: 3303, countryId: 33, name: "Mekele" },
  { id: 3304, countryId: 33, name: "Gondar" },
  { id: 3305, countryId: 33, name: "Bahir Dar" },
  { id: 3306, countryId: 33, name: "Hawassa" },
  { id: 3307, countryId: 33, name: "Jimma" },
  // ── Somalie (34) ────────────────────────────────────────────────────────────
  { id: 3401, countryId: 34, name: "Mogadiscio" },
  { id: 3402, countryId: 34, name: "Hargeisa" },
  { id: 3403, countryId: 34, name: "Kismayo" },
  { id: 3404, countryId: 34, name: "Bosaso" },
  // ── Érythrée (35) ───────────────────────────────────────────────────────────
  { id: 3501, countryId: 35, name: "Asmara" },
  { id: 3502, countryId: 35, name: "Keren" },
  { id: 3503, countryId: 35, name: "Massawa" },
  // ── Zambie (36) ─────────────────────────────────────────────────────────────
  { id: 3601, countryId: 36, name: "Lusaka" },
  { id: 3602, countryId: 36, name: "Kitwe" },
  { id: 3603, countryId: 36, name: "Ndola" },
  { id: 3604, countryId: 36, name: "Kabwe" },
  { id: 3605, countryId: 36, name: "Livingstone" },
  // ── Malawi (37) ─────────────────────────────────────────────────────────────
  { id: 3701, countryId: 37, name: "Lilongwe" },
  { id: 3702, countryId: 37, name: "Blantyre" },
  { id: 3703, countryId: 37, name: "Mzuzu" },
  { id: 3704, countryId: 37, name: "Zomba" },
  // ── Zimbabwe (38) ───────────────────────────────────────────────────────────
  { id: 3801, countryId: 38, name: "Harare" },
  { id: 3802, countryId: 38, name: "Bulawayo" },
  { id: 3803, countryId: 38, name: "Mutare" },
  { id: 3804, countryId: 38, name: "Gweru" },
  // ── Mozambique (39) ─────────────────────────────────────────────────────────
  { id: 3901, countryId: 39, name: "Maputo" },
  { id: 3902, countryId: 39, name: "Matola" },
  { id: 3903, countryId: 39, name: "Beira" },
  { id: 3904, countryId: 39, name: "Nampula" },
  { id: 3905, countryId: 39, name: "Quelimane" },
  // ── Maurice (40) ────────────────────────────────────────────────────────────
  { id: 4001, countryId: 40, name: "Port-Louis" },
  { id: 4002, countryId: 40, name: "Beau Bassin-Rose Hill" },
  { id: 4003, countryId: 40, name: "Vacoas-Phoenix" },
  // ── Seychelles (41) ─────────────────────────────────────────────────────────
  { id: 4101, countryId: 41, name: "Victoria" },
  // ── Afrique du Sud (42) ─────────────────────────────────────────────────────
  { id: 4201, countryId: 42, name: "Johannesburg" },
  { id: 4202, countryId: 42, name: "Cape Town" },
  { id: 4203, countryId: 42, name: "Durban" },
  { id: 4204, countryId: 42, name: "Pretoria" },
  { id: 4205, countryId: 42, name: "Port Elizabeth" },
  { id: 4206, countryId: 42, name: "Bloemfontein" },
  { id: 4207, countryId: 42, name: "East London" },
  // ── Angola (43) ─────────────────────────────────────────────────────────────
  { id: 4301, countryId: 43, name: "Luanda" },
  { id: 4302, countryId: 43, name: "Huambo" },
  { id: 4303, countryId: 43, name: "Lobito" },
  { id: 4304, countryId: 43, name: "Benguela" },
  { id: 4305, countryId: 43, name: "Lubango" },
  { id: 4306, countryId: 43, name: "Malanje" },
  // ── Namibie (44) ────────────────────────────────────────────────────────────
  { id: 4401, countryId: 44, name: "Windhoek" },
  { id: 4402, countryId: 44, name: "Walvis Bay" },
  { id: 4403, countryId: 44, name: "Oshakati" },
  // ── Botswana (45) ───────────────────────────────────────────────────────────
  { id: 4501, countryId: 45, name: "Gaborone" },
  { id: 4502, countryId: 45, name: "Francistown" },
  { id: 4503, countryId: 45, name: "Maun" },
  // ── Lesotho (46) ────────────────────────────────────────────────────────────
  { id: 4601, countryId: 46, name: "Maseru" },
  { id: 4602, countryId: 46, name: "Teyateyaneng" },
  // ── Eswatini (47) ───────────────────────────────────────────────────────────
  { id: 4701, countryId: 47, name: "Mbabane" },
  { id: 4702, countryId: 47, name: "Manzini" },
  // ── Cap-Vert (48) ───────────────────────────────────────────────────────────
  { id: 4801, countryId: 48, name: "Praia" },
  { id: 4802, countryId: 48, name: "Mindelo" },
  { id: 4803, countryId: 48, name: "Santa Maria" },
];

export function getCitiesByCountry(countryId: number): City[] {
  return CITIES.filter((c) => c.countryId === countryId);
}

export function getCountryById(id: number): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function getCityById(id: number): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function getCityName(id: number): string {
  return getCityById(id)?.name ?? String(id);
}

export function getCountryName(id: number): string {
  return getCountryById(id)?.name ?? String(id);
}

export function getAllCityNames(): string[] {
  return CITIES.map((c) => c.name);
}
