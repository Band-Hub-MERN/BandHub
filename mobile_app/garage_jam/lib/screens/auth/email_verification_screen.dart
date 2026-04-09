import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';

class EmailVerificationScreen extends StatefulWidget {
  final String registrationStatusToken;

  const EmailVerificationScreen({super.key, required this.registrationStatusToken});

  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  Timer? _timer;
  String _statusMessage = 'Waiting for verification…';
  bool _isError = false;
  bool _isDone = false;

  static const _errorStatuses = {'bounced_invalid', 'bounced', 'dropped', 'blocked', 'send_failed'};

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  void _startPolling() {
    _timer = Timer.periodic(const Duration(seconds: 4), (_) => _poll());
  }

  Future<void> _poll() async {
    if (_isDone) return;
    if (widget.registrationStatusToken.isEmpty) return;

    try {
      final result = await AuthService.getRegistrationStatus(widget.registrationStatusToken);

      if (!mounted) return;

      if (result.status == 'verified') {
        _timer?.cancel();
        setState(() { _isDone = true; _statusMessage = 'Email verified! Redirecting to login…'; });
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) context.go(AppRoutes.login);
        return;
      }

      if (_errorStatuses.contains(result.status)) {
        _timer?.cancel();
        setState(() {
          _isDone = true;
          _isError = true;
          _statusMessage = result.message.isNotEmpty
              ? result.message
              : 'We could not deliver the verification email. Go back and check your email address.';
        });
        return;
      }

      // Still pending / processing / delivered — keep polling
      if (result.status == 'delivered') {
        setState(() => _statusMessage = 'Email delivered — check your inbox and tap the link.');
      }
    } catch (_) {
      // Network error during poll — silently retry next tick
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      appBar: AppBar(title: const Text('Verify Email')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 24),
              Icon(
                _isError ? Icons.error_outline : Icons.mark_email_unread_outlined,
                size: 72,
                color: _isError ? errorRed : ucfGold,
              ),
              const SizedBox(height: 28),
              Text(
                _isError ? 'Delivery Problem' : 'Check Your Inbox',
                style: headingMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                _isError
                    ? _statusMessage
                    : 'We sent a verification link to your email. Open it to activate your account.',
                style: bodySecondary,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              if (!_isError && !_isDone) ...[
                Text(_statusMessage, style: labelGold, textAlign: TextAlign.center),
                const SizedBox(height: 20),
                const CircularProgressIndicator(color: ucfGold, strokeWidth: 2),
              ],
              if (_isDone && !_isError)
                Text(_statusMessage, style: labelGold, textAlign: TextAlign.center),
              const SizedBox(height: 40),
              OutlinedButton(
                onPressed: () => context.go(AppRoutes.login),
                child: const Text('Back to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
