import { bootstrapPromoteAdmin } from './server/routers/adminAuth.ts';

try {
  await bootstrapPromoteAdmin('keumingo@gmail.com');
  console.log('✓ Admin promotion successful');
  process.exit(0);
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
