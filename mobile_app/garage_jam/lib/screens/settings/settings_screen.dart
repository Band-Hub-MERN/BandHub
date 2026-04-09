import 'package:flutter/material.dart';
import '../../theme/colors.dart';

// Placeholder — fully implemented in Phase 5
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: ucfBlack,
      body: Center(
        child: Text(
          'Settings\n(Phase 5)',
          textAlign: TextAlign.center,
          style: TextStyle(color: ucfGold, fontSize: 20),
        ),
      ),
    );
  }
}
