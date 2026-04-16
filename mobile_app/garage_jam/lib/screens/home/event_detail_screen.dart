import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/garage_event.dart';
import '../../providers/auth_provider.dart';
import '../../providers/event_provider.dart';
import '../../services/event_service.dart';
import '../../services/api_client.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';
import '../../app/routes.dart';
import 'package:go_router/go_router.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  GarageEvent? _event;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isTracking = false;

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    try {
      final token = context.read<AuthProvider>().token ?? '';
      final event = await EventService.getEvent(widget.eventId, token);
      if (mounted) setState(() { _event = event; _isLoading = false; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _errorMessage = e.message; _isLoading = false; });
    }
  }

  Future<void> _handleTrack() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      context.go(AppRoutes.login);
      return;
    }

    setState(() => _isTracking = true);
    try {
      await context.read<EventProvider>().toggleAttend(widget.eventId, auth.token!);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isTracking = false);
    }
  }

  Color get _orgColor {
    try {
      final hex = (_event?.orgColor ?? '#FFC904').replaceFirst('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return ucfGold;
    }
  }

  String _formatTime(String t) {
    try {
      // We use "HH:mm" to parse the 24-hour string from your API
      final DateTime tempDate = DateFormat("HH:mm").parse(t);
      // We use "h:mm a" to output "1:00 PM"
      return DateFormat("h:mm a").format(tempDate);
    } catch (_) {
      return t;
    }
  }

  String _formatDate(String d) {
    try {
      return DateFormat('EEEE, MMMM d, y').format(DateTime.parse(d));
    } catch (_) {
      return d;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ucfBlack,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: ucfGold))
          : _errorMessage != null
              ? _buildError()
              : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: errorRed, size: 48),
          const SizedBox(height: 16),
          Text(_errorMessage!, style: bodySecondary),
          const SizedBox(height: 20),
          OutlinedButton(onPressed: () => context.pop(), child: const Text('Go Back')),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final event = _event!;
    final isAttending = context.watch<EventProvider>().isAttending(event.id);

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: event.coverImage.isNotEmpty ? 260 : 80,
          pinned: true,
          backgroundColor: ucfBlack,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: ucfWhite),
            onPressed: () => context.pop(),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: event.coverImage.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: event.coverImage,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: surfaceDark),
                    errorWidget: (_, __, ___) => Container(color: surfaceDark),
                  )
                : Container(color: surfaceDark),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 3, width: 40, decoration: BoxDecoration(color: _orgColor, borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 14),
                Text(event.title, style: headingLarge),
                const SizedBox(height: 6),
                Text(event.orgName, style: labelGold.copyWith(fontSize: 15)),
                const SizedBox(height: 20),
                _infoRow(Icons.location_on_outlined, event.garageLabel),
                const SizedBox(height: 8),
                _infoRow(Icons.calendar_today_outlined, _formatDate(event.date)),
                const SizedBox(height: 8),
                _infoRow(Icons.schedule_outlined, '${_formatTime(event.startTime)} – ${_formatTime(event.endTime)}'),
                const SizedBox(height: 8),
                _infoRow(Icons.people_outline, '${event.attendees} attending'),
                const SizedBox(height: 20),
                _buildCategoryBadge(event.category),
                if (event.description.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const Text('About', style: headingSmall),
                  const SizedBox(height: 8),
                  Text(event.description, style: bodyMedium.copyWith(height: 1.6)),
                ],
                const SizedBox(height: 32),
                _buildTrackButton(isAttending),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: textSecondary),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: bodySecondary)),
      ],
    );
  }

  Widget _buildCategoryBadge(String category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
      decoration: BoxDecoration(
        border: Border.all(color: ucfGold.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(category, style: labelGold),
    );
  }

  Widget _buildTrackButton(bool isAttending) {
    return ElevatedButton.icon(
      onPressed: _isTracking ? null : _handleTrack,
      icon: _isTracking
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: ucfBlack))
          : Icon(isAttending ? Icons.bookmark : Icons.bookmark_outline),
      label: Text(isAttending ? 'Untrack Event' : 'Track Event'),
      style: isAttending
          ? ElevatedButton.styleFrom(
              backgroundColor: surfaceDark,
              foregroundColor: ucfGold,
              side: const BorderSide(color: ucfGold),
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            )
          : null,
    );
  }
}
