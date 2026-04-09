import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int statusCode;

  const ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  static String get _base => dotenv.env['API_BASE_URL'] ?? '';

  static Map<String, String> _headers({String? token}) {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Parses an object response — throws ApiException on non-2xx
  static Map<String, dynamic> _parseObject(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } catch (_) {
        throw ApiException(message: 'Unexpected server response.', statusCode: response.statusCode);
      }
    }
    // Error response — try to extract message
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final message = body['error'] as String? ?? body['message'] as String? ?? 'Something went wrong.';
      throw ApiException(message: message, statusCode: response.statusCode);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Something went wrong.', statusCode: response.statusCode);
    }
  }

  // Parses an array response — throws ApiException on non-2xx
  static List<dynamic> _parseList(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return jsonDecode(response.body) as List<dynamic>;
      } catch (_) {
        throw ApiException(message: 'Unexpected server response.', statusCode: response.statusCode);
      }
    }
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final message = body['error'] as String? ?? body['message'] as String? ?? 'Something went wrong.';
      throw ApiException(message: message, statusCode: response.statusCode);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(message: 'Something went wrong.', statusCode: response.statusCode);
    }
  }

  static Future<Map<String, dynamic>> get(String path, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('$_base$path'),
        headers: _headers(token: token),
      );
      return _parseObject(response);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(message: 'Could not connect. Check your connection and try again.', statusCode: 0);
    }
  }

  // Use this for endpoints that return a JSON array at the top level
  static Future<List<dynamic>> getList(String path, {String? token}) async {
    try {
      final response = await http.get(
        Uri.parse('$_base$path'),
        headers: _headers(token: token),
      );
      return _parseList(response);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(message: 'Could not connect. Check your connection and try again.', statusCode: 0);
    }
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_base$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _parseObject(response);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(message: 'Could not connect. Check your connection and try again.', statusCode: 0);
    }
  }

  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$_base$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _parseObject(response);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(message: 'Could not connect. Check your connection and try again.', statusCode: 0);
    }
  }

  static Future<Map<String, dynamic>> delete(String path, {String? token}) async {
    try {
      final response = await http.delete(
        Uri.parse('$_base$path'),
        headers: _headers(token: token),
      );
      return _parseObject(response);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw const ApiException(message: 'Could not connect. Check your connection and try again.', statusCode: 0);
    }
  }
}
