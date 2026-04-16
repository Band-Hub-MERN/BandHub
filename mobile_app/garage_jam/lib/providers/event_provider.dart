import 'package:flutter/material.dart';
import '../models/garage_event.dart';
import '../services/event_service.dart';
import '../services/api_client.dart';

enum EventLoadState { idle, loading, loaded, error }

class EventProvider extends ChangeNotifier {
  List<GarageEvent> _events = [];
  final Set<String> _attendedIds = {};
  EventLoadState _loadState = EventLoadState.idle;
  String? _errorMessage;

  List<GarageEvent> _myEvents = [];
  EventLoadState _myEventsLoadState = EventLoadState.idle;

  List<GarageEvent> get events => _events;
  EventLoadState get loadState => _loadState;
  String? get errorMessage => _errorMessage;
  EventLoadState get myEventsLoadState => _myEventsLoadState;

  bool isAttending(String eventId) => _attendedIds.contains(eventId);

  List<GarageEvent> get upcomingMyEvents {
    final now = DateTime.now();
    return _myEvents.where((e) => _isUpcoming(e, now)).toList()
      ..sort((a, b) => a.date.compareTo(b.date));
  }

  List<GarageEvent> get pastMyEvents {
    final now = DateTime.now();
    return _myEvents.where((e) => !_isUpcoming(e, now)).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  /// An event is upcoming if its date is in the future, or it's today and
  /// the end time hasn't passed yet.
  bool _isUpcoming(GarageEvent event, DateTime now) {
    try {
      final eventDate = DateTime.parse(event.date);
      final todayMidnight = DateTime(now.year, now.month, now.day);

      if (eventDate.isAfter(todayMidnight)) return true;
      if (eventDate.isBefore(todayMidnight)) return false;

      // Event is today — check if the end time has passed
      final parts = event.endTime.split(':');
      if (parts.length == 2) {
        final endHour = int.tryParse(parts[0]);
        final endMin = int.tryParse(parts[1]);
        if (endHour != null && endMin != null) {
          final endDateTime = DateTime(
              now.year, now.month, now.day, endHour, endMin);
          return !endDateTime.isBefore(now);
        }
      }
      return true; // Can't parse end time — keep as upcoming for today
    } catch (_) {
      return false; // Unparseable date — treat as past
    }
  }

  Future<void> loadEvents(String token) async {
    _loadState = EventLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _events = await EventService.getEvents(token);
      _loadState = EventLoadState.loaded;
      // Sync attended state from isGoing field returned by the API
      _syncAttendedFromEvents(_events);
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _loadState = EventLoadState.error;
    }
    notifyListeners();
  }

  /// Reads isGoing flags from a list of events and syncs _attendedIds + _myEvents.
  void _syncAttendedFromEvents(List<GarageEvent> events) {
    for (final e in events) {
      if (e.isGoing) {
        _attendedIds.add(e.id);
        if (!_myEvents.any((m) => m.id == e.id)) {
          _myEvents.add(e);
        }
      } else {
        // Remove from attended/my-events if the server says we're no longer going
        _attendedIds.remove(e.id);
        _myEvents.removeWhere((m) => m.id == e.id);
      }
    }
  }

  Future<void> toggleAttend(String eventId, String token,
      {GarageEvent? eventHint}) async {
    final wasAttending = _attendedIds.contains(eventId);

    // Resolve the full event object — check _events first, fall back to hint
    GarageEvent? _resolve() {
      final idx = _events.indexWhere((e) => e.id == eventId);
      return idx != -1 ? _events[idx] : eventHint;
    }

    // Optimistic update — keep _myEvents in sync
    if (wasAttending) {
      _attendedIds.remove(eventId);
      _myEvents.removeWhere((e) => e.id == eventId);
    } else {
      _attendedIds.add(eventId);
      final event = _resolve();
      if (event != null && !_myEvents.any((e) => e.id == eventId)) {
        _myEvents.add(event);
      }
    }
    notifyListeners();

    try {
      if (wasAttending) {
        await EventService.unattendEvent(eventId, token);
      } else {
        await EventService.attendEvent(eventId, token);
      }
    } on ApiException {
      // Revert on failure
      if (wasAttending) {
        _attendedIds.add(eventId);
        final event = _resolve();
        if (event != null && !_myEvents.any((e) => e.id == eventId)) {
          _myEvents.add(event);
        }
      } else {
        _attendedIds.remove(eventId);
        _myEvents.removeWhere((e) => e.id == eventId);
      }
      notifyListeners();
      rethrow;
    }
  }

  /// No-op — attended state is now derived from isGoing in loadEvents().
  Future<void> loadAttendingEvents(String token) async {}

  /// Refreshes my events by reloading the events feed and reading isGoing flags.
  Future<void> loadMyEvents(String token) async {
    _myEventsLoadState = EventLoadState.loading;
    notifyListeners();

    try {
      final fresh = await EventService.getEvents(token);
      _events = fresh;
      _syncAttendedFromEvents(_events);
      _myEventsLoadState = EventLoadState.loaded;
    } on ApiException {
      _myEventsLoadState = EventLoadState.error;
    }
    notifyListeners();
  }

  void clearAttended() {
    _attendedIds.clear();
    _myEvents.clear();
    notifyListeners();
  }
}
