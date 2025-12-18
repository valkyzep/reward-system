// Script to generate bcrypt password hashes for the admin users
// Run this with: node supabase/setup-passwords.js

const bcrypt = require('bcryptjs');

const users = [
  { email: 'superadmin@time2claim.com', password: 'SuperAdmin123!' },
  { email: 'admin1@time2claim.com', password: 'Admin123!' },
  { email: 'admin2@time2claim.com', password: 'Admin123!' },
  { email: 'admin3@time2claim.com', password: 'Admin123!' }
];

async function generateHashes() {
  console.log('\n=== Password Hashes for Supabase ===\n');
  console.log('Copy these UPDATE statements and run them in your Supabase SQL Editor:\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = '${user.email}';`);
  }
  
  console.log('\n=== Login Credentials ===\n');
  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log('---');
  }
}

generateHashes().catch(console.error);
