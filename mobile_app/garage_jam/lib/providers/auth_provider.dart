import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  static const _tokenKey = 'garage_jam_token';
  static const _storage = FlutterSecureStorage();

  User? _user;
  String? _token;
  bool _isLoggedIn = false;

  User? get currentUser => _user;
  String? get token => _token;
  bool get isLoggedIn => _isLoggedIn;

  /// Called from splash screen — restores session if a valid token exists.
  Future<bool> tryRestoreSession() async {
    final savedToken = await _storage.read(key: _tokenKey);
    if (savedToken == null || savedToken.isEmpty) return false;

    try {
      final result = await AuthService.getMe(savedToken);
      _token = result.token;
      _user = result.user;
      _isLoggedIn = true;
      await _storage.write(key: _tokenKey, value: result.token);
      notifyListeners();
      return true;
    } catch (_) {
      await _storage.delete(key: _tokenKey);
      return false;
    }
  }

  Future<void> login(String email, String password) async {
    final result = await AuthService.login(email, password);
    _token = result.token;
    _user = result.user;
    _isLoggedIn = true;
    await _storage.write(key: _tokenKey, value: result.token);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _isLoggedIn = false;
    await _storage.delete(key: _tokenKey);
    notifyListeners();
  }

  Future<void> refreshUser() async {
    if (_token == null) return;
    try {
      final result = await AuthService.getMe(_token!);
      _token = result.token;
      _user = result.user;
      await _storage.write(key: _tokenKey, value: result.token);
      notifyListeners();
    } catch (_) {
      await logout();
    }
  }

  Future<void> updateUser(Map<String, dynamic> updates) async {
    if (_token == null) return;
    final updated = await AuthService.updateMe(_token!, updates);
    _user = updated;
    notifyListeners();
  }
}
