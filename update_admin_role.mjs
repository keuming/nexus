import { db } from './server/db.ts';
import { users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function updateAdminRole() {
  try {
    // Chercher l'utilisateur avec l'email keumingo@gmail.com
    const user = await db.select().from(users).where(eq(users.email, 'keumingo@gmail.com')).limit(1);
    
    if (user.length === 0) {
      console.log('❌ Utilisateur keumingo@gmail.com non trouvé dans la base de données');
      process.exit(1);
    }

    console.log('✅ Utilisateur trouvé:', user[0]);
    console.log('Rôle actuel:', user[0].role);

    // Mettre à jour le rôle à 'admin'
    const result = await db.update(users).set({ role: 'admin' }).where(eq(users.email, 'keumingo@gmail.com'));
    
    console.log('✅ Rôle mis à jour à "admin"');
    
    // Vérifier la mise à jour
    const updatedUser = await db.select().from(users).where(eq(users.email, 'keumingo@gmail.com')).limit(1);
    console.log('✅ Vérification - Nouveau rôle:', updatedUser[0].role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

updateAdminRole();
