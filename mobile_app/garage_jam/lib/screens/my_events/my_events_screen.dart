import 'package:flutter/material.dart';
import '../../theme/colors.dart';

// Placeholder — fully implemented in Phase 4
class MyEventsScreen extends StatelessWidget {
  const MyEventsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: ucfBlack,
      body: Center(
        child: Text(
          'My Events\n(Phase 4)',
          textAlign: TextAlign.center,
          style: TextStyle(color: ucfGold, fontSize: 20),
        ),
      ),
    );
  }
}
