/**
 * makeAdmins.js
 * ─────────────────────────────────────────────────────────────
 * Bulk-promote existing users to admin role  OR  create new
 * admin accounts if a user with that email does not yet exist.
 *
 * HOW TO USE:
 *   1. Add teacher emails + passwords to the TEACHERS array below.
 *   2. Run:  node backend/scripts/makeAdmins.js
 *
 * BEHAVIOUR per entry:
 *   • User exists  → role is set to 'admin'  (password unchanged)
 *   • User missing → new account is created with role 'admin'
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════
//  ADD TEACHER ACCOUNTS HERE
//  Fields used only when creating a NEW account:
//    name, email, password, rollNumber, branch, batch
//  If the account already exists only `role` is updated.
// ═══════════════════════════════════════════════════════════════
const TEACHERS = [
  {
    name: 'Teacher One',
    email: 'teacher1@kkwagh.edu.in',
    password: 'Teacher@123',
    rollNumber: 'TCH001',
    branch: 'CSE',
    batch: 'Faculty'
  },
  {
    name: 'Teacher Two',
    email: 'teacher2@kkwagh.edu.in',
    password: 'Teacher@123',
    rollNumber: 'TCH002',
    branch: 'IT',
    batch: 'Faculty'
  },
  // ── Add more teachers below ──
  // {
  //   name: 'Prof. Sharma',
  //   email: 'sharma@kkwagh.edu.in',
  //   password: 'Sharma@456',
  //   rollNumber: 'TCH003',
  //   branch: 'CSE',
  //   batch: 'Faculty'
  // },
];
// ═══════════════════════════════════════════════════════════════

const run = async () => {
  if (TEACHERS.length === 0) {
    console.log('⚠️  TEACHERS array is empty. Add entries and run again.');
    process.exit(0);
  }

  console.log('\n🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected\n');

  let created = 0;
  let promoted = 0;
  let skipped = 0;

  for (const teacher of TEACHERS) {
    const { name, email, password, rollNumber, branch, batch } = teacher;

    if (!email) {
      console.log(`  ⚠️  Skipping entry with missing email`);
      skipped++;
      continue;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.role === 'admin' || existing.role === 'superadmin') {
        console.log(`  ✔  ${email}  →  already ${existing.role}, skipping`);
        skipped++;
      } else {
        await User.findByIdAndUpdate(existing._id, { role: 'admin' });
        console.log(`  🔼  ${email}  →  promoted to admin`);
        promoted++;
      }
    } else {
      // Validate required fields for new account
      if (!name || !password || !rollNumber) {
        console.log(`  ✗  ${email}  →  missing name/password/rollNumber — skipped`);
        skipped++;
        continue;
      }

      await User.create({
        name,
        email: email.toLowerCase(),
        password,          // hashed automatically by User pre-save hook
        rollNumber,
        branch: branch || 'N/A',
        batch: batch || 'Faculty',
        role: 'admin',
        isVerified: true
      });
      console.log(`  ✨  ${email}  →  created as admin`);
      created++;
    }
  }

  console.log('\n──────────────────────────────');
  console.log(`  Created  : ${created}`);
  console.log(`  Promoted : ${promoted}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log('──────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
