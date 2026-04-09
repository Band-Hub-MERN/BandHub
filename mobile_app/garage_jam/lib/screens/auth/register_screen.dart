import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../services/api_client.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController    = TextEditingController();
  final _displayNameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController  = TextEditingController();
  final _roleController     = TextEditingController();

  String? _accountType; // 'fan' | 'member'
  bool _obscurePassword = true;
  bool _obscureConfirm  = true;
  bool _isLoading = false;
  String? _errorMessage;

  // Password policy state
  bool get _hasLength    => _passwordController.text.length >= 8;
  bool get _hasUppercase => _passwordController.text.contains(RegExp(r'[A-Z]'));
  bool get _hasNumber    => _passwordController.text.contains(RegExp(r'[0-9]'));
  bool get _hasSymbol    => _passwordController.text.contains(RegExp(r'[^A-Za-z0-9]'));

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _displayNameController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _roleController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_accountType == null) {
      setState(() => _errorMessage = 'Please select an account type.');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _errorMessage = null; });

    try {
      final result = await AuthService.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        displayName: _displayNameController.text.trim(),
        accountType: _accountType!,
        memberRoleLabel: _roleController.text.trim(),
      );
      if (mounted) {
        context.go('${AppRoutes.verifyEmail}?token=${result.registrationStatusToken}');
      }
    } on ApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      appBar: AppBar(
        title: const Text('Create Account'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go(AppRoutes.login),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Choose account type', style: headingSmall),
              const SizedBox(height: 4),
              const Text('This cannot be changed later.', style: bodySecondary),
              const SizedBox(height: 16),
              _buildTypeSelector(),
              const SizedBox(height: 28),
              if (_accountType != null) ...[
                if (_errorMessage != null) _buildErrorBanner(),
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTextField(
                        controller: _emailController,
                        label: 'Email',
                        hint: 'you@ucf.edu',
                        icon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _displayNameController,
                        label: 'Display Name',
                        hint: 'How you appear to others',
                        icon: Icons.person_outlined,
                        validator: (v) {
                          if (v == null || v.trim().length < 2) return 'Name must be at least 2 characters';
                          return null;
                        },
                      ),
                      if (_accountType == 'member') ...[
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _roleController,
                          label: 'Role / Instrument (optional)',
                          hint: 'e.g. Guitarist, Vocalist, DJ',
                          icon: Icons.music_note_outlined,
                          validator: (_) => null,
                        ),
                      ],
                      const SizedBox(height: 16),
                      _buildPasswordField(),
                      const SizedBox(height: 8),
                      _buildPolicyIndicator(),
                      const SizedBox(height: 16),
                      _buildTextField(
                        controller: _confirmController,
                        label: 'Confirm Password',
                        icon: Icons.lock_outlined,
                        obscure: _obscureConfirm,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: textSecondary,
                          ),
                          onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                        ),
                        validator: (v) {
                          if (v != _passwordController.text) return 'Passwords do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 28),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        child: _isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(strokeWidth: 2, color: ucfBlack),
                              )
                            : const Text('Create Account'),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeSelector() {
    return Row(
      children: [
        Expanded(child: _buildTypeCard('fan', 'Fan', 'Browse and track campus events')),
        const SizedBox(width: 12),
        Expanded(child: _buildTypeCard('member', 'Member', 'Create an org and manage sessions')),
      ],
    );
  }

  Widget _buildTypeCard(String type, String label, String description) {
    final selected = _accountType == type;
    return GestureDetector(
      onTap: () => setState(() { _accountType = type; _errorMessage = null; }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? ucfGold.withOpacity(0.08) : surfaceDark,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? ucfGold : dividerColor,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? ucfGold : ucfWhite,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(description, style: labelSmall),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: errorRed.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: errorRed.withOpacity(0.4)),
      ),
      child: Text(_errorMessage!, style: errorText),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscure = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: bodyLarge,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: textSecondary),
        suffixIcon: suffixIcon,
      ),
      validator: validator,
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: _obscurePassword,
      style: bodyLarge,
      decoration: InputDecoration(
        labelText: 'Password',
        prefixIcon: const Icon(Icons.lock_outlined, color: textSecondary),
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: textSecondary,
          ),
          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
        ),
      ),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Password is required';
        if (!_hasLength || !_hasUppercase || !_hasNumber || !_hasSymbol) {
          return 'Password does not meet requirements below';
        }
        return null;
      },
    );
  }

  Widget _buildPolicyIndicator() {
    return Column(
      children: [
        _policyRow('At least 8 characters', _hasLength),
        _policyRow('At least 1 uppercase letter', _hasUppercase),
        _policyRow('At least 1 number', _hasNumber),
        _policyRow('At least 1 special character', _hasSymbol),
      ],
    );
  }

  Widget _policyRow(String label, bool met) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(
            met ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 16,
            color: met ? ucfGold : textSecondary,
          ),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: met ? ucfGold : textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}
