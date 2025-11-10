import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'report_page.dart';

class ResultPage extends StatelessWidget {
  final String studentInfo;   // <-- matches main.dart's studentInfo
  final DateTime scanDate;    // <-- matches main.dart's scanDate

  const ResultPage({
    super.key,
    required this.studentInfo,
    required this.scanDate,
  });

  @override
  Widget build(BuildContext context) {
    final String formattedDate =
    DateFormat('yyyy-MM-dd – kk:mm').format(scanDate);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Result'),
        backgroundColor: const Color.fromRGBO(26, 24, 81, 1), // Pantone Neutral Black C
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Center( // center the whole column
          child: Column(
            mainAxisSize: MainAxisSize.min, // center vertically without stretching
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'Scanned QR Code:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                studentInfo,
                style: const TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              const Text(
                'Scanned At:',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                formattedDate,
                style: const TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromRGBO(26, 24, 81, 1), // Pantone 298 C
                  foregroundColor: const Color.fromRGBO(252, 179, 21, 1),
                ),
                onPressed: () {
                  // Navigate to ReportPage directly and pass the same named params
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ReportPage(
                        studentInfo: studentInfo,
                        scanDate: scanDate,
                      ),
                    ),
                  );
                },
                child: const Text("Generate Report"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
