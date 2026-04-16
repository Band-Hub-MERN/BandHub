import '../models/booking.dart';
import 'api_client.dart';

class BookingService {
  // GET /api/bookings/mine — returns bookings for the current user's org
  static Future<List<Booking>> getMyBookings(String token) async {
    final list = await ApiClient.getList('/api/bookings/mine', token: token);
    return list
        .map((e) => Booking.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
