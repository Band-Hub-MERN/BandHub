require('express');
const AccountUser = require('./models/accountUser.js');
const OrganizationProfile = require('./models/organizationProfile.js');
const OrganizationInvite = require('./models/organizationInvite.js');
const authToken = require('./authToken.js');
const { validatePasswordPolicy } = require('./utils/passwordPolicy.js');
const { hashPassword, verifyPassword } = require('./utils/passwordHash.js');
const { createVerificationFields, sendVerificationEmail } = require('./utils/emailVerification.js');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
        organizationId: user.organizationId ? String(user.organizationId) : null,
        memberRoleLabel: user.memberRoleLabel || ''
    };
}

exports.setApp = function (app) {
    app.post('/api/auth/register', async (req, res) => {
        const {
            email,
            password,
            displayName,
            accountType,
            memberRoleLabel
        } = req.body;

        if (!email || !password || !displayName || !accountType) {
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

        const normalizedEmail = String(email).toLowerCase().trim();
        const existing = await AccountUser.findOne({ email: normalizedEmail });
        if (existing) {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const passwordHash = await hashPassword(password);
        const verificationFields = createVerificationFields();
        const newUser = new AccountUser({
            email: normalizedEmail,
            passwordHash,
            accountType,
            displayName: String(displayName).trim(),
            memberRoleLabel: accountType === 'member' ? String(memberRoleLabel || '') : '',
            isVerified: false,
            verificationToken: verificationFields.verificationToken,
            verificationExpiresAt: verificationFields.verificationExpiresAt
        });

        await newUser.save();

        try {
            await sendVerificationEmail(newUser.email, newUser.verificationToken);
        }
        catch (error) {
            await AccountUser.deleteOne({ _id: newUser._id });
            res.status(500).json({ error: 'Unable to send verification email. Please try registering again.' });
            return;
        }

        res.status(201).json({
            message: 'Account created. Please check your email to verify your account before logging in.',
            user: buildSafeUser(newUser)
        });
    });

    app.post('/api/auth/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
        }

        const normalizedEmail = String(email).toLowerCase().trim();
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
            await user.save();
            try {
                await sendVerificationEmail(user.email, user.verificationToken);
            }
            catch (error) {
                res.status(500).json({ error: 'Unable to send a new verification email right now. Please try again later.' });
                return;
            }
            res.status(400).json({ error: 'Verification link expired. A new link has been generated and logged for development use.' });
            return;
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationExpiresAt = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
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

        if (user.organizationId) {
            res.status(409).json({ error: 'User is already in an organization' });
            return;
        }

        const { name, category } = req.body;
        if (!name || !category) {
            res.status(400).json({ error: 'Missing organization name or category' });
            return;
        }

        const org = new OrganizationProfile({
            name: String(name).trim(),
            category: String(category).trim(),
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

        const invitedEmail = String(req.body.invitedEmail || '').toLowerCase().trim();
        if (!invitedEmail) {
            res.status(400).json({ error: 'Missing invitedEmail' });
            return;
        }

        const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

        const invite = new OrganizationInvite({
            organizationId: org._id,
            invitedEmail,
            createdBy: user._id,
            status: 'pending',
            expiresAt
        });

        await invite.save();

        res.status(201).json({
            invite: {
                id: String(invite._id),
                invitedEmail: invite.invitedEmail,
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

        if (user.organizationId) {
            res.status(409).json({ error: 'User already belongs to an organization' });
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
            org.members.push({
                userId: user._id,
                permissions: {
                    canInviteMembers: false,
                    canRemoveMembers: false,
                    canEditOrganization: false,
                    canDeleteOrganization: false,
                    canManagePermissions: false
                }
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
}
