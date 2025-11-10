import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

class ReportPage extends StatefulWidget {
  final String studentInfo;
  final DateTime scanDate;

  const ReportPage({
    super.key,
    required this.studentInfo,
    required this.scanDate,
  });

  @override
  State<ReportPage> createState() => _ReportPageState();
}

class _ReportPageState extends State<ReportPage> {
  bool _shortShorts = false;
  bool _tooRevealing = false;

  // ✅ Updated backend IP
  final String backendUrl = "http://192.168.100.12:8000/submit_report/";

  Future<void> submitReport() async {
    // Collect selected violations
    List<String> selectedViolations = [];
    if (_shortShorts) selectedViolations.add("Short Shorts");
    if (_tooRevealing) selectedViolations.add("Too Revealing Clothes");

    if (selectedViolations.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select at least one violation")),
      );
      return;
    }

    // Prepare JSON body
    final body = jsonEncode({
      "student_info": widget.studentInfo,
      "scan_date": widget.scanDate.toIso8601String(),
      "violations": selectedViolations, // <-- send list
    });

    try {
      final response = await http.post(
        Uri.parse(backendUrl),
        headers: {"Content-Type": "application/json"},
        body: body,
      );

      if (!mounted) return;

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("✅ Report submitted successfully!")),
        );
        await Future.delayed(const Duration(milliseconds: 800));
        Navigator.popUntil(context, (route) => route.isFirst);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("❌ Failed: ${response.statusCode} — ${response.body}")),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("⚠️ Network error: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('yyyy-MM-dd – kk:mm').format(widget.scanDate);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Generate Report'),
        backgroundColor: const Color.fromRGBO(26, 24, 81, 1),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "Student Information:",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.studentInfo,
                  style: const TextStyle(fontSize: 16),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  "Date & Time:",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(formattedDate, style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 20),
                const Text(
                  "Violation(s):",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                CheckboxListTile(
                  title: const Text("Short Shorts"),
                  value: _shortShorts,
                  onChanged: (val) => setState(() => _shortShorts = val ?? false),
                ),
                CheckboxListTile(
                  title: const Text("Too Revealing Clothes"),
                  value: _tooRevealing,
                  onChanged: (val) => setState(() => _tooRevealing = val ?? false),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromRGBO(26, 24, 81, 1),
                    foregroundColor: const Color.fromRGBO(252, 179, 21, 1),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  ),
                  onPressed: submitReport,
                  child: const Text("Submit Report"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
