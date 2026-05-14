const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
require('dotenv').config();

const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');
const userClient = require('./grpc-clients/user.client');

// REST routes
const authRoutes     = require('./rest/routes/auth.routes');
const usersRoutes    = require('./rest/routes/users.routes');
const coursesRoutes  = require('./rest/routes/courses.routes');
const progressRoutes = require('./rest/routes/progress.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// ── REST routes ───────────────────────────
app.use('/auth',     authRoutes);
app.use('/users',    usersRoutes);
app.use('/courses',  coursesRoutes);
app.use('/progress', progressRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'API Gateway', timestamp: new Date().toISOString() });
});

// ── GraphQL ───────────────────────────────
const startServer = async () => {
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        // Extract user from token if present
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const result = await userClient.validateToken({ token });
            return { userId: result.user_id, role: result.role };
          }
        } catch (_) {}
        return {};
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`📡 REST  → http://localhost:${PORT}/auth | /users | /courses | /progress`);
    console.log(`🔷 GraphQL → http://localhost:${PORT}/graphql`);
  });
};

startServer();