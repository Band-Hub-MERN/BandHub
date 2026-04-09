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

  List<GarageEvent> get events => _events;
  EventLoadState get loadState => _loadState;
  String? get errorMessage => _errorMessage;

  bool isAttending(String eventId) => _attendedIds.contains(eventId);

  List<GarageEvent> get attendedEvents =>
      _events.where((e) => _attendedIds.contains(e.id)).toList();

  Future<void> loadEvents(String token) async {
    _loadState = EventLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _events = await EventService.getEvents(token);
      _loadState = EventLoadState.loaded;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _loadState = EventLoadState.error;
    }
    notifyListeners();
  }

  Future<void> toggleAttend(String eventId, String token) async {
    final wasAttending = _attendedIds.contains(eventId);

    // Optimistic update
    if (wasAttending) {
      _attendedIds.remove(eventId);
    } else {
      _attendedIds.add(eventId);
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
      } else {
        _attendedIds.remove(eventId);
      }
      notifyListeners();
      rethrow;
    }
  }

  Future<void> loadAttendingEvents(String token) async {
    try {
      final attended = await EventService.getAttendingEvents(token);
      _attendedIds.addAll(attended.map((e) => e.id));
      notifyListeners();
    } on ApiException {
      // Non-fatal — attended state stays empty
    }
  }

  void clearAttended() {
    _attendedIds.clear();
    notifyListeners();
  }
}
