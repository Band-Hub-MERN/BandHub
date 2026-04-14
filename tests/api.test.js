const path = require('path');
const express = require('express');
const request = require('supertest');

const ROOT_DIR = path.resolve(__dirname, '..');

function getPathValues(source, keyPath) {
  return keyPath.split('.').reduce((values, key) => (
    values.flatMap((value) => {
      if (Array.isArray(value)) {
        return value.map((item) => item?.[key]);
      }

      if (value == null) {
        return [];
      }

      return [value[key]];
    }).filter((value) => value !== undefined)
  ), [source]);
}

function valueMatches(actual, expected) {
  if (actual === expected) {
    return true;
  }

  if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();
  }

  return String(actual) === String(expected);
}

function matchesQuery(row, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    const values = getPathValues(row, key);

    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) {
        return values.some((value) => expected.$in.some((candidate) => valueMatches(value, candidate)));
      }
    }

    return values.some((value) => valueMatches(value, expected));
  });
}

function createQuery(rows) {
  const query = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    select: jest.fn(async () => rows),
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
    catch: (reject) => Promise.resolve(rows).catch(reject),
  };

  return query;
}

function createAccountUserModel(seedRows = []) {
  const rows = [];
  let nextId = 1;

  function attachPersistence(record) {
    record.save = jest.fn(async () => {
      const index = rows.findIndex((row) => String(row._id) === String(record._id));
      if (index === -1) {
        rows.push(record);
      } else {
        rows[index] = record;
      }
      return record;
    });

    return record;
  }

  class AccountUser {
    constructor(data) {
      Object.assign(this, {
        _id: data?._id || `user-${nextId++}`,
        email: '',
        passwordHash: '',
        accountType: 'fan',
        displayName: '',
        bio: '',
        organizationId: null,
        memberRoleLabel: '',
        isVerified: false,
        verificationToken: null,
        verificationExpiresAt: null,
        emailDeliveryStatus: 'pending',
        emailDeliveryMessage: '',
        emailDeliveryUpdatedAt: null,
        registrationStatusToken: null,
        notificationPrefs: {
          invites: true,
          events: true,
          bookings: true,
          digest: false,
        },
      }, data);

      attachPersistence(this);
    }

    static async findOne(query) {
      return rows.find((row) => matchesQuery(row, query)) || null;
    }

    static async findById(id) {
      return rows.find((row) => String(row._id) === String(id)) || null;
    }

    static async find(query) {
      return rows.filter((row) => matchesQuery(row, query));
    }

    static async deleteOne(query) {
      const index = rows.findIndex((row) => matchesQuery(row, query));
      if (index >= 0) {
        rows.splice(index, 1);
      }
      return { deletedCount: index >= 0 ? 1 : 0 };
    }

    static async findByIdAndUpdate(id, update) {
      const row = await AccountUser.findById(id);
      if (!row) {
        return null;
      }

      Object.assign(row, update);
      return row;
    }
  }

  seedRows.forEach((row) => {
    const user = new AccountUser(row);
    rows.push(user);
  });

  return { AccountUser, rows };
}

function createOrganizationProfileModel(seedRows = []) {
  const rows = [];
  let nextId = 1;

  class OrganizationProfile {
    constructor(data) {
      Object.assign(this, {
        _id: data?._id || `org-${nextId++}`,
        name: '',
        category: '',
        description: '',
        color: '#FFC904',
        initials: 'NA',
        ownerUserId: null,
        members: [],
      }, data);

      this.save = jest.fn(async () => {
        const index = rows.findIndex((row) => String(row._id) === String(this._id));
        if (index === -1) {
          rows.push(this);
        } else {
          rows[index] = this;
        }
        return this;
      });
    }

    static async findById(id) {
      return rows.find((row) => String(row._id) === String(id)) || null;
    }

    static find(query) {
      return createQuery(rows.filter((row) => matchesQuery(row, query)));
    }
  }

  seedRows.forEach((row) => {
    const org = new OrganizationProfile(row);
    rows.push(org);
  });

  return { OrganizationProfile, rows };
}

function createSimpleModel(seedRows = []) {
  const rows = [];
  let nextId = 1;

  class Model {
    constructor(data) {
      Object.assign(this, { _id: data?._id || `row-${nextId++}` }, data);
      this.save = jest.fn(async () => {
        const index = rows.findIndex((row) => String(row._id) === String(this._id));
        if (index === -1) {
          rows.push(this);
        } else {
          rows[index] = this;
        }
        return this;
      });
      this.deleteOne = jest.fn(async () => {
        const index = rows.findIndex((row) => String(row._id) === String(this._id));
        if (index >= 0) {
          rows.splice(index, 1);
        }
      });
    }

    static async find(query) {
      return rows.filter((row) => matchesQuery(row, query));
    }

    static async findById(id) {
      return rows.find((row) => String(row._id) === String(id)) || null;
    }

    static async findOne(query) {
      return rows.find((row) => matchesQuery(row, query)) || null;
    }

    static async deleteMany(query) {
      const remaining = rows.filter((row) => !matchesQuery(row, query));
      rows.length = 0;
      rows.push(...remaining);
      return { deletedCount: seedRows.length - remaining.length };
    }
  }

  seedRows.forEach((row) => {
    const record = new Model(row);
    rows.push(record);
  });

  return { Model, rows };
}

function createHarness(options = {}) {
  jest.resetModules();

  const accountUsers = createAccountUserModel(options.accountUsers);
  const organizations = createOrganizationProfileModel(options.organizations);
  const invites = createSimpleModel(options.invites);
  const bookings = createSimpleModel(options.bookings);
  const events = createSimpleModel(options.events);

  const passwordPolicy = {
    validatePasswordPolicy: jest.fn((password) => ({
      isValid: true,
      errors: [],
      ...(options.passwordPolicyResultByValue?.[password] || {}),
    })),
  };

  const passwordHash = {
    hashPassword: jest.fn(async (password) => `hashed:${password}`),
    verifyPassword: jest.fn(async (password, passwordHashValue) => passwordHashValue === `hashed:${password}`),
  };

  const emailVerification = {
    createVerificationFields: jest.fn(() => ({
      verificationToken: 'verify-token',
      verificationExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
    })),
    validateEmailAddress: jest.fn(async () => ({ checked: false, isInvalid: false })),
    sendVerificationEmail: jest.fn(async () => undefined),
  };

  const authToken = {
    verifyAuthToken: jest.fn((token) => {
      if (token === 'valid-token') {
        return { sub: 'user-auth' };
      }
      throw new Error('Invalid token');
    }),
    createAuthToken: jest.fn(() => 'signed-token'),
  };

  const mockRegistry = {
    [path.join(ROOT_DIR, 'models/accountUser.js')]: accountUsers.AccountUser,
    [path.join(ROOT_DIR, 'models/organizationProfile.js')]: organizations.OrganizationProfile,
    [path.join(ROOT_DIR, 'models/organizationInvite.js')]: invites.Model,
    [path.join(ROOT_DIR, 'models/booking.js')]: bookings.Model,
    [path.join(ROOT_DIR, 'models/garageEvent.js')]: events.Model,
    [path.join(ROOT_DIR, 'authToken.js')]: authToken,
    [path.join(ROOT_DIR, 'utils/passwordPolicy.js')]: passwordPolicy,
    [path.join(ROOT_DIR, 'utils/passwordHash.js')]: passwordHash,
    [path.join(ROOT_DIR, 'utils/emailVerification.js')]: emailVerification,
  };

  Object.entries(mockRegistry).forEach(([modulePath, mockExport]) => {
    jest.doMock(modulePath, () => mockExport);
  });

  const api = require(path.join(ROOT_DIR, 'api.js'));
  const app = express();
  app.use(express.json());
  api.setApp(app);

  return {
    app,
    stores: {
      accountUsers,
      organizations,
      invites,
      bookings,
      events,
    },
    mocks: {
      authToken,
      passwordPolicy,
      passwordHash,
      emailVerification,
    },
  };
}

describe('api.js', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('rejects register payloads with unexpected keys', async () => {
    const { app } = createHarness();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'person@example.com',
        password: 'Password1!',
        displayName: 'Test User',
        accountType: 'member',
        hackerField: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid registration payload shape',
      details: [],
    });
  });

  test('registers a member account, normalizes fields, and sends verification email', async () => {
    const { app, stores, mocks } = createHarness();

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: '  NewUser@Example.com ',
        password: 'Password1!',
        displayName: '  New User  ',
        accountType: 'member',
        memberRoleLabel: '  Guitar  ',
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      email: 'newuser@example.com',
      displayName: 'New User',
      accountType: 'member',
      memberRoleLabel: 'Guitar',
      isVerified: false,
    });
    expect(stores.accountUsers.rows).toHaveLength(1);
    expect(stores.accountUsers.rows[0]).toMatchObject({
      email: 'newuser@example.com',
      passwordHash: 'hashed:Password1!',
      displayName: 'New User',
      memberRoleLabel: 'Guitar',
      verificationToken: 'verify-token',
    });
    expect(mocks.emailVerification.sendVerificationEmail).toHaveBeenCalledWith('newuser@example.com', 'verify-token');
  });

  test('blocks login for users whose email is still unverified', async () => {
    const { app } = createHarness({
      accountUsers: [{
        _id: 'user-1',
        email: 'member@example.com',
        passwordHash: 'hashed:Password1!',
        accountType: 'member',
        displayName: 'Member One',
        isVerified: false,
      }],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'member@example.com',
        password: 'Password1!',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Please verify your email before logging in.' });
  });

  test('marks invalid-address bounces as bounced_invalid in the SendGrid webhook', async () => {
    const { app, stores } = createHarness({
      accountUsers: [{
        _id: 'user-1',
        email: 'bounce@example.com',
        passwordHash: 'hashed:Password1!',
        accountType: 'member',
        displayName: 'Bounce User',
        isVerified: false,
      }],
    });

    const response = await request(app)
      .post('/api/sendgrid/events')
      .send([{
        email: 'bounce@example.com',
        event: 'bounce',
        bounce_classification: 'Invalid Address',
        status: '5.1.1',
        reason: 'Mailbox does not exist',
      }]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: 1 });
    expect(stores.accountUsers.rows[0].emailDeliveryStatus).toBe('bounced_invalid');
    expect(stores.accountUsers.rows[0].emailDeliveryMessage).toBe(
      'That email address appears not to exist. Please double-check it for typos and try again.'
    );
    expect(stores.accountUsers.rows[0].save).toHaveBeenCalled();
  });

  test('rejects booking creation when the garage floor is already at capacity', async () => {
    const orgId = '507f1f77bcf86cd799439011';

    const { app } = createHarness({
      accountUsers: [{
        _id: 'user-auth',
        email: 'member@example.com',
        passwordHash: 'hashed:Password1!',
        accountType: 'member',
        displayName: 'Member One',
        isVerified: true,
        organizationId: orgId,
      }],
      organizations: [{
        _id: orgId,
        name: 'Band One',
        category: 'Rock',
        ownerUserId: 'user-auth',
        members: [{
          userId: 'user-auth',
          permissions: {
            canInviteMembers: true,
            canRemoveMembers: true,
            canEditOrganization: true,
            canDeleteOrganization: true,
            canManagePermissions: true,
          },
        }],
      }],
      bookings: [
        {
          _id: 'booking-1',
          garageId: 'A',
          floor: 2,
          date: '2026-05-01',
          startTime: '18:00',
          endTime: '19:00',
        },
        {
          _id: 'booking-2',
          garageId: 'A',
          floor: 2,
          date: '2026-05-01',
          startTime: '18:30',
          endTime: '19:30',
        },
      ],
    });

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer valid-token')
      .send({
        garageId: 'A',
        floor: 2,
        startTime: '18:30',
        endTime: '19:00',
        date: '2026-05-01',
        isWeekly: false,
        orgId,
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'This floor is already at capacity for the selected time',
    });
  });
});
