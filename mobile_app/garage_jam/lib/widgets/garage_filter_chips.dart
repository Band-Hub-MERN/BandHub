import 'package:flutter/material.dart';
import '../theme/colors.dart';

const List<String> kGarageIds = ['A', 'B', 'C', 'D', 'H', 'I'];

class GarageFilterChips extends StatelessWidget {
  final String? selected;
  final void Function(String? garageId) onSelected;

  const GarageFilterChips({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _chip(null, 'All'),
          ...kGarageIds.map((id) => _chip(id, id)),
        ],
      ),
    );
  }

  Widget _chip(String? id, String label) {
    final isSelected = selected == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => onSelected(isSelected ? null : id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? ucfGold : surfaceDark,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? ucfGold : dividerColor,
            ),
          ),
          child: Text(
            id == null ? label : 'Garage $label',
            style: TextStyle(
              color: isSelected ? ucfBlack : ucfWhite,
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
