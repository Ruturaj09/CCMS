const Complaint = require('../models/Complaint');

/**
 * Generates a unique ticket number in the format AKL-<VILLAGECODE>-<YEAR>-<SEQ>
 * e.g. AKL-SNG-2026-089
 */
async function generateTicketNumber(villageCode) {
  const year = new Date().getFullYear();
  const prefix = `AKL-${villageCode}-${year}-`;

  // Count existing tickets with this prefix to determine next sequence number.
  const count = await Complaint.countDocuments({ ticketNumber: { $regex: `^${prefix}` } });
  const seq = String(count + 1).padStart(3, '0');

  let ticketNumber = `${prefix}${seq}`;

  // Safety net in case of race conditions - loop until unique.
  let attempt = count + 1;
  while (await Complaint.exists({ ticketNumber })) {
    attempt += 1;
    ticketNumber = `${prefix}${String(attempt).padStart(3, '0')}`;
  }

  return ticketNumber;
}

module.exports = generateTicketNumber;
