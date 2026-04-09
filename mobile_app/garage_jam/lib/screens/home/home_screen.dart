import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
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

  List<dynamic> get _filtered {
    final events = context.read<EventProvider>().events;
    if (_selectedGarage == null) return events;
    return events.where((e) => e.garageId == _selectedGarage).toList();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 12),
            Consumer<EventProvider>(
              builder: (_, ep, __) => GarageFilterChips(
                selected: _selectedGarage,
                onSelected: (g) => setState(() => _selectedGarage = g),
              ),
            ),
            const SizedBox(height: 12),
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
              const Text('GARAGE JAM', style: TextStyle(color: ucfGold, fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 2)),
              const Text('Upcoming Events', style: headingMedium),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return Consumer<EventProvider>(
      builder: (context, ep, _) {
        if (ep.loadState == EventLoadState.loading) return _buildShimmer();
        if (ep.loadState == EventLoadState.error) return _buildError(ep.errorMessage ?? 'Something went wrong.');

        final filtered = _selectedGarage == null
            ? ep.events
            : ep.events.where((e) => e.garageId == _selectedGarage).toList();

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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.event_busy_outlined, size: 48, color: textSecondary),
          const SizedBox(height: 16),
          Text(
            _selectedGarage == null
                ? 'No upcoming events yet.'
                : 'No events in Garage $_selectedGarage.',
            style: bodySecondary,
          ),
        ],
      ),
    );
  }
}
