import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: 'hub_resa',
});

// Restaurants à configurer
const restaurants = [
  { id: 1, name: 'Bushman Café' },
  { id: 2, name: 'Le Montparnasse Restaurant' },
  { id: 3, name: 'Restaurant Saakan' },
  { id: 4, name: 'BACHALP HOTEL' },
  { id: 5, name: 'Chez Ambroise' },
];

// Catégories de menu
const categories = [
  { name: 'Entrées', description: 'Plats d\'entrée', sortOrder: 1 },
  { name: 'Plats Principaux', description: 'Nos spécialités', sortOrder: 2 },
  { name: 'Boissons', description: 'Boissons froides et chaudes', sortOrder: 3 },
  { name: 'Desserts', description: 'Nos desserts maison', sortOrder: 4 },
];

// Plats par catégorie
const items = {
  'Entrées': [
    { name: 'Salade Verte', description: 'Salade fraîche de saison', price: '2500', prepTime: 5 },
    { name: 'Soupe à l\'Oignon', description: 'Soupe gratinée', price: '3000', prepTime: 10 },
    { name: 'Crevettes Grillées', description: 'Crevettes fraîches', price: '5000', prepTime: 8 },
  ],
  'Plats Principaux': [
    { name: 'Poulet Rôti', description: 'Poulet fermier rôti', price: '7500', prepTime: 20 },
    { name: 'Poisson Grillé', description: 'Poisson du jour', price: '8500', prepTime: 18 },
    { name: 'Côte de Boeuf', description: 'Viande premium', price: '12000', prepTime: 25 },
    { name: 'Pâtes Carbonara', description: 'Pâtes fraîches', price: '6500', prepTime: 15 },
    { name: 'Riz Jollof', description: 'Riz parfumé', price: '5500', prepTime: 15 },
  ],
  'Boissons': [
    { name: 'Eau Minérale', description: '50cl', price: '500', prepTime: 1 },
    { name: 'Jus d\'Orange Frais', description: 'Pressé maison', price: '1500', prepTime: 3 },
    { name: 'Coca Cola', description: '33cl', price: '1000', prepTime: 1 },
    { name: 'Vin Rouge', description: 'Sélection', price: '15000', prepTime: 1 },
    { name: 'Bière Locale', description: '65cl', price: '2500', prepTime: 1 },
  ],
  'Desserts': [
    { name: 'Tiramisu', description: 'Dessert italien', price: '3500', prepTime: 5 },
    { name: 'Crème Brûlée', description: 'Crème caramélisée', price: '3000', prepTime: 5 },
    { name: 'Fruit Frais', description: 'Assiette de fruits', price: '2500', prepTime: 3 },
  ],
};

async function seedMenus() {
  try {
    console.log('🌱 Début du seed des menus restaurants...');

    for (const restaurant of restaurants) {
      console.log(`\n📍 Configuration de ${restaurant.name}...`);

      // Créer les catégories
      const categoryIds = {};
      for (const category of categories) {
        const [result] = await connection.execute(
          'INSERT INTO menuCategories (companyId, name, description, sortOrder) VALUES (?, ?, ?, ?)',
          [restaurant.id, category.name, category.description, category.sortOrder]
        );
        categoryIds[category.name] = result.insertId;
        console.log(`  ✓ Catégorie créée: ${category.name}`);
      }

      // Ajouter les plats
      let itemCount = 0;
      for (const [categoryName, categoryItems] of Object.entries(items)) {
        const categoryId = categoryIds[categoryName];
        for (const item of categoryItems) {
          await connection.execute(
            'INSERT INTO menuItems (companyId, categoryId, name, description, priceXOF, available, preparationTime, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [restaurant.id, categoryId, item.name, item.description, item.price, true, item.prepTime, itemCount++]
          );
        }
        console.log(`  ✓ ${categoryItems.length} plats ajoutés à ${categoryName}`);
      }

      // Ajouter les zones de livraison
      const zones = [
        { name: 'Zone Centre', description: 'Abidjan Centre', extraMinutes: 15 },
        { name: 'Zone Plateau', description: 'Plateau - Cocody', extraMinutes: 20 },
        { name: 'Zone Yopougon', description: 'Yopougon - Adjamé', extraMinutes: 25 },
      ];

      for (const zone of zones) {
        await connection.execute(
          'INSERT INTO deliveryZones (companyId, name, description, extraMinutes, active) VALUES (?, ?, ?, ?, ?)',
          [restaurant.id, zone.name, zone.description, zone.extraMinutes, true]
        );
      }
      console.log(`  ✓ 3 zones de livraison ajoutées`);
    }

    console.log('\n✅ Seed des menus restaurants terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
  } finally {
    await connection.end();
  }
}

seedMenus();
