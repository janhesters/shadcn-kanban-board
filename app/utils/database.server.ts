import { init } from '@paralleldrive/cuid2';
import { Prisma, PrismaClient } from '@prisma/client';

const cuid = init({ length: 8 });

// Define the slug extension first so we can use it to infer the type
const slugExtension = Prisma.defineExtension({
  name: 'slugExtension', // Optional: for error logging
  query: {
    organization: {
      async create({ args, query }) {
        const { data } = args;

        // Check if the slug already exists or is a reserved route.
        const slugExists = await prisma.organization.findUnique({
          where: { slug: data.slug },
        });

        if (slugExists || reservedSlugs.has(data.slug)) {
          data.slug = (data.slug + '-' + cuid()).toLowerCase();
        }

        return query(args);
      },
      async update({ args, query }) {
        const { data, where } = args;

        if (typeof data.slug === 'string') {
          const slugExists = await prisma.organization.findUnique({
            where: { slug: data.slug },
          });

          // If the slug exists, and it is not the slug of the organization we
          // are updating, or if the slug is a hardcoded route, then we need to
          // generate a new slug.
          if (
            (slugExists && slugExists.id !== where.id) ||
            reservedSlugs.has(data.slug)
          ) {
            data.slug = (data.slug + '-' + cuid()).toLowerCase();
          }
        }

        // Proceed with the query.
        return query(args);
      },
    },
  },
});

const trialEndExtension = Prisma.defineExtension({
  name: 'trialEndExtension',
  query: {
    organization: {
      async create({ args, query }) {
        const { data } = args;
        // only set it if the user/code didn’t explicitly pass trialEnd
        if (!('trialEnd' in data)) {
          const twoWeeksFromNow = new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          );
          // @ts-expect-error - trialEnd is a field on the organization model
          data.trialEnd = twoWeeksFromNow;
        }
        return query(args);
      },
    },
  },
});

// Create a dummy extended client to infer the correct type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummyClient = new PrismaClient()
  .$extends(slugExtension)
  .$extends(trialEndExtension);
type ExtendedPrismaClient = typeof dummyClient;

// Use the extended type for the prisma variable.
let prisma: ExtendedPrismaClient;

// Declare the global variable with the extended type.
declare global {
  // eslint-disable-next-line no-var
  var __database__: ExtendedPrismaClient;
}

const reservedSlugs = new Set([
  'new', // `organizations/new`
]);

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
    .$extends(slugExtension)
    .$extends(trialEndExtension);
} else {
  if (!globalThis.__database__) {
    globalThis.__database__ = new PrismaClient()
      .$extends(slugExtension)
      .$extends(trialEndExtension);
  }
  prisma = globalThis.__database__;
  void prisma.$connect();
}

export { prisma };
