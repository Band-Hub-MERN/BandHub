class GarageEvent {
  final String id;
  final String title;
  final String orgName;
  final String orgId;
  final String orgColor;
  final String garageId;
  final int floor;
  final String date;
  final String startTime;
  final String endTime;
  final String description;
  final String category;
  final String coverImage;
  final int attendees;
  final bool isPublic;
  final bool isGoing;

  const GarageEvent({
    required this.id,
    required this.title,
    required this.orgName,
    required this.orgId,
    required this.orgColor,
    required this.garageId,
    required this.floor,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.description,
    required this.category,
    required this.coverImage,
    required this.attendees,
    required this.isPublic,
    this.isGoing = false,
  });

  static const Map<int, String> floorNames = {
    1: 'Ground Level',
    2: 'Level 2',
    3: 'Level 3',
    4: 'Rooftop (Open Air)',
  };

  String get floorLabel => floorNames[floor] ?? 'Floor $floor';
  String get garageLabel => 'Garage $garageId · ${floorNames[floor] ?? 'Floor $floor'}';

  factory GarageEvent.fromJson(Map<String, dynamic> json) {
    return GarageEvent(
      id:          json['id']          as String? ?? json['_id'] as String? ?? '',
      title:       json['title']       as String? ?? '',
      orgName:     json['orgName']     as String? ?? '',
      orgId:       json['orgId']       as String? ?? '',
      orgColor:    json['orgColor']    as String? ?? '#FFC904',
      garageId:    json['garageId']    as String? ?? '',
      floor:       (json['floor']      as num?)?.toInt() ?? 1,
      date:        json['date']        as String? ?? '',
      startTime:   json['startTime']   as String? ?? '',
      endTime:     json['endTime']     as String? ?? '',
      description: json['description'] as String? ?? '',
      category:    json['category']    as String? ?? 'Other',
      coverImage:  json['coverImage']  as String? ?? '',
      attendees:   (json['attendees']  as num?)?.toInt() ?? 0,
      isPublic:    json['isPublic']    as bool? ?? true,
      isGoing:     json['isGoing']     as bool? ?? false,
    );
  }
}
