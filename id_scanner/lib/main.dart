import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'result_page.dart';
import 'settings_page.dart';
import 'login_page.dart'; // ✅ import new files


const String baseUrl = 'http://192.168.100.12:8000';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  Widget _defaultHome =
  const Scaffold(body: Center(child: CircularProgressIndicator()));

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token != null && token.isNotEmpty) {
      setState(() {
        _defaultHome = QRScannerPage(token: token);
      });
    } else {
      setState(() {
        _defaultHome = const LoginPage();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QR Scanner',
      theme: ThemeData(
        primaryColor: const Color.fromRGBO(26, 24, 81, 1),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: const Color.fromRGBO(26, 24, 81, 1),
          secondary: const Color.fromRGBO(0, 173, 255, 1),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color.fromRGBO(26, 24, 81, 1),
          foregroundColor: Colors.white,
        ),
      ),
      debugShowCheckedModeBanner: false,
      home: _defaultHome,
    );
  }
}

// ====================== QR SCANNER PAGE ======================
class QRScannerPage extends StatefulWidget {
  final String token;
  const QRScannerPage({super.key, required this.token});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  bool _isScanned = false;
  final MobileScannerController _controller = MobileScannerController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _refocusCamera() async {
    await _controller.stop();
    await _controller.start();
    debugPrint("Camera refocused");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Scanner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsPage()),
              );
            },
          ),
        ],
      ),
      body: GestureDetector(
        onTapDown: (_) => _refocusCamera(),
        child: Stack(
          children: [
            MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                if (_isScanned) return;
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  final String code = barcode.rawValue ?? 'Unknown';
                  setState(() => _isScanned = true);

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ResultPage(
                        studentInfo: code,
                        scanDate: DateTime.now(),
                      ),
                    ),
                  ).then((_) => setState(() => _isScanned = false));
                }
              },
            ),
            Center(
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: const Color.fromRGBO(252, 191, 21, 1),
                    width: 4,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            Positioned(
              bottom: 50,
              left: 0,
              right: 0,
              child: const Text(
                "Align the QR code within the box",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  shadows: [Shadow(blurRadius: 5, color: Colors.black)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
