import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  static Future<({String token, User user})> login(String email, String password) async {
    final data = await ApiClient.post('/api/auth/login', {
      'email': email,
      'password': password,
    });
    return (
      token: data['accessToken'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  static Future<({String registrationStatusToken, User user})> register({
    required String email,
    required String password,
    required String displayName,
    required String accountType,
    String memberRoleLabel = '',
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'password': password,
      'displayName': displayName,
      'accountType': accountType,
    };
    if (memberRoleLabel.isNotEmpty) {
      body['memberRoleLabel'] = memberRoleLabel;
    }

    final data = await ApiClient.post('/api/auth/register', body);
    return (
      registrationStatusToken: data['registrationStatusToken'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  static Future<({String token, User user})> getMe(String token) async {
    final data = await ApiClient.get('/api/auth/me', token: token);
    return (
      token: data['accessToken'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  static Future<({String status, String message, bool shouldStopPolling})> getRegistrationStatus(
    String registrationStatusToken,
  ) async {
    final data = await ApiClient.get('/api/auth/register-status?token=$registrationStatusToken');
    return (
      status: data['status'] as String? ?? 'pending',
      message: data['message'] as String? ?? '',
      shouldStopPolling: data['shouldStopPolling'] as bool? ?? false,
    );
  }

  static Future<User> updateMe(String token, Map<String, dynamic> updates) async {
    final data = await ApiClient.patch('/api/auth/me', updates, token: token);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }
}
