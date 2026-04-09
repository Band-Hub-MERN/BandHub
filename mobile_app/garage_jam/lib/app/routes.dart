import 'package:go_router/go_router.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/email_verification_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/home/event_detail_screen.dart';
import '../screens/my_events/my_events_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../widgets/main_shell.dart';

// Route path constants — always use these, never hardcode strings elsewhere
class AppRoutes {
  static const splash      = '/';
  static const login       = '/login';
  static const register    = '/register';
  static const verifyEmail = '/verify-email';
  static const home        = '/home';
  static const eventDetail = '/events/:id';
  static const myEvents    = '/my-events';
  static const settings    = '/settings';

  static String eventDetailPath(String id) => '/events/$id';
}

final GoRouter router = GoRouter(
  initialLocation: AppRoutes.splash,
  routes: [
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: AppRoutes.register,
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: AppRoutes.verifyEmail,
      builder: (context, state) {
        final token = state.uri.queryParameters['token'] ?? '';
        return EmailVerificationScreen(registrationStatusToken: token);
      },
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainShell(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.home,
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.myEvents,
              builder: (context, state) => const MyEventsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: AppRoutes.settings,
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    ),
    // Event detail pushed on top of shell (no bottom nav replacement)
    GoRoute(
      path: AppRoutes.eventDetail,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return EventDetailScreen(eventId: id);
      },
    ),
  ],
);
