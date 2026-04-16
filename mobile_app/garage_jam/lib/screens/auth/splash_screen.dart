import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/colors.dart';
import '../../app/routes.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (!mounted) return;

    final auth = context.read<AuthProvider>();
    final restored = await auth.tryRestoreSession();

    if (!mounted) return;
    context.go(restored ? AppRoutes.home : AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: ucfBlack,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'GARAGE',
              style: TextStyle(
                color: ucfWhite,
                fontSize: 38,
                fontWeight: FontWeight.w900,
                letterSpacing: 5,
              ),
            ),
            Text(
              'JAM',
              style: TextStyle(
                color: ucfGold,
                fontSize: 38,
                fontWeight: FontWeight.w900,
                letterSpacing: 5,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'U C F',
              style: TextStyle(
                color: textSecondary,
                fontSize: 13,
                letterSpacing: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
