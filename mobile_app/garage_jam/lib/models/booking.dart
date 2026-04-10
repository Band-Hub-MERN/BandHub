class Booking {
  final String id;
  final String garageId;
  final int floor;
  final String date;
  final String startTime;
  final String endTime;
  final String groupName;
  final String orgId;
  final bool isWeekly;

  const Booking({
    required this.id,
    required this.garageId,
    required this.floor,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.groupName,
    required this.orgId,
    required this.isWeekly,
  });

  static const Map<int, String> floorNames = {
    1: 'Ground Level',
    2: 'Level 2',
    3: 'Level 3',
    4: 'Rooftop (Open Air)',
  };

  String get floorLabel => floorNames[floor] ?? 'Floor $floor';
  String get garageLabel => 'Garage $garageId · ${floorNames[floor] ?? 'Floor $floor'}';

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id:        json['id']        as String? ?? json['_id'] as String? ?? '',
      garageId:  json['garageId']  as String? ?? '',
      floor:     (json['floor']    as num?)?.toInt() ?? 1,
      date:      json['date']      as String? ?? '',
      startTime: json['startTime'] as String? ?? '',
      endTime:   json['endTime']   as String? ?? '',
      groupName: json['groupName'] as String? ?? '',
      orgId:     json['orgId']     as String? ?? '',
      isWeekly:  json['isWeekly']  as bool? ?? false,
    );
  }
}
