import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
import '../../models/user.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _displayNameController;
  late TextEditingController _bioController;

  bool _isDirty = false;
  bool _isSaving = false;
  bool _isTogglingNotif = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().currentUser;
    _displayNameController =
        TextEditingController(text: user?.displayName ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');

    _displayNameController.addListener(_onFieldChanged);
    _bioController.addListener(_onFieldChanged);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _onFieldChanged() {
    final user = context.read<AuthProvider>().currentUser;
    final dirty = _displayNameController.text != (user?.displayName ?? '') ||
        _bioController.text != (user?.bio ?? '');
    if (dirty != _isDirty) setState(() => _isDirty = dirty);
  }

  Future<void> _saveProfile() async {
    final name = _displayNameController.text.trim();
    if (name.isEmpty) {
      _showSnack('Display name cannot be empty.');
      return;
    }

    setState(() => _isSaving = true);
    try {
      await context.read<AuthProvider>().updateUser({
        'displayName': name,
        'bio': _bioController.text.trim(),
      });
      setState(() => _isDirty = false);
      _showSnack('Profile updated.');
    } catch (_) {
      _showSnack('Could not save. Please try again.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _toggleNotif(String key, bool value) async {
    if (_isTogglingNotif) return;
    setState(() => _isTogglingNotif = true);

    final user = context.read<AuthProvider>().currentUser;
    if (user == null) return;

    final current = user.notificationPrefs;
    final updated = {
      'invites': current.invites,
      'events': current.events,
      'bookings': current.bookings,
      'digest': current.digest,
      key: value,
    };

    try {
      await context.read<AuthProvider>().updateUser({'notificationPrefs': updated});
    } catch (_) {
      _showSnack('Could not update notification setting.');
    } finally {
      if (mounted) setState(() => _isTogglingNotif = false);
    }
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: surfaceCard,
        title: const Text('Sign Out', style: headingSmall),
        content: const Text(
          'Are you sure you want to sign out?',
          style: bodySecondary,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child:
                const Text('Sign Out', style: TextStyle(color: errorRed)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    context.read<EventProvider>().clearAttended();
    await context.read<AuthProvider>().logout();
    if (mounted) context.go(AppRoutes.login);
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      body: SafeArea(
        child: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            final user = auth.currentUser;
            if (user == null) return const SizedBox.shrink();

            return ListView(
              padding: const EdgeInsets.only(bottom: 40),
              children: [
                _buildHeader(user),
                const SizedBox(height: 24),
                _buildProfileSection(),
                const SizedBox(height: 8),
                _buildNotificationsSection(user),
                const SizedBox(height: 8),
                _buildAccountSection(user),
                const SizedBox(height: 24),
                _buildSignOut(),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader(User user) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          _buildAvatar(user),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'GARAGE JAM',
                  style: TextStyle(
                    color: ucfGold,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                  ),
                ),
                Text(
                  user.displayName,
                  style: headingMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${user.email} · ${user.isMember ? 'Member' : 'Fan'}',
                  style: bodySecondary,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(User user) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: surfaceDark,
        shape: BoxShape.circle,
        border: Border.all(color: ucfGold, width: 2),
      ),
      child: Center(
        child: Text(
          user.initials,
          style: const TextStyle(
            color: ucfGold,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildProfileSection() {
    return _buildSection(
      title: 'Profile',
      children: [
        _buildTextField(
          label: 'Display Name',
          controller: _displayNameController,
          maxLines: 1,
        ),
        const SizedBox(height: 12),
        _buildTextField(
          label: 'Bio',
          controller: _bioController,
          maxLines: 3,
          hint: 'Tell people a little about yourself...',
        ),
        if (_isDirty) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveProfile,
              child: _isSaving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: ucfBlack,
                      ),
                    )
                  : const Text('Save Changes'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildNotificationsSection(User user) {
    final prefs = user.notificationPrefs;
    return _buildSection(
      title: 'Notifications',
      children: [
        _buildToggleRow(
          label: 'Events',
          subtitle: 'New events from orgs you follow',
          value: prefs.events,
          onChanged: (v) => _toggleNotif('events', v),
        ),
        _buildDivider(),
        _buildToggleRow(
          label: 'Invites',
          subtitle: 'Organization invitations',
          value: prefs.invites,
          onChanged: (v) => _toggleNotif('invites', v),
        ),
        if (user.isMember) ...[
          _buildDivider(),
          _buildToggleRow(
            label: 'Bookings',
            subtitle: 'Practice booking reminders',
            value: prefs.bookings,
            onChanged: (v) => _toggleNotif('bookings', v),
          ),
        ],
        _buildDivider(),
        _buildToggleRow(
          label: 'Weekly Digest',
          subtitle: 'Summary of upcoming events',
          value: prefs.digest,
          onChanged: (v) => _toggleNotif('digest', v),
        ),
      ],
    );
  }

  Widget _buildAccountSection(User user) {
    return _buildSection(
      title: 'Account',
      children: [
        _buildInfoRow('Email', user.email),
        _buildDivider(),
        _buildInfoRow('Account Type', user.isMember ? 'Member' : 'Fan'),
        if (user.isMember && user.memberRoleLabel.isNotEmpty) ...[
          _buildDivider(),
          _buildInfoRow('Role', user.memberRoleLabel),
        ],
      ],
    );
  }

  Widget _buildSignOut() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: OutlinedButton(
        onPressed: _signOut,
        style: OutlinedButton.styleFrom(
          foregroundColor: errorRed,
          side: const BorderSide(color: errorRed),
          minimumSize: const Size(double.infinity, 48),
        ),
        child: const Text('Sign Out'),
      ),
    );
  }

  // ─── Reusable building blocks ──────────────────────────────────────────────

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: surfaceCard,
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    int maxLines = 1,
    String? hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelSmall),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: bodyMedium,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: bodySecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildToggleRow({
    required String label,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: bodyMedium),
              const SizedBox(height: 2),
              Text(subtitle, style: bodySecondary.copyWith(fontSize: 12)),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: _isTogglingNotif ? null : onChanged,
          activeColor: ucfGold,
          activeTrackColor: ucfGold.withOpacity(0.3),
          inactiveThumbColor: textSecondary,
          inactiveTrackColor: surfaceDark,
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      children: [
        Text(label, style: bodySecondary),
        const Spacer(),
        Text(value, style: bodyMedium),
      ],
    );
  }

  Widget _buildDivider() {
    return const Divider(color: dividerColor, height: 20, thickness: 0.5);
  }
}
