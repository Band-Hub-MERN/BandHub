import '../models/garage_event.dart';
import 'api_client.dart';

class EventService {
  // GET /api/events returns a raw array [] — requires auth token
  static Future<List<GarageEvent>> getEvents(String token) async {
    final list = await ApiClient.getList('/api/events', token: token);
    return list
        .map((e) => GarageEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // GET /api/events/:id returns the event object directly — requires auth token
  static Future<GarageEvent> getEvent(String id, String token) async {
    final data = await ApiClient.get('/api/events/$id', token: token);
    return GarageEvent.fromJson(data);
  }

  // POST /api/events/:id/rsvp — mark the user as going
  static Future<void> attendEvent(String id, String token) async {
    await ApiClient.post('/api/events/$id/rsvp', {}, token: token);
  }

  // DELETE /api/events/:id/attend — remove the user from attendees
  static Future<void> unattendEvent(String id, String token) async {
    await ApiClient.delete('/api/events/$id/attend', token: token);
  }

  // GET /api/events?date=YYYY-MM-DD — events for a specific date (past or future)
  static Future<List<GarageEvent>> getEventsByDate(
      String date, String token) async {
    final list =
        await ApiClient.getList('/api/events?date=$date', token: token);
    return list
        .map((e) => GarageEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
