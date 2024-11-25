const authHandler = require('../handlers/authHandler');

const authRoutes = [
  {
    method: 'POST',
    path: '/register',
    handler: authHandler.registerUser,
  },
  {
    method: 'POST',
    path: '/login',
    handler: authHandler.loginUser,
  },
  {
    method: 'POST',
    path: '/verify/{userid}',
    handler: authHandler.verifyToken,
  },
];

module.exports = authRoutes;
