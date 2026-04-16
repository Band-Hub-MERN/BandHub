import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../services/api_client.dart';
import '../../widgets/event_card.dart';
import '../../widgets/booking_card.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';

class MyEventsScreen extends StatefulWidget {
  const MyEventsScreen({super.key});

  @override
  State<MyEventsScreen> createState() => _MyEventsScreenState();
}

class _MyEventsScreenState extends State<MyEventsScreen> {
  List<Booking> _bookings = [];
  bool _bookingsLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    if (auth.token == null) return;

    final eventFuture = context.read<EventProvider>().loadMyEvents(auth.token!);

    if (auth.currentUser?.isMember == true) {
      await Future.wait([eventFuture, _loadBookings(auth.token!)]);
    } else {
      await eventFuture;
    }
  }

  Future<void> _loadBookings(String token) async {
    setState(() => _bookingsLoading = true);
    try {
      final result = await BookingService.getMyBookings(token);
      if (mounted) setState(() => _bookings = result);
    } on ApiException {
      if (mounted) setState(() => _bookings = []);
    } finally {
      if (mounted) setState(() => _bookingsLoading = false);
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

  List<Booking> get _upcomingBookings {
    final today = _todayMidnight();
    return _bookings.where((b) {
      if (b.isWeekly) return true;
      try {
        return !DateTime.parse(b.date).isBefore(today);
      } catch (_) {
        return true;
      }
    }).toList()
      ..sort((a, b) {
        if (a.isWeekly && !b.isWeekly) return -1;
        if (!a.isWeekly && b.isWeekly) return 1;
        return a.date.compareTo(b.date);
      });
  }

  DateTime _todayMidnight() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
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
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
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
          const Text('My Events', style: headingMedium),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return Consumer<EventProvider>(
      builder: (context, ep, _) {
        final auth = context.read<AuthProvider>();
        final isMember = auth.currentUser?.isMember == true;

        if (ep.myEventsLoadState == EventLoadState.loading || _bookingsLoading) {
          return _buildShimmer();
        }

        if (ep.myEventsLoadState == EventLoadState.error) {
          return _buildError();
        }

        final upcomingEvents = ep.upcomingMyEvents;
        final upcomingBookings = isMember ? _upcomingBookings : <Booking>[];

        if (upcomingEvents.isEmpty && upcomingBookings.isEmpty) {
          return _buildEmpty();
        }

        return RefreshIndicator(
          color: ucfGold,
          backgroundColor: surfaceDark,
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.only(bottom: 20),
            children: [
              if (upcomingBookings.isNotEmpty) ...[
                _buildSectionHeader('Practice Bookings'),
                ...upcomingBookings.map((b) => BookingCard(booking: b)),
                const SizedBox(height: 8),
              ],
              if (upcomingEvents.isNotEmpty) ...[
                if (upcomingBookings.isNotEmpty)
                  _buildSectionHeader('Tracked Events'),
                ...upcomingEvents.map((event) => EventCard(
                      event: event,
                      isAttending: ep.isAttending(event.id),
                      isLoggedIn: auth.isLoggedIn,
                      onTap: () =>
                          context.push(AppRoutes.eventDetailPath(event.id)),
                      onTrackTap: () => _handleTrack(event.id),
                    )),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: textSecondary,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: surfaceDark,
      highlightColor: const Color(0xFF2A2A2A),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: 3,
        itemBuilder: (_, __) => Container(
          height: 110,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: surfaceCard,
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bookmark_border_outlined,
                size: 48, color: textSecondary),
            const SizedBox(height: 16),
            Text(
              'No upcoming events tracked yet.\nFind something on the Home tab!',
              style: bodySecondary,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_outlined, size: 48, color: textSecondary),
            const SizedBox(height: 16),
            Text('Could not load your events.',
                style: bodySecondary, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            OutlinedButton(onPressed: _load, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
