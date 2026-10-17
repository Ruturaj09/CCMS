require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Village = require('../models/Village');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const villageNames = require('./villages');
const generateTicketNumber = require('../utils/ticketGenerator');

function codeFor(name, used) {
  // Derive a short 3-4 letter code from the village name; ensure uniqueness.
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  let base = letters.slice(0, 3) || 'VLG';
  let code = base;
  let n = 1;
  while (used.has(code)) {
    code = `${base}${n}`;
    n += 1;
  }
  used.add(code);
  return code;
}

async function run() {
  await connectDB();
  console.log('Seeding database...');

  // ---- Villages ----
  await Village.deleteMany({});
  const used = new Set();
  const villageDocs = villageNames.map((name) => ({
    villageName: name,
    talukaName: 'Akole',
    code: codeFor(name, used)
  }));
  const insertedVillages = await Village.insertMany(villageDocs);
  console.log(`Inserted ${insertedVillages.length} villages.`);

  const sangvi = insertedVillages.find(v => v.villageName === 'Sangvi');
  const rajur = insertedVillages.find(v => v.villageName === 'Rajur');
  const kotul = insertedVillages.find(v => v.villageName === 'Kotul');

  // ---- Demo users ----
  await User.deleteMany({});

  const admin = await User.create({
    fullName: 'MLA Office Admin',
    mobileNumber: '9000000001',
    role: 'admin',
    isVerified: true
  });

  const mla = await User.create({
    fullName: 'Dr. Kiran Lahamte',
    mobileNumber: '9000000002',
    role: 'mla',
    isVerified: true
  });

  const worker1 = await User.create({
    fullName: 'Ramesh Pawar',
    mobileNumber: '9111111111',
    role: 'worker',
    village: sangvi._id,
    designation: 'Party Worker',
    isVerified: true
  });

  const worker2 = await User.create({
    fullName: 'Sunita Shinde',
    mobileNumber: '9222222222',
    role: 'sarpanch',
    village: rajur._id,
    designation: 'Sarpanch',
    isVerified: true
  });

  const worker3 = await User.create({
    fullName: 'Vikas Dere',
    mobileNumber: '9333333333',
    role: 'worker',
    village: kotul._id,
    designation: 'Party Worker',
    isVerified: false
  });

  console.log('Created demo users: admin, mla, and 3 workers across Sangvi/Rajur/Kotul.');

  // ---- Sample complaints (demonstrates isolation across villages/workers) ----
  await Complaint.deleteMany({});

  const sampleData = [
    { user: worker1, village: sangvi, category: 'Roads/Infrastructure', title: 'Pothole near Sangvi bus stand', urgency: 'High', status: 'Under Review' },
    { user: worker1, village: sangvi, category: 'Water Supply', title: 'No water supply for 3 days in Sangvi ward 2', urgency: 'Emergency', status: 'Submitted' },
    { user: worker2, village: rajur, category: 'MSEB/Electricity', title: 'Frequent power cuts in Rajur market area', urgency: 'Normal', status: 'Letter Issued' },
    { user: worker3, village: kotul, category: 'Health/Hospital', title: 'Shortage of medicines at Kotul PHC', urgency: 'High', status: 'Resolved' }
  ];

  for (const c of sampleData) {
    const ticketNumber = await generateTicketNumber(c.village.code);
    await Complaint.create({
      ticketNumber,
      user: c.user._id,
      village: c.village._id,
      category: c.category,
      title: c.title,
      description: 'Sample seeded complaint for demo purposes.',
      urgency: c.urgency,
      status: c.status,
      timeline: [{ action: 'Submitted', actor: c.user._id }]
    });
  }

  console.log('Inserted sample complaints.');
  console.log('\n--- DEMO LOGIN NUMBERS (use these on the /login screen; OTP prints to this console) ---');
  console.log('Admin:   9000000001');
  console.log('MLA:     9000000002');
  console.log('Worker (Sangvi):  9111111111');
  console.log('Sarpanch (Rajur): 9222222222');
  console.log('Worker (Kotul, unverified): 9333333333');
  console.log('-------------------------------------------------------------------------------------\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
