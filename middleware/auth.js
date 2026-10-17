const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT stored in the httpOnly cookie, loads the user, and attaches
 * it to req.user / res.locals.currentUser for use in controllers and views.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      return res.redirect('/login');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).populate('village');

    if (!user || !user.isActive) {
      res.clearCookie('token');
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'Session invalid' });
      }
      return res.redirect('/login');
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    return res.redirect('/login');
  }
}

/**
 * Restricts a route to a set of allowed roles.
 * Usage: requireRole('admin', 'mla')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'Forbidden: insufficient role privileges' });
      }
      return res.status(403).render('403', { title: 'Access Denied' });
    }
    next();
  };
}

/**
 * CRITICAL ARCHITECTURAL MANDATE (SRS Section 1): Village & Worker Data Isolation.
 *
 * This is the application-layer equivalent of the PostgreSQL Row-Level-Security
 * policy described in SRS section 7. Every query touching the `complaints`
 * collection for a worker/sarpanch role MUST be scoped to that user's own
 * user_id. Admin/MLA roles bypass this filter and see the whole taluka.
 *
 * Returns a Mongo filter object to merge into any Complaint query.
 */
function isolationFilter(user) {
  if (user.role === 'admin' || user.role === 'mla') {
    return {}; // full taluka visibility per RBAC matrix
  }
  // worker / sarpanch: strictly self-created records only (row-level isolation)
  return { user: user._id };
}

module.exports = { requireAuth, requireRole, isolationFilter };
