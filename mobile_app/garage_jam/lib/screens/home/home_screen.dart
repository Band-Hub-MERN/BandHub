import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
import '../../models/garage_event.dart';
import '../../services/event_service.dart';
import '../../widgets/event_card.dart';
import '../../widgets/garage_filter_chips.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';
import '../../services/api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _selectedGarage;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  // Holds events fetched for a specific past date
  List<GarageEvent> _dateEvents = [];
  bool _dateEventsLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    if (auth.token == null) return;

    final eventProvider = context.read<EventProvider>();
    await eventProvider.loadEvents(auth.token!);

    if (!mounted) return;
    await eventProvider.loadAttendingEvents(auth.token!);
  }

  bool _isPastDay(DateTime day) {
    final today = DateTime.now();
    return day.isBefore(DateTime(today.year, today.month, today.day));
  }

  Future<void> _loadDateEvents(DateTime day) async {
    final auth = context.read<AuthProvider>();
    if (auth.token == null) return;

    final dateStr =
        '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';

    setState(() => _dateEventsLoading = true);
    try {
      final events = await EventService.getEventsByDate(dateStr, auth.token!);
      if (mounted) setState(() => _dateEvents = events);
    } on ApiException {
      if (mounted) setState(() => _dateEvents = []);
    } finally {
      if (mounted) setState(() => _dateEventsLoading = false);
    }
  }

  Future<void> _handleTrack(String eventId) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      context.go(AppRoutes.login);
      return;
    }

    try {
      await context.read<EventProvider>().toggleAttend(eventId, auth.token!);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }

  List<GarageEvent> _eventsForDay(DateTime day, List<GarageEvent> all) {
    return all.where((e) {
      try {
        return isSameDay(DateTime.parse(e.date), day);
      } catch (_) {
        return false;
      }
    }).toList();
  }

  List<GarageEvent> _applyFilters(List<GarageEvent> events) {
    // For past dates use the separately fetched list, not the upcoming feed
    final source = (_selectedDay != null && _isPastDay(_selectedDay!))
        ? _dateEvents
        : events;

    var filtered = source;
    if (_selectedGarage != null) {
      filtered = filtered.where((e) => e.garageId == _selectedGarage).toList();
    }
    if (_selectedDay != null && !_isPastDay(_selectedDay!)) {
      filtered = _eventsForDay(_selectedDay!, filtered);
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 8),
            Consumer<EventProvider>(
              builder: (_, ep, __) => _buildCalendar(ep.events),
            ),
            Consumer<EventProvider>(
              builder: (_, ep, __) => GarageFilterChips(
                selected: _selectedGarage,
                onSelected: (g) => setState(() => _selectedGarage = g),
              ),
            ),
            const SizedBox(height: 4),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'GARAGE JAM',
                style: TextStyle(
                  color: ucfGold,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const Text('Upcoming Events', style: headingMedium),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCalendar(List<GarageEvent> events) {
    return TableCalendar<GarageEvent>(
      firstDay: DateTime.now().subtract(const Duration(days: 365)),
      lastDay: DateTime.now().add(const Duration(days: 365)),
      focusedDay: _focusedDay,
      calendarFormat: CalendarFormat.week,
      availableCalendarFormats: const {CalendarFormat.week: 'Week'},
      selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
      eventLoader: (day) => _eventsForDay(day, events),
      onDaySelected: (selectedDay, focusedDay) {
        final deselect = isSameDay(_selectedDay, selectedDay);
        setState(() {
          _selectedDay = deselect ? null : selectedDay;
          _focusedDay = focusedDay;
          if (deselect) _dateEvents = [];
        });
        // Fetch from API when tapping a past date
        if (!deselect && _isPastDay(selectedDay)) {
          _loadDateEvents(selectedDay);
        }
      },
      onPageChanged: (focusedDay) {
        setState(() => _focusedDay = focusedDay);
      },
      calendarStyle: CalendarStyle(
        // Today
        todayDecoration: BoxDecoration(
          color: ucfGold.withOpacity(0.25),
          shape: BoxShape.circle,
        ),
        todayTextStyle: const TextStyle(
          color: ucfGold,
          fontWeight: FontWeight.bold,
        ),
        // Selected day
        selectedDecoration: const BoxDecoration(
          color: ucfGold,
          shape: BoxShape.circle,
        ),
        selectedTextStyle: const TextStyle(
          color: ucfBlack,
          fontWeight: FontWeight.bold,
        ),
        // Default days
        defaultTextStyle: const TextStyle(color: ucfWhite),
        weekendTextStyle: const TextStyle(color: ucfWhite),
        outsideDaysVisible: false,
        // Event dot
        markerDecoration: const BoxDecoration(
          color: ucfGold,
          shape: BoxShape.circle,
        ),
        markerSize: 5,
        markersMaxCount: 1,
      ),
      headerStyle: HeaderStyle(
        formatButtonVisible: false,
        titleCentered: true,
        titleTextStyle: labelGold.copyWith(fontSize: 14),
        leftChevronIcon:
            const Icon(Icons.chevron_left, color: ucfGold, size: 20),
        rightChevronIcon:
            const Icon(Icons.chevron_right, color: ucfGold, size: 20),
        headerPadding:
            const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
        decoration: const BoxDecoration(color: Colors.transparent),
      ),
      daysOfWeekStyle: const DaysOfWeekStyle(
        weekdayStyle: TextStyle(color: textSecondary, fontSize: 12),
        weekendStyle: TextStyle(color: textSecondary, fontSize: 12),
      ),
      rowHeight: 44,
    );
  }

  Widget _buildBody() {
    return Consumer<EventProvider>(
      builder: (context, ep, _) {
        if (ep.loadState == EventLoadState.loading || _dateEventsLoading) {
          return _buildShimmer();
        }
        if (ep.loadState == EventLoadState.error) {
          return _buildError(ep.errorMessage ?? 'Something went wrong.');
        }

        final filtered = _applyFilters(ep.events);

        if (filtered.isEmpty) return _buildEmpty();

        final auth = context.read<AuthProvider>();
        return RefreshIndicator(
          color: ucfGold,
          backgroundColor: surfaceDark,
          onRefresh: _load,
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 20),
            itemCount: filtered.length,
            itemBuilder: (_, i) {
              final event = filtered[i];
              return EventCard(
                event: event,
                isAttending: ep.isAttending(event.id),
                isLoggedIn: auth.isLoggedIn,
                onTap: () => context.push(AppRoutes.eventDetailPath(event.id)),
                onTrackTap: () => _handleTrack(event.id),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: surfaceDark,
      highlightColor: const Color(0xFF2A2A2A),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          height: 200,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: surfaceCard,
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_outlined, size: 48, color: textSecondary),
            const SizedBox(height: 16),
            Text(message, style: bodySecondary, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            OutlinedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    String message;
    if (_selectedDay != null) {
      final d = _selectedDay!;
      message = 'No events on ${_monthName(d.month)} ${d.day}.';
    } else if (_selectedGarage != null) {
      message = 'No events in Garage $_selectedGarage.';
    } else {
      message = 'No upcoming events yet.';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.event_busy_outlined, size: 48, color: textSecondary),
          const SizedBox(height: 16),
          Text(message, style: bodySecondary, textAlign: TextAlign.center),
        ],
      ),
    );
  }

  String _monthName(int month) {
    const names = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return names[month];
  }
}
