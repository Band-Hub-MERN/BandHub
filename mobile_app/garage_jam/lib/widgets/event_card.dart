import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../models/garage_event.dart';
import '../theme/colors.dart';
import '../theme/text_styles.dart';

class EventCard extends StatelessWidget {
  final GarageEvent event;
  final bool isAttending;
  final bool isLoggedIn;
  final VoidCallback onTap;
  final VoidCallback onTrackTap;

  const EventCard({
    super.key,
    required this.event,
    required this.isAttending,
    required this.isLoggedIn,
    required this.onTap,
    required this.onTrackTap,
  });

  Color get _orgColor {
    try {
      final hex = event.orgColor.replaceFirst('#', '');
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
      final date = DateTime.parse(d);
      return DateFormat('EEE, MMM d').format(date);
    } catch (_) {
      return d;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border(
            left: BorderSide(color: _orgColor, width: 4),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (event.coverImage.isNotEmpty) _buildImage(),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(event.title, style: headingSmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                      ),
                      _buildTrackButton(),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(event.orgName, style: labelGold),
                  const SizedBox(height: 8),
                  _buildInfoRow(Icons.location_on_outlined, event.garageLabel),
                  const SizedBox(height: 4),
                  _buildInfoRow(
                    Icons.schedule_outlined,
                    '${_formatDate(event.date)} · ${_formatTime(event.startTime)} – ${_formatTime(event.endTime)}',
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildCategoryBadge(),
                      const Spacer(),
                      Icon(Icons.people_outline, size: 14, color: textSecondary),
                      const SizedBox(width: 4),
                      Text('${event.attendees} attending', style: labelSmall),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage() {
    return SizedBox(
      height: 160,
      width: double.infinity,
      child: CachedNetworkImage(
        imageUrl: event.coverImage,
        fit: BoxFit.cover,
        placeholder: (_, __) => Container(color: surfaceDark),
        errorWidget: (_, __, ___) => Container(
          color: surfaceDark,
          child: const Center(
            child: Icon(Icons.music_note, color: textSecondary, size: 40),
          ),
        ),
      ),
    );
  }

  Widget _buildTrackButton() {
    return IconButton(
      onPressed: onTrackTap,
      icon: Icon(
        isAttending ? Icons.bookmark : Icons.bookmark_outline,
        color: isAttending ? ucfGold : textSecondary,
        size: 22,
      ),
      tooltip: isAttending ? 'Untrack event' : 'Track event',
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: textSecondary),
        const SizedBox(width: 6),
        Expanded(
          child: Text(text, style: bodySecondary, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }

  Widget _buildCategoryBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        border: Border.all(color: ucfGold.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(event.category, style: labelGold.copyWith(fontSize: 11)),
    );
  }
}
