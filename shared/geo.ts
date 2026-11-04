/** Référentiel géographique : pays desservis et villes principales (les villes restent saisissables librement). */
export interface Country { code: string; name: string; cities: string[] }

export const COUNTRIES: Country[] = [
  { code: 'CI', name: "Côte d'Ivoire", cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa', 'Man', 'Gagnoa', 'Divo', 'Soubré', 'Abengourou', 'Bondoukou', 'Odienné', 'Séguéla', 'Duékoué', 'Grand-Bassam', 'Aboisso'] },
  { code: 'SN', name: 'Sénégal', cities: ['Dakar', 'Touba', 'Thiès', 'Mbour', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Tambacounda', 'Diourbel', 'Kolda', 'Louga', 'Richard-Toll', 'Tivaouane', 'Kaffrine', 'Bignona', 'Saly'] },
  { code: 'ML', name: 'Mali', cities: ['Bamako', 'Sikasso', 'Kayes', 'Koutiala', 'Ségou', 'Kati', 'Gao', 'Mopti', 'San', 'Bougouni', 'Kita', 'Koulikoro', 'Niono', 'Tombouctou'] },
  { code: 'BF', name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Kaya', 'Banfora', 'Pouytenga', 'Houndé', "Fada N'Gourma", 'Dédougou', 'Tenkodogo', 'Dori', 'Gaoua'] },
  { code: 'BJ', name: 'Bénin', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon', 'Abomey', 'Natitingou', 'Ouidah', 'Lokossa', 'Kandi', 'Malanville'] },
  { code: 'TG', name: 'Togo', cities: ['Lomé', 'Kara', 'Dapaong', 'Sokodé', 'Atakpamé', 'Kpalimé', 'Tsévié', 'Aného', 'Notsé', 'Mango', 'Tabligbo', 'Bassar'] },
  { code: 'NE', name: 'Niger', cities: ['Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez', 'Dosso', "Birni N'Konni", 'Tillabéri', 'Arlit', 'Diffa', 'Gaya'] },
  { code: 'GN', name: 'Guinée-Conakry', cities: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé', 'Siguiri', 'Kissidougou', 'Dubréka', 'Coyah', 'Kamsar', 'Boké', 'Mamou', 'Faranah'] },
  { code: 'GH', name: 'Ghana', cities: ['Accra', 'Kumasi', 'Sekondi-Takoradi', 'Tamale', 'Cape Coast', 'Koforidua', 'Obuasi', 'Ho', 'Sunyani', 'Tema', 'Techiman', 'Bolgatanga', 'Wa'] },
  { code: 'NG', name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'] },
  { code: 'CM', name: 'Cameroun', cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Kribi'] },
  { code: 'GA', name: 'Gabon', cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem'] },
  { code: 'CG', name: 'Congo', cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie'] },
  { code: 'CD', name: 'RD Congo', cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi'] },
  { code: 'TD', name: 'Tchad', cities: ["N'Djamena", 'Abéché', 'Moundou', 'Sarh', 'Mongo', 'Am Timan', 'Koumra', 'Doba', 'Faya-Largeau', 'Pala', 'Ati', 'Bongor'] },
  { code: 'LR', name: 'Liberia', cities: ['Monrovia', 'Gbarnga', 'Kakata', 'Buchanan', 'Ganta', 'Voinjama', 'Harbel', 'Zwedru', 'Harper'] },
  { code: 'CF', name: 'Centrafrique', cities: ['Bangui', 'Bimbo', 'Berbérati'] },
  { code: 'GQ', name: 'Guinée équatoriale', cities: ['Malabo', 'Bata'] },
  { code: 'MA', name: 'Maroc', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Agadir'] },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];
export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;
export const citiesOf = (code: string) => COUNTRIES.find((c) => c.code === code)?.cities ?? [];
