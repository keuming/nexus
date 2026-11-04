/** Référentiel géographique : pays desservis et villes principales (les villes restent saisissables librement). */
export interface Country { code: string; name: string; cities: string[] }

export const COUNTRIES: Country[] = [
  { code: 'CI', name: "Côte d'Ivoire", cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa', 'Man', 'Grand-Bassam', 'Divo', 'Gagnoa', 'Abengourou'] },
  { code: 'SN', name: 'Sénégal', cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Mbour'] },
  { code: 'ML', name: 'Mali', cities: ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes', 'Koutiala'] },
  { code: 'BF', name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'] },
  { code: 'BJ', name: 'Bénin', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon'] },
  { code: 'TG', name: 'Togo', cities: ['Lomé', 'Kara', 'Sokodé', 'Atakpamé', 'Kpalimé'] },
  { code: 'NE', name: 'Niger', cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Dosso'] },
  { code: 'GN', name: 'Guinée', cities: ['Conakry', 'Kankan', 'Labé', 'Nzérékoré', 'Kindia'] },
  { code: 'GH', name: 'Ghana', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
  { code: 'NG', name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'] },
  { code: 'CM', name: 'Cameroun', cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Kribi'] },
  { code: 'GA', name: 'Gabon', cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem'] },
  { code: 'CG', name: 'Congo', cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie'] },
  { code: 'CD', name: 'RD Congo', cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi'] },
  { code: 'TD', name: 'Tchad', cities: ["N'Djamena", 'Moundou', 'Sarh'] },
  { code: 'CF', name: 'Centrafrique', cities: ['Bangui', 'Bimbo', 'Berbérati'] },
  { code: 'GQ', name: 'Guinée équatoriale', cities: ['Malabo', 'Bata'] },
  { code: 'MA', name: 'Maroc', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Agadir'] },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]];
export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code;
export const citiesOf = (code: string) => COUNTRIES.find((c) => c.code === code)?.cities ?? [];
