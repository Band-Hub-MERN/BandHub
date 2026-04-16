require('express');
const crypto = require('crypto');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const AccountUser = require('./models/accountUser.js');
const OrganizationProfile = require('./models/organizationProfile.js');
const OrganizationInvite = require('./models/organizationInvite.js');
const Booking = require('./models/booking.js');
const GarageEvent = require('./models/garageEvent.js');
const authToken = require('./authToken.js');
const { validatePasswordPolicy } = require('./utils/passwordPolicy.js');
const { hashPassword, verifyPassword } = require('./utils/passwordHash.js');
const { createVerificationFields, validateEmailAddress, sendVerificationEmail } = require('./utils/emailVerification.js');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RETRYABLE_UNVERIFIED_STATUSES = new Set([
    'bounced_invalid',
    'bounced',
    'dropped',
    'blocked',
    'send_failed'
]);
const TERMINAL_EMAIL_DELIVERY_STATUSES = new Set([
    'delivered',
    'verified',
    'bounced',
    'bounced_invalid',
    'dropped',
    'blocked',
    'send_failed'
]);
const INVALID_EMAIL_REASON_PATTERN = /does not exist|invalid address|invalid mailbox|mailbox unavailable|no such user|user unknown|unknown user|unknown recipient|recipient rejected|address rejected|mailbox not found/i;
const GARAGE_IDS = new Set(['A', 'B', 'C', 'D', 'H', 'I']);
const TIME_SLOT_MINUTES = new Set([0, 30]);
const GARAGE_DEFAULT_ORG_COLOR = '#FFC904';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_BASIC_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6})$/;
const EVENT_IMAGE_UPLOAD_DIR = path.join(__dirname, 'uploads', 'events');

fs.mkdirSync(EVENT_IMAGE_UPLOAD_DIR, { recursive: true });

const eventImageUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
            callback(null, EVENT_IMAGE_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = ext || '.jpg';
            callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            callback(new Error('Only image files are allowed'));
            return;
        }

        callback(null, true);
    }
});

function getPublicBaseUrl(req) {
    const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = req.get('host');
    return host ? `${protocol}://${host}` : '';
}

function validationError(res, error, details = []) {
    res.status(400).json({
        error,
        details: Array.isArray(details) ? details : [String(details || '')].filter(Boolean)
    });
}

function hasOnlyAllowedKeys(payload, allowedKeys) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return false;
    }

    return Object.keys(payload).every((key) => allowedKeys.has(key));
}

function sanitizeString(value, { min = 0, max = 256, allowEmpty = false } = {}) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    if (!allowEmpty && normalized.length === 0) {
        return null;
    }

    if (normalized.length < min || normalized.length > max) {
        return null;
    }

    return normalized;
}

function sanitizeEmail(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized.length > 254 || !EMAIL_BASIC_PATTERN.test(normalized)) {
        return null;
    }

    return normalized;
}

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function isValidIsoDate(dateValue) {
    if (typeof dateValue !== 'string' || !ISO_DATE_PATTERN.test(dateValue)) {
        return false;
    }

    const parsed = Date.parse(`${dateValue}T00:00:00.000Z`);
    return Number.isFinite(parsed);
}

function normalizeGarageId(value) {
    const normalized = String(value || '').trim().toUpperCase();
    if (!GARAGE_IDS.has(normalized)) {
        return null;
    }

    return normalized;
}

function sanitizeGarageId(value) {
    return normalizeGarageId(value);
}

function sanitizeIsoDate(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    if (!isValidIsoDate(normalized)) {
        return null;
    }

    return normalized;
}

function timeStringToMinutes(timeValue) {
    if (timeValue === '24:00') {
        return 24 * 60;
    }

    const parts = String(timeValue || '').split(':');
    if (parts.length !== 2) {
        return NaN;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return NaN;
    }

    return hours * 60 + minutes;
}

function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalTimeKey(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

async function cleanupExpiredReservations(now = new Date()) {
    const todayKey = getLocalDateKey(now);
    const timeKey = getLocalTimeKey(now);

    const expirationFilter = {
        $or: [
            { date: { $lt: todayKey } },
            { date: todayKey, endTime: { $lte: timeKey } },
        ]
    };

    await Promise.all([
        Booking.deleteMany(expirationFilter),
        GarageEvent.deleteMany(expirationFilter),
    ]);
}

function isValidTimeValue(timeValue) {
    const minutes = timeStringToMinutes(timeValue);
    if (!Number.isFinite(minutes)) {
        return false;
    }

    if (minutes < 18 * 60 || minutes > 24 * 60) {
        return false;
    }

    const minuteChunk = minutes % 60;
    return TIME_SLOT_MINUTES.has(minuteChunk) || minutes === 24 * 60;
}

function timeRangesOverlap(startA, endA, startB, endB) {
    const aStart = timeStringToMinutes(startA);
    const aEnd = timeStringToMinutes(endA);
    const bStart = timeStringToMinutes(startB);
    const bEnd = timeStringToMinutes(endB);

    if (!Number.isFinite(aStart) || !Number.isFinite(aEnd) || !Number.isFinite(bStart) || !Number.isFinite(bEnd)) {
        return false;
    }

    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

async function countOverlappingReservations({
    garageId,
    floor,
    date,
    startTime,
    endTime,
    excludeEventId = null,
}) {
    const [bookingRows, eventRows] = await Promise.all([
        Booking.find({ garageId, floor, date }),
        GarageEvent.find({ garageId, floor, date }),
    ]);

    const bookingOverlapCount = bookingRows.filter((booking) => (
        timeRangesOverlap(booking.startTime, booking.endTime, startTime, endTime)
    )).length;

    const eventOverlapCount = eventRows.filter((eventRow) => {
        if (excludeEventId && String(eventRow._id) === String(excludeEventId)) {
            return false;
        }
        return timeRangesOverlap(eventRow.startTime, eventRow.endTime, startTime, endTime);
    }).length;

    return bookingOverlapCount + eventOverlapCount;
}

function getMemberRole(memberRow, ownerUserId) {
    const memberUserId = String(memberRow.userId);
    if (memberUserId === String(ownerUserId)) {
        return 'owner';
    }

    if (memberRow.permissions?.canManagePermissions || memberRow.permissions?.canEditOrganization || memberRow.permissions?.canInviteMembers) {
        return 'admin';
    }

    return 'member';
}

function roleToPermissions(role) {
    if (role === 'owner') {
        return {
            canInviteMembers: true,
            canRemoveMembers: true,
            canEditOrganization: true,
            canDeleteOrganization: true,
            canManagePermissions: true
        };
    }

    if (role === 'admin') {
        return {
            canInviteMembers: true,
            canRemoveMembers: true,
            canEditOrganization: true,
            canDeleteOrganization: false,
            canManagePermissions: false
        };
    }

    return {
        canInviteMembers: false,
        canRemoveMembers: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canManagePermissions: false
    };
}

function initialsFromText(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return 'NA';
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

async function mapOrganizationForFrontend(org) {
    const memberUsers = await AccountUser.find({
        _id: { $in: org.members.map((memberRow) => memberRow.userId) }
    });

    const memberLookup = new Map(memberUsers.map((memberUser) => [String(memberUser._id), memberUser]));

    const members = org.members.map((memberRow) => {
        const memberUser = memberLookup.get(String(memberRow.userId));
        const displayName = memberUser?.displayName || memberUser?.email || 'Member';
        return {
            id: String(memberRow.userId),
            name: displayName,
            email: memberUser?.email || '',
            avatar: initialsFromText(displayName),
            role: getMemberRole(memberRow, org.ownerUserId),
            joinedAt: (memberRow.joinedAt || org.createdAt || new Date()).toISOString().slice(0, 10)
        };
    });

    return {
        id: String(org._id),
        name: org.name,
        category: org.category,
        description: org.description || '',
        memberCount: members.length,
        members,
        color: org.color || GARAGE_DEFAULT_ORG_COLOR,
        initials: org.initials || initialsFromText(org.name)
    };
}

async function getUserOrganizationIds(userId) {
    const organizations = await OrganizationProfile.find({
        'members.userId': userId
    }).select({ _id: 1 });

    return organizations.map((org) => String(org._id));
}

function getBearerToken(req) {
    const authHeader = req.headers?.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }

    return req.body?.accessToken || req.body?.jwtToken || null;
}

async function getAuthedUser(req) {
    const rawToken = getBearerToken(req);
    if (!rawToken) {
        return { error: 'Missing token', status: 401 };
    }

    let payload;
    try {
        payload = authToken.verifyAuthToken(rawToken);
    }
    catch (e) {
        return { error: 'Invalid token', status: 401 };
    }

    const user = await AccountUser.findById(payload.sub);
    if (!user) {
        return { error: 'User not found', status: 401 };
    }

    return { user, payload };
}

function buildSafeUser(user) {
    return {
        id: String(user._id),
        email: user.email,
        isVerified: Boolean(user.isVerified),
        accountType: user.accountType,
        displayName: user.displayName,
        bio: user.bio || '',
        organizationId: user.organizationId ? String(user.organizationId) : null,
        memberRoleLabel: user.memberRoleLabel || '',
        notificationPrefs: user.notificationPrefs || {
            invites: true,
            events: true,
            bookings: true,
            digest: false
        }
    };
}

function createRegistrationStatusToken() {
    return crypto.randomBytes(18).toString('hex');
}

function buildRegisterStatus(user) {
    const status = user.emailDeliveryStatus || 'pending';

    return {
        status,
        message: user.emailDeliveryMessage || '',
        shouldStopPolling: TERMINAL_EMAIL_DELIVERY_STATUSES.has(status)
    };
}

exports.setApp = function (app) {
    app.post('/api/uploads/event-image', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (authed.user.accountType !== 'member') {
            res.status(403).json({ error: 'Only members can upload event images' });
            return;
        }

        eventImageUpload.single('image')(req, res, (error) => {
            if (error) {
                res.status(400).json({ error: error.message || 'Image upload failed' });
                return;
            }

            if (!req.file) {
                res.status(400).json({ error: 'No image file provided' });
                return;
            }

            const publicBaseUrl = getPublicBaseUrl(req);
            const imagePath = `/api/uploads/events/${encodeURIComponent(req.file.filename)}`;
            res.status(201).json({
                imageUrl: publicBaseUrl ? `${publicBaseUrl}${imagePath}` : imagePath
            });
        });
    });

    app.post('/api/auth/register', async (req, res) => {
        const allowedKeys = new Set(['email', 'password', 'displayName', 'accountType', 'memberRoleLabel']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid registration payload shape');
            return;
        }

        const {
            email,
            password,
            displayName,
            accountType,
            memberRoleLabel
        } = req.body;

        if (!email || !password || !displayName || !accountType || typeof password !== 'string') {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        if (!['fan', 'member'].includes(accountType)) {
            res.status(400).json({ error: 'Invalid account type' });
            return;
        }

        const policyResult = validatePasswordPolicy(password);
        if (!policyResult.isValid) {
            res.status(400).json({ error: 'Password does not meet policy', details: policyResult.errors });
            return;
        }

        const normalizedEmail = sanitizeEmail(email);
        if (!normalizedEmail) {
            validationError(res, 'Invalid email address');
            return;
        }

        const safeDisplayName = sanitizeString(displayName, { min: 2, max: 80 });
        if (!safeDisplayName) {
            validationError(res, 'Display name must be between 2 and 80 characters');
            return;
        }

        const safeMemberRoleLabel = sanitizeString(memberRoleLabel || '', { min: 0, max: 100, allowEmpty: true });
        if (safeMemberRoleLabel === null) {
            validationError(res, 'Member role label is too long');
            return;
        }

        const existing = await AccountUser.findOne({ email: normalizedEmail });
        if (existing) {
            if (!existing.isVerified && RETRYABLE_UNVERIFIED_STATUSES.has(existing.emailDeliveryStatus || '')) {
                await AccountUser.deleteOne({ _id: existing._id });
            }
            else {
            res.status(409).json({ error: 'Email already in use' });
            return;
            }
        }

        const emailValidation = await validateEmailAddress(normalizedEmail);
        if (emailValidation.checked && emailValidation.isInvalid) {
            res.status(400).json({
                error: emailValidation.message || 'That email address appears not to exist or receive email.'
            });
            return;
        }

        const passwordHash = await hashPassword(password);
        const verificationFields = createVerificationFields();
        const newUser = new AccountUser({
            email: normalizedEmail,
            passwordHash,
            accountType,
            displayName: safeDisplayName,
            memberRoleLabel: accountType === 'member' ? safeMemberRoleLabel : '',
            isVerified: false,
            verificationToken: verificationFields.verificationToken,
            verificationExpiresAt: verificationFields.verificationExpiresAt,
            emailDeliveryStatus: 'pending',
            emailDeliveryMessage: '',
            emailDeliveryUpdatedAt: new Date(),
            registrationStatusToken: createRegistrationStatusToken()
        });

        await newUser.save();

        void (async () => {
            try {
                await sendVerificationEmail(newUser.email, newUser.verificationToken);
            }
            catch (error) {
                console.error('Failed to send verification email during registration:', error);
                await AccountUser.findByIdAndUpdate(newUser._id, {
                    emailDeliveryStatus: 'send_failed',
                    emailDeliveryMessage: 'We could not send the verification email. Please check the address and try again.',
                    emailDeliveryUpdatedAt: new Date()
                });
            }
        })();

        res.status(201).json({
            message: 'Account created. Please check your email to verify your account before logging in. If you do not receive it soon, double-check the email address and your spam folder.',
            registrationStatusToken: newUser.registrationStatusToken,
            user: buildSafeUser(newUser)
        });
    });

    app.get('/api/auth/register-status', async (req, res) => {
        const registrationStatusToken = String(req.query?.token || '').trim();
        if (!registrationStatusToken) {
            res.status(400).json({ error: 'Missing registration status token' });
            return;
        }

        const user = await AccountUser.findOne({ registrationStatusToken });
        if (!user) {
            res.status(404).json({ error: 'Registration status not found' });
            return;
        }

        res.status(200).json(buildRegisterStatus(user));
    });

    app.post('/api/sendgrid/events', async (req, res) => {
        const expectedWebhookToken = String(process.env.SENDGRID_EVENT_WEBHOOK_TOKEN || '').trim();
        if (expectedWebhookToken) {
            const providedWebhookToken = String(req.query?.token || '').trim();
            if (providedWebhookToken !== expectedWebhookToken) {
                res.status(401).json({ error: 'Invalid webhook token' });
                return;
            }
        }

        const events = Array.isArray(req.body) ? req.body : [];
        for (const event of events) {
            const email = String(event?.email || '').toLowerCase().trim();
            if (!email) {
                continue;
            }

            const user = await AccountUser.findOne({ email, isVerified: false });
            if (!user) {
                continue;
            }

            const eventType = String(event?.event || '').toLowerCase().trim();
            if (eventType === 'processed' || eventType === 'deferred') {
                user.emailDeliveryStatus = eventType;
                user.emailDeliveryMessage = '';
                user.emailDeliveryUpdatedAt = new Date();
                await user.save();
                continue;
            }

            if (eventType === 'delivered') {
                user.emailDeliveryStatus = 'delivered';
                user.emailDeliveryMessage = '';
                user.emailDeliveryUpdatedAt = new Date();
                await user.save();
                continue;
            }

            if (eventType === 'bounce' || eventType === 'dropped' || eventType === 'blocked') {
                const bounceClassification = String(event?.bounce_classification || '').toLowerCase().trim();
                const statusCode = String(event?.status || '').trim();
                const reason = String(event?.reason || '').trim();
                const responseText = String(event?.response || '').trim();
                const isInvalidAddress = bounceClassification === 'invalid address'
                    || statusCode === '5.1.1'
                    || INVALID_EMAIL_REASON_PATTERN.test(reason)
                    || INVALID_EMAIL_REASON_PATTERN.test(responseText);

                user.emailDeliveryStatus = isInvalidAddress ? 'bounced_invalid' : eventType;
                user.emailDeliveryMessage = isInvalidAddress
                    ? 'That email address appears not to exist. Please double-check it for typos and try again.'
                    : 'We could not deliver the verification email. Please double-check the address and try again.';
                user.emailDeliveryUpdatedAt = new Date();
                await user.save();
            }
        }

        res.status(200).json({ received: events.length });
    });

    app.post('/api/auth/login', async (req, res) => {
        const allowedKeys = new Set(['email', 'password']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid login payload shape');
            return;
        }

        const { email, password } = req.body;

        if (!email || !password || typeof password !== 'string' || password.length > 256) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
        }

        const normalizedEmail = sanitizeEmail(email);
        if (!normalizedEmail) {
            validationError(res, 'Invalid email address');
            return;
        }

        const user = await AccountUser.findOne({ email: normalizedEmail });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);
        if (!passwordMatches) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        if (!user.isVerified) {
            res.status(403).json({ error: 'Please verify your email before logging in.' });
            return;
        }

        const accessToken = authToken.createAuthToken(user);
        res.status(200).json({
            accessToken,
            user: buildSafeUser(user)
        });
    });

    app.get('/api/auth/verify', async (req, res) => {
        const verificationToken = String(req.query?.token || '').trim();
        if (!verificationToken) {
            res.status(400).json({ error: 'Missing verification token' });
            return;
        }

        const user = await AccountUser.findOne({ verificationToken });
        if (!user) {
            res.status(404).json({ error: 'Verification link is invalid.' });
            return;
        }

        if (user.isVerified) {
            res.status(200).json({ message: 'Email is already verified.' });
            return;
        }

        if (!user.verificationExpiresAt || user.verificationExpiresAt.getTime() < Date.now()) {
            const replacementFields = createVerificationFields();
            user.verificationToken = replacementFields.verificationToken;
            user.verificationExpiresAt = replacementFields.verificationExpiresAt;
            user.emailDeliveryStatus = 'pending';
            user.emailDeliveryMessage = '';
            user.emailDeliveryUpdatedAt = new Date();
            await user.save();
            try {
                await sendVerificationEmail(user.email, user.verificationToken);
            }
            catch (error) {
                console.error('Failed to resend verification email:', error);
                res.status(500).json({ error: 'Unable to send a new verification email right now. Please try again later.' });
                return;
            }
            res.status(400).json({ error: 'Verification link expired. A new link has been generated and logged for development use.' });
            return;
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpiresAt = null;
        user.emailDeliveryStatus = 'verified';
        user.emailDeliveryMessage = '';
        user.emailDeliveryUpdatedAt = new Date();
        user.registrationStatusToken = null;
        await user.save();

        const accessToken = authToken.createAuthToken(user);
        res.status(200).json({
            message: 'Email verified successfully. Logging you in now.',
            accessToken,
            user: buildSafeUser(user)
        });
    });

    app.get('/api/auth/me', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const refreshedToken = authToken.createAuthToken(authed.user);
        res.status(200).json({
            accessToken: refreshedToken,
            user: buildSafeUser(authed.user)
        });
    });

    app.post('/api/org/create', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const user = authed.user;
        if (user.accountType !== 'member') {
            res.status(403).json({ error: 'Only member accounts can create organizations' });
            return;
        }

        const allowedKeys = new Set(['name', 'category', 'description', 'color']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid organization payload shape');
            return;
        }

        const normalizedName = sanitizeString(req.body?.name, { min: 2, max: 80 });
        const normalizedCategory = sanitizeString(req.body?.category, { min: 2, max: 50 });
        const normalizedDescription = sanitizeString(req.body?.description || '', { min: 0, max: 500, allowEmpty: true });
        const normalizedColor = sanitizeString(req.body?.color || GARAGE_DEFAULT_ORG_COLOR, { min: 7, max: 7 });

        if (!normalizedName || !normalizedCategory) {
            validationError(res, 'Organization name and category are required');
            return;
        }

        if (!normalizedColor || !HEX_COLOR_PATTERN.test(normalizedColor)) {
            validationError(res, 'Organization color must be a valid hex color');
            return;
        }

        const org = new OrganizationProfile({
            name: normalizedName,
            category: normalizedCategory,
            description: normalizedDescription || '',
            color: normalizedColor,
            initials: initialsFromText(normalizedName),
            ownerUserId: user._id,
            members: [
                {
                    userId: user._id,
                    permissions: {
                        canInviteMembers: true,
                        canRemoveMembers: true,
                        canEditOrganization: true,
                        canDeleteOrganization: true,
                        canManagePermissions: true
                    }
                }
            ]
        });

        await org.save();
        user.organizationId = org._id;
        await user.save();

        const refreshedToken = authToken.createAuthToken(user);
        res.status(201).json({
            accessToken: refreshedToken,
            organization: {
                id: String(org._id),
                name: org.name,
                category: org.category,
                ownerUserId: String(org.ownerUserId)
            }
        });
    });

    app.get('/api/org/invites', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!authed.user.organizationId) {
            res.status(200).json({ invites: [] });
            return;
        }

        const invites = await OrganizationInvite.find({ organizationId: authed.user.organizationId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            invites: invites.map((invite) => ({
                id: String(invite._id),
                invitedEmail: invite.invitedEmail,
                status: invite.status,
                expiresAt: invite.expiresAt,
                createdAt: invite.createdAt
            }))
        });
    });

    app.post('/api/org/invites', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const user = authed.user;
        if (user.accountType !== 'member' || !user.organizationId) {
            res.status(403).json({ error: 'Only organization members can invite' });
            return;
        }

        const org = await OrganizationProfile.findById(user.organizationId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const memberRow = org.members.find((m) => String(m.userId) === String(user._id));
        if (!memberRow || !memberRow.permissions?.canInviteMembers) {
            res.status(403).json({ error: 'Missing invite permission' });
            return;
        }

        const allowedKeys = new Set(['invitedEmail', 'role']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid invite payload shape');
            return;
        }

        const invitedEmail = sanitizeEmail(req.body?.invitedEmail);
        const role = ['admin', 'member'].includes(String(req.body.role || '').toLowerCase())
            ? String(req.body.role || '').toLowerCase()
            : 'member';
        if (!invitedEmail) {
            validationError(res, 'Invalid invited email address');
            return;
        }

        if (invitedEmail === user.email) {
            validationError(res, 'Cannot invite your own email');
            return;
        }

        const existingPending = await OrganizationInvite.findOne({
            organizationId: org._id,
            invitedEmail,
            status: 'pending'
        });
        if (existingPending) {
            res.status(409).json({ error: 'A pending invite already exists for this email' });
            return;
        }

        const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

        const invite = new OrganizationInvite({
            organizationId: org._id,
            invitedEmail,
            createdBy: user._id,
            role,
            status: 'pending',
            expiresAt
        });

        await invite.save();

        res.status(201).json({
            invite: {
                id: String(invite._id),
                invitedEmail: invite.invitedEmail,
                role: invite.role,
                status: invite.status,
                expiresAt: invite.expiresAt
            }
        });
    });

    app.post('/api/org/invites/accept', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const user = authed.user;
        if (user.accountType !== 'member') {
            res.status(403).json({ error: 'Only member accounts can accept invites' });
            return;
        }

        const inviteId = req.body?.inviteId;
        if (!inviteId) {
            res.status(400).json({ error: 'Missing inviteId' });
            return;
        }

        const invite = await OrganizationInvite.findById(inviteId);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }

        if (invite.status !== 'pending') {
            res.status(400).json({ error: 'Invite is not pending' });
            return;
        }

        if (invite.expiresAt.getTime() < Date.now()) {
            invite.status = 'expired';
            await invite.save();
            res.status(400).json({ error: 'Invite has expired' });
            return;
        }

        if (invite.invitedEmail !== user.email) {
            res.status(403).json({ error: 'Invite email does not match current user' });
            return;
        }

        const org = await OrganizationProfile.findById(invite.organizationId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const isAlreadyMember = org.members.some((m) => String(m.userId) === String(user._id));
        if (!isAlreadyMember) {
            const invitedRole = ['owner', 'admin', 'member'].includes(String(invite.role || '').toLowerCase())
                ? String(invite.role || '').toLowerCase()
                : 'member';

            org.members.push({
                userId: user._id,
                permissions: roleToPermissions(invitedRole)
            });
            await org.save();
        }

        user.organizationId = org._id;
        await user.save();

        invite.status = 'accepted';
        await invite.save();

        const refreshedToken = authToken.createAuthToken(user);
        res.status(200).json({
            accessToken: refreshedToken,
            organization: {
                id: String(org._id),
                name: org.name,
                category: org.category
            }
        });
    });

    app.patch('/api/auth/me', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const allowedKeys = new Set(['displayName', 'bio', 'memberRoleLabel', 'notificationPrefs']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid profile update payload shape');
            return;
        }

        const user = authed.user;
        const { displayName, bio, memberRoleLabel, notificationPrefs } = req.body || {};

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'displayName')) {
            const safeDisplayName = sanitizeString(displayName, { min: 2, max: 80 });
            if (!safeDisplayName) {
                validationError(res, 'Display name must be between 2 and 80 characters');
                return;
            }
            user.displayName = safeDisplayName;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'bio')) {
            const safeBio = sanitizeString(bio || '', { min: 0, max: 500, allowEmpty: true });
            if (safeBio === null) {
                validationError(res, 'Bio must be 500 characters or less');
                return;
            }
            user.bio = safeBio;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'memberRoleLabel')) {
            const safeMemberRole = sanitizeString(memberRoleLabel || '', { min: 0, max: 100, allowEmpty: true });
            if (safeMemberRole === null) {
                validationError(res, 'Member role label must be 100 characters or less');
                return;
            }
            user.memberRoleLabel = safeMemberRole;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'notificationPrefs')) {
            if (!notificationPrefs || typeof notificationPrefs !== 'object' || Array.isArray(notificationPrefs)) {
                validationError(res, 'Invalid notification preference payload');
                return;
            }

            const notificationKeys = Object.keys(notificationPrefs);
            const allowedNotifKeys = new Set(['invites', 'events', 'bookings', 'digest']);
            if (!notificationKeys.every((key) => allowedNotifKeys.has(key))) {
                validationError(res, 'Unknown notification preference fields');
                return;
            }

            user.notificationPrefs = {
                invites: Boolean(notificationPrefs.invites),
                events: Boolean(notificationPrefs.events),
                bookings: Boolean(notificationPrefs.bookings),
                digest: Boolean(notificationPrefs.digest)
            };
        }

        await user.save();

        const refreshedToken = authToken.createAuthToken(user);
        res.status(200).json({
            accessToken: refreshedToken,
            user: buildSafeUser(user)
        });
    });

    app.get('/api/organizations', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const organizations = await OrganizationProfile.find({
            'members.userId': authed.user._id
        });
        const mapped = [];
        for (const org of organizations) {
            mapped.push(await mapOrganizationForFrontend(org));
        }

        res.status(200).json(mapped);
    });

    app.get('/api/organizations/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid organization id');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const isMember = org.members.some((memberRow) => String(memberRow.userId) === String(authed.user._id));
        if (!isMember) {
            res.status(403).json({ error: 'Not a member of this organization' });
            return;
        }

        res.status(200).json(await mapOrganizationForFrontend(org));
    });

    app.patch('/api/organizations/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid organization id');
            return;
        }

        const allowedKeys = new Set(['name', 'category', 'description', 'color']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid organization update payload shape');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const memberRow = org.members.find((member) => String(member.userId) === String(authed.user._id));
        if (!memberRow || !memberRow.permissions?.canEditOrganization) {
            res.status(403).json({ error: 'Missing organization edit permission' });
            return;
        }

        const { name, category, description, color } = req.body || {};
        if (typeof name === 'string' && name.trim()) {
            const safeName = sanitizeString(name, { min: 2, max: 80 });
            if (!safeName) {
                validationError(res, 'Organization name must be between 2 and 80 characters');
                return;
            }
            org.name = safeName;
            org.initials = initialsFromText(org.name);
        }

        if (typeof category === 'string' && category.trim()) {
            const safeCategory = sanitizeString(category, { min: 2, max: 50 });
            if (!safeCategory) {
                validationError(res, 'Organization category is invalid');
                return;
            }
            org.category = safeCategory;
        }

        if (typeof description === 'string') {
            org.description = description.trim().slice(0, 500);
        }

        if (typeof color === 'string' && color.trim()) {
            const safeColor = sanitizeString(color, { min: 7, max: 7 });
            if (!safeColor || !HEX_COLOR_PATTERN.test(safeColor)) {
                validationError(res, 'Organization color must be a valid hex color');
                return;
            }
            org.color = safeColor;
        }

        await org.save();
        res.status(200).json(await mapOrganizationForFrontend(org));
    });

    app.post('/api/organizations/:id/invite', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid organization id');
            return;
        }

        const allowedKeys = new Set(['email', 'role']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid invite payload shape');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const memberRow = org.members.find((member) => String(member.userId) === String(authed.user._id));
        if (!memberRow || !memberRow.permissions?.canInviteMembers) {
            res.status(403).json({ error: 'Missing invite permission' });
            return;
        }

        const invitedEmail = sanitizeEmail(req.body?.email);
        const role = ['admin', 'member'].includes(String(req.body?.role || '').toLowerCase())
            ? String(req.body?.role || '').toLowerCase()
            : 'member';
        if (!invitedEmail) {
            validationError(res, 'Invalid invite email');
            return;
        }

        if (invitedEmail === authed.user.email) {
            validationError(res, 'Cannot invite your own email');
            return;
        }

        const existingPending = await OrganizationInvite.findOne({
            organizationId: org._id,
            invitedEmail,
            status: 'pending'
        });
        if (existingPending) {
            res.status(409).json({ error: 'A pending invite already exists for this email' });
            return;
        }

        const invite = new OrganizationInvite({
            organizationId: org._id,
            invitedEmail,
            createdBy: authed.user._id,
            role,
            status: 'pending',
            expiresAt: new Date(Date.now() + INVITE_TTL_MS)
        });

        await invite.save();
        res.status(201).json({ id: String(invite._id) });
    });

    app.patch('/api/organizations/:id/members/:memberId', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.memberId)) {
            validationError(res, 'Invalid organization or member id');
            return;
        }

        const allowedKeys = new Set(['role']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid member role update payload shape');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const actor = org.members.find((member) => String(member.userId) === String(authed.user._id));
        if (!actor || !actor.permissions?.canManagePermissions) {
            res.status(403).json({ error: 'Only owners can change member roles' });
            return;
        }

        const memberToEdit = org.members.find((member) => String(member.userId) === String(req.params.memberId));
        if (!memberToEdit) {
            res.status(404).json({ error: 'Member not found' });
            return;
        }

        if (String(memberToEdit.userId) === String(org.ownerUserId)) {
            res.status(400).json({ error: 'Owner role cannot be changed here' });
            return;
        }

        const nextRole = ['admin', 'member'].includes(String(req.body?.role || '').toLowerCase())
            ? String(req.body?.role || '').toLowerCase()
            : null;
        if (!nextRole) {
            res.status(400).json({ error: 'Invalid role value' });
            return;
        }

        memberToEdit.permissions = roleToPermissions(nextRole);
        await org.save();
        res.status(200).json(await mapOrganizationForFrontend(org));
    });

    app.delete('/api/organizations/:id/members/:memberId', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.memberId)) {
            validationError(res, 'Invalid organization or member id');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const actor = org.members.find((member) => String(member.userId) === String(authed.user._id));
        if (!actor || !actor.permissions?.canRemoveMembers) {
            res.status(403).json({ error: 'Missing member removal permission' });
            return;
        }

        if (String(req.params.memberId) === String(org.ownerUserId)) {
            res.status(400).json({ error: 'Owner cannot be removed' });
            return;
        }

        org.members = org.members.filter((member) => String(member.userId) !== String(req.params.memberId));
        await org.save();

        const targetUser = await AccountUser.findById(req.params.memberId);
        if (targetUser) {
            const remainingOrgIds = await getUserOrganizationIds(targetUser._id);
            targetUser.organizationId = remainingOrgIds.length > 0 ? remainingOrgIds[0] : null;
            await targetUser.save();
        }

        res.status(204).send();
    });

    app.delete('/api/organizations/:id/leave', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid organization id');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        if (String(org.ownerUserId) === String(authed.user._id)) {
            res.status(400).json({ error: 'Owner must transfer ownership before leaving organization' });
            return;
        }

        org.members = org.members.filter((member) => String(member.userId) !== String(authed.user._id));
        await org.save();

        const remainingOrgIds = await getUserOrganizationIds(authed.user._id);
        authed.user.organizationId = remainingOrgIds.length > 0 ? remainingOrgIds[0] : null;
        await authed.user.save();

        const refreshedUser = await AccountUser.findById(authed.user._id);
        const refreshedToken = authToken.createAuthToken(refreshedUser || authed.user);
        res.status(200).json({ accessToken: refreshedToken });
    });

    app.delete('/api/organizations/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid organization id');
            return;
        }

        const org = await OrganizationProfile.findById(req.params.id);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const actor = org.members.find((member) => String(member.userId) === String(authed.user._id));
        if (!actor || !actor.permissions?.canDeleteOrganization) {
            res.status(403).json({ error: 'Only organization owners can delete an organization' });
            return;
        }

        const memberIds = org.members.map((member) => String(member.userId));

        await Promise.all([
            OrganizationInvite.deleteMany({ organizationId: org._id }),
            Booking.deleteMany({ orgId: org._id }),
            GarageEvent.deleteMany({ orgId: org._id }),
            org.deleteOne(),
        ]);

        for (const memberId of memberIds) {
            const memberUser = await AccountUser.findById(memberId);
            if (!memberUser) {
                continue;
            }

            const remainingOrgIds = await getUserOrganizationIds(memberUser._id);
            memberUser.organizationId = remainingOrgIds.length > 0 ? remainingOrgIds[0] : null;
            await memberUser.save();
        }

        const refreshedToken = authToken.createAuthToken(authed.user);
        res.status(200).json({ accessToken: refreshedToken });
    });

    app.get('/api/invites', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const invites = await OrganizationInvite.find({
            invitedEmail: authed.user.email,
            status: 'pending'
        }).sort({ createdAt: -1 });

        const orgIds = invites.map((invite) => invite.organizationId);
        const orgs = await OrganizationProfile.find({ _id: { $in: orgIds } });
        const orgLookup = new Map(orgs.map((org) => [String(org._id), org]));

        const sentByIds = invites.map((invite) => invite.createdBy);
        const senders = await AccountUser.find({ _id: { $in: sentByIds } });
        const senderLookup = new Map(senders.map((sender) => [String(sender._id), sender]));

        res.status(200).json(invites.map((invite) => {
            const org = orgLookup.get(String(invite.organizationId));
            const sender = senderLookup.get(String(invite.createdBy));
            return {
                id: String(invite._id),
                orgName: org?.name || 'Organization',
                orgColor: org?.color || GARAGE_DEFAULT_ORG_COLOR,
                sentBy: sender?.displayName || sender?.email || 'Unknown sender',
                sentAt: invite.createdAt,
                role: invite.role === 'admin' ? 'Admin' : 'Member'
            };
        }));
    });

    app.post('/api/invites/:id/accept', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid invite id');
            return;
        }

        const user = authed.user;
        if (user.accountType !== 'member') {
            res.status(403).json({ error: 'Only member accounts can accept invites' });
            return;
        }

        const invite = await OrganizationInvite.findById(req.params.id);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }

        if (invite.status !== 'pending') {
            res.status(400).json({ error: 'Invite is not pending' });
            return;
        }

        if (invite.expiresAt.getTime() < Date.now()) {
            invite.status = 'expired';
            await invite.save();
            res.status(400).json({ error: 'Invite has expired' });
            return;
        }

        if (invite.invitedEmail !== user.email) {
            res.status(403).json({ error: 'Invite email does not match current user' });
            return;
        }

        const org = await OrganizationProfile.findById(invite.organizationId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const isAlreadyMember = org.members.some((member) => String(member.userId) === String(user._id));
        if (!isAlreadyMember) {
            const invitedRole = ['owner', 'admin', 'member'].includes(String(invite.role || '').toLowerCase())
                ? String(invite.role || '').toLowerCase()
                : 'member';
            org.members.push({
                userId: user._id,
                permissions: roleToPermissions(invitedRole)
            });
            await org.save();
        }

        user.organizationId = org._id;
        await user.save();

        invite.status = 'accepted';
        await invite.save();

        const refreshedToken = authToken.createAuthToken(user);
        res.status(200).json({
            accessToken: refreshedToken,
            organization: {
                id: String(org._id),
                name: org.name,
                category: org.category
            }
        });
    });

    app.post('/api/invites/:id/decline', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid invite id');
            return;
        }

        const invite = await OrganizationInvite.findById(req.params.id);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }

        if (invite.invitedEmail !== authed.user.email) {
            res.status(403).json({ error: 'Invite does not belong to current user' });
            return;
        }

        invite.status = 'revoked';
        await invite.save();
        res.status(200).json({ ok: true });
    });

    app.get('/api/bookings', async (req, res) => {
        await cleanupExpiredReservations();

        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const garageId = sanitizeGarageId(req.query?.garageId);
        const date = sanitizeIsoDate(req.query?.date);
        if (!garageId || !date) {
            validationError(res, 'garageId and date are required and must be valid');
            return;
        }

        const [bookingRows, eventRows] = await Promise.all([
            Booking.find({ garageId, date }),
            GarageEvent.find({ garageId, date }),
        ]);

        const mappedBookings = bookingRows.map((booking) => ({
            id: String(booking._id),
            garageId: booking.garageId,
            floor: booking.floor,
            startTime: booking.startTime,
            endTime: booking.endTime,
            groupName: booking.groupName,
            orgId: String(booking.orgId),
            date: booking.date,
            isWeekly: Boolean(booking.isWeekly),
            isOwn: String(booking.createdBy) === String(authed.user._id)
        }));

        const mappedEvents = eventRows.map((eventRow) => ({
            id: `event:${String(eventRow._id)}`,
            garageId: eventRow.garageId,
            floor: eventRow.floor,
            startTime: eventRow.startTime,
            endTime: eventRow.endTime,
            groupName: eventRow.orgName,
            orgId: String(eventRow.orgId),
            date: eventRow.date,
            isWeekly: false,
            isOwn: false,
        }));

        const merged = [...mappedBookings, ...mappedEvents]
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        res.status(200).json(merged);
    });

    app.get('/api/bookings/mine', async (req, res) => {
        await cleanupExpiredReservations();

        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const memberOrgIds = await getUserOrganizationIds(authed.user._id);
        if (memberOrgIds.length === 0) {
            res.status(200).json([]);
            return;
        }

        const bookingRows = await Booking.find({ orgId: { $in: memberOrgIds } }).sort({ date: 1, startTime: 1 });
        res.status(200).json(bookingRows.map((booking) => ({
            id: String(booking._id),
            garageId: booking.garageId,
            floor: booking.floor,
            startTime: booking.startTime,
            endTime: booking.endTime,
            groupName: booking.groupName,
            orgId: String(booking.orgId),
            date: booking.date,
            isWeekly: Boolean(booking.isWeekly),
            isOwn: true
        })));
    });

    app.post('/api/bookings', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (authed.user.accountType !== 'member') {
            res.status(403).json({ error: 'Only members can create bookings' });
            return;
        }

        const allowedKeys = new Set(['garageId', 'floor', 'startTime', 'endTime', 'date', 'isWeekly', 'orgId']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid booking payload shape');
            return;
        }

        const { garageId, floor, startTime, endTime, date, isWeekly, orgId } = req.body || {};
        const normalizedGarageId = sanitizeGarageId(garageId);
        const normalizedDate = sanitizeIsoDate(date);
        const normalizedFloor = Number(floor);

        if (!normalizedGarageId || ![1, 2, 3, 4].includes(normalizedFloor)) {
            validationError(res, 'Invalid garage or floor');
            return;
        }

        if (!isValidTimeValue(startTime) || !isValidTimeValue(endTime)) {
            validationError(res, 'Invalid booking time range');
            return;
        }

        const startMinutes = timeStringToMinutes(startTime);
        const endMinutes = timeStringToMinutes(endTime);
        if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || startMinutes >= endMinutes) {
            validationError(res, 'Booking end time must be after start time');
            return;
        }

        const dateMillis = Date.parse(`${normalizedDate}T00:00:00.000Z`);

        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        if (dateMillis - Date.now() > ninetyDaysMs) {
            res.status(400).json({ error: 'Bookings can only be made up to 3 months ahead' });
            return;
        }

        if (orgId && !isValidObjectId(orgId)) {
            validationError(res, 'Invalid organization id in booking payload');
            return;
        }

        const selectedOrgId = orgId || authed.user.organizationId;
        if (!selectedOrgId || !isValidObjectId(selectedOrgId)) {
            validationError(res, 'Booking organization is required');
            return;
        }

        const org = await OrganizationProfile.findById(selectedOrgId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const isMember = org.members.some((member) => String(member.userId) === String(authed.user._id));
        if (!isMember) {
            res.status(403).json({ error: 'You are not a member of the selected organization' });
            return;
        }

        const overlappingCount = await countOverlappingReservations({
            garageId: normalizedGarageId,
            floor: normalizedFloor,
            date: normalizedDate,
            startTime: String(startTime),
            endTime: String(endTime),
        });

        if (overlappingCount >= 2) {
            res.status(409).json({ error: 'This floor is already at capacity for the selected time' });
            return;
        }

        const booking = new Booking({
            garageId: normalizedGarageId,
            floor: normalizedFloor,
            startTime: String(startTime),
            endTime: String(endTime),
            groupName: org.name,
            orgId: org._id,
            date: normalizedDate,
            isWeekly: Boolean(isWeekly),
            createdBy: authed.user._id
        });

        await booking.save();
        res.status(201).json({ id: String(booking._id) });
    });

    app.delete('/api/bookings/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid booking id');
            return;
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }

        const bookingOrg = await OrganizationProfile.findById(booking.orgId);
        const isOrgMember = bookingOrg
            ? bookingOrg.members.some((member) => String(member.userId) === String(authed.user._id))
            : false;

        if (String(booking.createdBy) !== String(authed.user._id) && !isOrgMember) {
            res.status(403).json({ error: 'Not allowed to cancel this booking' });
            return;
        }

        const eventTime = Date.parse(`${booking.date}T${booking.startTime}:00.000Z`);
        const oneHourMs = 60 * 60 * 1000;
        if (Number.isFinite(eventTime) && eventTime - Date.now() < oneHourMs) {
            res.status(400).json({ error: 'Bookings can only be cancelled up to 1 hour before start time' });
            return;
        }

        await booking.deleteOne();
        res.status(204).send();
    });

    app.get('/api/events', async (req, res) => {
        await cleanupExpiredReservations();

        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        const query = authed.user.accountType === 'fan'
            ? { isPublic: true }
            : {};

        const events = await GarageEvent.find(query).sort({ date: 1, startTime: 1 });
        res.status(200).json(events.map((eventRow) => ({
            id: String(eventRow._id),
            title: eventRow.title,
            orgName: eventRow.orgName,
            orgId: String(eventRow.orgId),
            orgColor: eventRow.orgColor,
            garageId: eventRow.garageId,
            floor: eventRow.floor,
            date: eventRow.date,
            startTime: eventRow.startTime,
            endTime: eventRow.endTime,
            description: eventRow.description,
            category: eventRow.category,
            coverImage: eventRow.coverImage,
            attendees: eventRow.attendees,
            isPublic: Boolean(eventRow.isPublic)
        })));
    });

    app.get('/api/events/:id', async (req, res) => {
        await cleanupExpiredReservations();

        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid event id');
            return;
        }

        const eventRow = await GarageEvent.findById(req.params.id);
        if (!eventRow) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        if (authed.user.accountType === 'fan' && !eventRow.isPublic) {
            res.status(403).json({ error: 'This event is members-only' });
            return;
        }

        res.status(200).json({
            id: String(eventRow._id),
            title: eventRow.title,
            orgName: eventRow.orgName,
            orgId: String(eventRow.orgId),
            orgColor: eventRow.orgColor,
            garageId: eventRow.garageId,
            floor: eventRow.floor,
            date: eventRow.date,
            startTime: eventRow.startTime,
            endTime: eventRow.endTime,
            description: eventRow.description,
            category: eventRow.category,
            coverImage: eventRow.coverImage,
            attendees: eventRow.attendees,
            isPublic: Boolean(eventRow.isPublic)
        });
    });

    app.post('/api/events', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (authed.user.accountType !== 'member') {
            res.status(403).json({ error: 'Only members can create events' });
            return;
        }

        const allowedKeys = new Set([
            'title',
            'description',
            'category',
            'date',
            'startTime',
            'endTime',
            'garageId',
            'floor',
            'isPublic',
            'coverImage',
            'orgId'
        ]);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid event payload shape');
            return;
        }

        const {
            title,
            description,
            category,
            date,
            startTime,
            endTime,
            garageId,
            floor,
            isPublic,
            coverImage,
            orgId
        } = req.body || {};

        const selectedOrgId = orgId || authed.user.organizationId;
        if (!selectedOrgId || !isValidObjectId(selectedOrgId)) {
            validationError(res, 'Event organization is required');
            return;
        }

        const org = await OrganizationProfile.findById(selectedOrgId);
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }

        const isMember = org.members.some((member) => String(member.userId) === String(authed.user._id));
        if (!isMember) {
            res.status(403).json({ error: 'You are not a member of the selected organization' });
            return;
        }

        const safeTitle = sanitizeString(title, { min: 2, max: 120 });
        const safeDescription = sanitizeString(description, { min: 0, max: 2000 }) || '';
        const safeCategory = sanitizeString(category, { min: 0, max: 60 }) || 'Other';
        const safeDate = sanitizeIsoDate(date);
        const safeGarageId = sanitizeGarageId(garageId);
        const safeFloor = Number(floor);
        const safeCoverImage = sanitizeString(coverImage, { min: 0, max: 2048 }) || '';

        if (!safeTitle || !safeDate || !safeGarageId || ![1, 2, 3, 4].includes(safeFloor) || !isValidTimeValue(startTime) || !isValidTimeValue(endTime)) {
            validationError(res, 'Missing or invalid required event fields');
            return;
        }

        const eventStartMinutes = timeStringToMinutes(startTime);
        const eventEndMinutes = timeStringToMinutes(endTime);
        if (!Number.isFinite(eventStartMinutes) || !Number.isFinite(eventEndMinutes) || eventStartMinutes >= eventEndMinutes) {
            validationError(res, 'Event end time must be after start time');
            return;
        }

        const overlappingCount = await countOverlappingReservations({
            garageId: safeGarageId,
            floor: safeFloor,
            date: safeDate,
            startTime: String(startTime),
            endTime: String(endTime),
        });

        if (overlappingCount >= 2) {
            res.status(409).json({ error: 'This floor is already at capacity for the selected time' });
            return;
        }

        const eventRow = new GarageEvent({
            title: safeTitle,
            orgName: org.name,
            orgId: org._id,
            orgColor: org.color || GARAGE_DEFAULT_ORG_COLOR,
            garageId: safeGarageId,
            floor: safeFloor,
            date: safeDate,
            startTime: String(startTime),
            endTime: String(endTime),
            description: safeDescription,
            category: safeCategory,
            coverImage: safeCoverImage,
            attendees: 0,
            isPublic: Boolean(isPublic),
            createdBy: authed.user._id
        });

        await eventRow.save();
        res.status(201).json({ id: String(eventRow._id) });
    });

    app.patch('/api/events/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid event id');
            return;
        }

        const allowedKeys = new Set(['title', 'description', 'category', 'date', 'startTime', 'endTime', 'garageId', 'floor', 'coverImage', 'isPublic']);
        if (!hasOnlyAllowedKeys(req.body, allowedKeys)) {
            validationError(res, 'Invalid event update payload shape');
            return;
        }

        const eventRow = await GarageEvent.findById(req.params.id);
        if (!eventRow) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        const owningOrg = await OrganizationProfile.findById(eventRow.orgId);
        const canEdit = owningOrg && owningOrg.members.some((member) => String(member.userId) === String(authed.user._id));
        if (!canEdit) {
            res.status(403).json({ error: 'Cannot edit events outside your organization' });
            return;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'title')) {
            const safeTitle = sanitizeString(req.body.title, { min: 2, max: 120 });
            if (!safeTitle) {
                validationError(res, 'Event title must be between 2 and 120 characters');
                return;
            }
            eventRow.title = safeTitle;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'description')) {
            const safeDescription = sanitizeString(req.body.description, { min: 0, max: 2000 }) || '';
            eventRow.description = safeDescription;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'category')) {
            const safeCategory = sanitizeString(req.body.category, { min: 0, max: 60 }) || 'Other';
            eventRow.category = safeCategory;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'date')) {
            const safeDate = sanitizeIsoDate(req.body.date);
            if (!safeDate) {
                validationError(res, 'Invalid event date');
                return;
            }
            eventRow.date = safeDate;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'startTime')) {
            if (!isValidTimeValue(req.body.startTime)) {
                validationError(res, 'Invalid event start time');
                return;
            }
            eventRow.startTime = String(req.body.startTime);
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'endTime')) {
            if (!isValidTimeValue(req.body.endTime)) {
                validationError(res, 'Invalid event end time');
                return;
            }
            eventRow.endTime = String(req.body.endTime);
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'garageId')) {
            const safeGarageId = sanitizeGarageId(req.body.garageId);
            if (!safeGarageId) {
                validationError(res, 'Invalid event garage id');
                return;
            }
            eventRow.garageId = safeGarageId;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'floor')) {
            const safeFloor = Number(req.body.floor);
            if (![1, 2, 3, 4].includes(safeFloor)) {
                validationError(res, 'Invalid event floor');
                return;
            }
            eventRow.floor = safeFloor;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'coverImage')) {
            const safeCoverImage = sanitizeString(req.body.coverImage, { min: 0, max: 2048 }) || '';
            eventRow.coverImage = safeCoverImage;
        }

        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'isPublic')) {
            eventRow.isPublic = Boolean(req.body.isPublic);
        }

        const updatedStartMinutes = timeStringToMinutes(eventRow.startTime);
        const updatedEndMinutes = timeStringToMinutes(eventRow.endTime);
        if (!Number.isFinite(updatedStartMinutes) || !Number.isFinite(updatedEndMinutes) || updatedStartMinutes >= updatedEndMinutes) {
            validationError(res, 'Event end time must be after start time');
            return;
        }

        const overlappingCount = await countOverlappingReservations({
            garageId: eventRow.garageId,
            floor: eventRow.floor,
            date: eventRow.date,
            startTime: eventRow.startTime,
            endTime: eventRow.endTime,
            excludeEventId: eventRow._id,
        });

        if (overlappingCount >= 2) {
            res.status(409).json({ error: 'This floor is already at capacity for the selected time' });
            return;
        }

        await eventRow.save();
        res.status(200).json({ id: String(eventRow._id) });
    });

    app.delete('/api/events/:id', async (req, res) => {
        const authed = await getAuthedUser(req);
        if (authed.error) {
            res.status(authed.status).json({ error: authed.error });
            return;
        }

        if (!isValidObjectId(req.params.id)) {
            validationError(res, 'Invalid event id');
            return;
        }

        const eventRow = await GarageEvent.findById(req.params.id);
        if (!eventRow) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }

        const owningOrg = await OrganizationProfile.findById(eventRow.orgId);
        const canDelete = owningOrg && owningOrg.members.some((member) => String(member.userId) === String(authed.user._id));
        if (!canDelete) {
            res.status(403).json({ error: 'Cannot delete events outside your organization' });
            return;
        }

        await eventRow.deleteOne();
        res.status(204).send();
    });
}
