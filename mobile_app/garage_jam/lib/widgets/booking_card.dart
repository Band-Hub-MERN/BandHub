import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking.dart';
import '../theme/colors.dart';
import '../theme/text_styles.dart';

class BookingCard extends StatelessWidget {
  final Booking booking;

  const BookingCard({super.key, required this.booking});

  String _formatTime(String t) {
    try {
      final dt = DateFormat('HH:mm').parse(t);
      return DateFormat('h:mm a').format(dt);
    } catch (_) {
      return t;
    }
  }

  String _formatDate(String d) {
    try {
      return DateFormat('EEE, MMM d').format(DateTime.parse(d));
    } catch (_) {
      return d;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: const Border(
          left: BorderSide(color: ucfGold, width: 4),
        ),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  booking.groupName.isNotEmpty ? booking.groupName : 'Practice Session',
                  style: headingSmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (booking.isWeekly)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    border: Border.all(color: ucfGold.withOpacity(0.5)),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('Weekly', style: labelGold.copyWith(fontSize: 11)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.location_on_outlined, booking.garageLabel),
          const SizedBox(height: 4),
          _buildInfoRow(
            Icons.schedule_outlined,
            '${_formatDate(booking.date)} · ${_formatTime(booking.startTime)} – ${_formatTime(booking.endTime)}',
          ),
        ],
      ),
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
}
