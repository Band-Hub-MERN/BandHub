import 'package:flutter/material.dart';
import 'colors.dart';

final ThemeData garageJamTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: ucfBlack,
  primaryColor: ucfGold,
  colorScheme: const ColorScheme.dark(
    primary: ucfGold,
    onPrimary: ucfBlack,
    secondary: ucfGold,
    onSecondary: ucfBlack,
    surface: surfaceDark,
    onSurface: ucfWhite,
    error: errorRed,
    onError: ucfWhite,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: ucfBlack,
    foregroundColor: ucfWhite,
    elevation: 0,
    titleTextStyle: TextStyle(
      color: ucfWhite,
      fontSize: 20,
      fontWeight: FontWeight.bold,
    ),
    iconTheme: IconThemeData(color: ucfWhite),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: ucfBlack,
    selectedItemColor: ucfGold,
    unselectedItemColor: textSecondary,
    selectedLabelStyle: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
    ),
    unselectedLabelStyle: TextStyle(fontSize: 12),
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: ucfGold,
      foregroundColor: ucfBlack,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: ucfGold,
      side: const BorderSide(color: ucfGold),
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: surfaceDark,
    hintStyle: const TextStyle(color: textSecondary),
    labelStyle: const TextStyle(color: textSecondary),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: dividerColor),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: dividerColor),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: ucfGold, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: errorRed),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: errorRed, width: 2),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  ),
  cardTheme: const CardThemeData(
    color: surfaceCard,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.all(Radius.circular(12)),
    ),
  ),
  dividerTheme: const DividerThemeData(
    color: dividerColor,
    thickness: 1,
    space: 1,
  ),
  snackBarTheme: const SnackBarThemeData(
    backgroundColor: surfaceDark,
    contentTextStyle: TextStyle(color: ucfWhite),
    actionTextColor: ucfGold,
  ),
);
