import 'package:flutter/material.dart';
import 'app/routes.dart';
import 'theme/theme.dart';

class GarageJamApp extends StatelessWidget {
  const GarageJamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Garage Jam',
      theme: garageJamTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
