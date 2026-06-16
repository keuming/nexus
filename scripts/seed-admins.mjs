import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

// Lire DATABASE_URL depuis l'environnement (injecté par le système)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const admins = [
  {
    email: "keuming@yahoo.fr",
    password: "Insitu@30121978",
    displayName: "Keuming (Admin CSN)",
  },
  {
    email: "anicettefd.wayou@gmail.com",
    password: "40124",
    displayName: "Anicette Wayou (Admin CSN)",
  },
];

const conn = await mysql.createConnection(DATABASE_URL);

for (const admin of admins) {
  const hash = await bcrypt.hash(admin.password, 12);
  await conn.execute(
    `INSERT INTO admin_credentials (email, passwordHash, displayName, isActive)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), displayName = VALUES(displayName)`,
    [admin.email, hash, admin.displayName]
  );
  console.log(`✅ Admin créé/mis à jour : ${admin.email}`);
}

await conn.end();
console.log("✅ Seed admins terminé");
