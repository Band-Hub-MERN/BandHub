class NotificationPrefs {
  final bool invites;
  final bool events;
  final bool bookings;
  final bool digest;

  const NotificationPrefs({
    this.invites = true,
    this.events = true,
    this.bookings = true,
    this.digest = false,
  });

  factory NotificationPrefs.fromJson(Map<String, dynamic> json) {
    return NotificationPrefs(
      invites:  json['invites']  as bool? ?? true,
      events:   json['events']   as bool? ?? true,
      bookings: json['bookings'] as bool? ?? true,
      digest:   json['digest']   as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'invites':  invites,
    'events':   events,
    'bookings': bookings,
    'digest':   digest,
  };

  NotificationPrefs copyWith({
    bool? invites,
    bool? events,
    bool? bookings,
    bool? digest,
  }) {
    return NotificationPrefs(
      invites:  invites  ?? this.invites,
      events:   events   ?? this.events,
      bookings: bookings ?? this.bookings,
      digest:   digest   ?? this.digest,
    );
  }
}

class User {
  final String id;
  final String email;
  final String accountType; // 'fan' | 'member'
  final String displayName;
  final bool isVerified;
  final String? organizationId;
  final String memberRoleLabel;
  final String bio;
  final NotificationPrefs notificationPrefs;

  const User({
    required this.id,
    required this.email,
    required this.accountType,
    required this.displayName,
    required this.isVerified,
    this.organizationId,
    this.memberRoleLabel = '',
    this.bio = '',
    this.notificationPrefs = const NotificationPrefs(),
  });

  bool get isMember => accountType == 'member';
  bool get isFan => accountType == 'fan';
  bool get hasOrganization => organizationId != null && organizationId!.isNotEmpty;

  String get initials {
    final parts = displayName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return 'GJ';
    if (parts.length == 1) return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id:               json['id']             as String? ?? '',
      email:            json['email']          as String? ?? '',
      accountType:      json['accountType']    as String? ?? 'fan',
      displayName:      json['displayName']    as String? ?? '',
      isVerified:       json['isVerified']     as bool?   ?? false,
      organizationId:   json['organizationId'] as String?,
      memberRoleLabel:  json['memberRoleLabel'] as String? ?? '',
      bio:              json['bio']            as String? ?? '',
      notificationPrefs: json['notificationPrefs'] != null
          ? NotificationPrefs.fromJson(json['notificationPrefs'] as Map<String, dynamic>)
          : const NotificationPrefs(),
    );
  }

  User copyWith({
    String? displayName,
    String? bio,
    String? organizationId,
    NotificationPrefs? notificationPrefs,
  }) {
    return User(
      id:               id,
      email:            email,
      accountType:      accountType,
      displayName:      displayName      ?? this.displayName,
      isVerified:       isVerified,
      organizationId:   organizationId   ?? this.organizationId,
      memberRoleLabel:  memberRoleLabel,
      bio:              bio              ?? this.bio,
      notificationPrefs: notificationPrefs ?? this.notificationPrefs,
    );
  }
}
