// Crée ou met à jour le compte administrateur. Le mot de passe n'est jamais stocké en clair.
// Usage : ADMIN_EMAIL=... ADMIN_PASSWORD=... DATABASE_URL=... npm run seed:admin
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { DATABASE_URL: url, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!url || !email || !password) { console.error('DATABASE_URL, ADMIN_EMAIL et ADMIN_PASSWORD sont requis'); process.exit(1); }
if (password.length < 12) { console.error('ADMIN_PASSWORD : 12 caractères minimum'); process.exit(1); }

const client = new pg.Client({ connectionString: url.replace(/[?&]channel_binding=[^&]*/g, ''), ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : true });
await client.connect();
try {
  const hash = await bcrypt.hash(password, 11);
  const { rowCount } = await client.query("update users set password_hash=$2, role='admin' where lower(email)=lower($1)", [email, hash]);
  if (!rowCount) await client.query("insert into users (email, name, role, password_hash) values (lower($1), 'Administrateur', 'admin', $2)", [email, hash]);
  console.log(`Admin ${rowCount ? 'mis à jour' : 'créé'} : ${email.toLowerCase()}`);
} finally { await client.end(); }
