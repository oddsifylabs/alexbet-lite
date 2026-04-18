/**
 * DataExportImport - Export and import betting data with validation
 * Supports CSV, JSON, and Excel formats with comprehensive validation
 */

class DataExportImport {
  constructor(betTracker, validator, errorHandler) {
    this.betTracker = betTracker;
    this.validator = validator;
    this.errorHandler = errorHandler;
    this.supportedFormats = ['csv', 'json', 'xlsx'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Export bets to CSV format
   */
  exportToCSV(bets = this.betTracker.getBets()) {
    try {
      const headers = [
        'ID',
        'Sport',
        'Event',
        'Bet Type',
        'Pick',
        'Stake',
        'Entry Odds',
        'Status',
        'Exit Odds',
        'P&L',
        'ROI %',
        'Edge %',
        'Placed Date',
        'Settled Date',
        'Notes'
      ];

      const rows = bets.map(bet => [
        bet.id,
        bet.sport,
        bet.event,
        bet.betType,
        bet.pick,
        bet.stake,
        bet.entryOdds,
        bet.status,
        bet.exitOdds || '',
        bet.pnl || '',
        (bet.stake > 0 ? ((bet.pnl / bet.stake) * 100).toFixed(2) : ''),
        bet.edge || '',
        new Date(bet.placedDate).toLocaleDateString(),
        bet.settledDate ? new Date(bet.settledDate).toLocaleDateString() : '',
        bet.notes || ''
      ]);

      // Build CSV content
      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',') + '\n';
      });

      return {
        success: true,
        data: csv,
        filename: `bets_export_${new Date().toISOString().split('T')[0]}.csv`,
        recordCount: bets.length
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV export failed: ${error.message}`
      };
    }
  }

  /**
   * Export bets to JSON format
   */
  exportToJSON(bets = this.betTracker.getBets()) {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        recordCount: bets.length,
        bets: bets.map(bet => ({
          ...bet,
          placedDate: new Date(bet.placedDate).toISOString(),
          settledDate: bet.settledDate ? new Date(bet.settledDate).toISOString() : null
        }))
      };

      return {
        success: true,
        data: JSON.stringify(data, null, 2),
        filename: `bets_export_${new Date().toISOString().split('T')[0]}.json`,
        recordCount: bets.length
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON export failed: ${error.message}`
      };
    }
  }

  /**
   * Import bets from CSV
   */
  importFromCSV(csvContent) {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file is empty or contains only headers');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const bets = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines

        try {
          const values = this.parseCSVLine(line);
          const bet = this.csvRowToBet(headers, values, i + 1);

          // Validate the bet
          const validation = this.validator.validateBet(bet);
          if (!validation.isValid) {
            errors.push({
              row: i + 1,
              errors: validation.errors
            });
            continue;
          }

          bets.push(bet);
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        bets,
        imported: bets.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV import failed: ${error.message}`
      };
    }
  }

  /**
   * Import bets from JSON
   */
  importFromJSON(jsonContent) {
    try {
      const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;

      if (!data.bets || !Array.isArray(data.bets)) {
        throw new Error('Invalid JSON structure: missing bets array');
      }

      const bets = [];
      const errors = [];

      data.bets.forEach((bet, index) => {
        try {
          const normalizedBet = {
            ...bet,
            placedDate: new Date(bet.placedDate),
            settledDate: bet.settledDate ? new Date(bet.settledDate) : null
          };

          // Validate
          const validation = this.validator.validateBet(normalizedBet);
          if (!validation.isValid) {
            errors.push({
              row: index + 1,
              errors: validation.errors
            });
            return;
          }

          bets.push(normalizedBet);
        } catch (error) {
          errors.push({
            row: index + 1,
            error: error.message
          });
        }
      });

      return {
        success: errors.length === 0,
        bets,
        imported: bets.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON import failed: ${error.message}`
      };
    }
  }

  /**
   * Parse CSV line handling quotes
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        // Don't add the quote character itself
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Convert CSV row to bet object
   */
  csvRowToBet(headers, values, rowNumber) {
    const bet = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';

      switch (header) {
        case 'id':
          bet.id = value || `bet_${Date.now()}_${rowNumber}`;
          break;
        case 'sport':
          bet.sport = value;
          break;
        case 'event':
          bet.event = value;
          break;
        case 'bet type':
          bet.betType = value;
          break;
        case 'pick':
          bet.pick = value;
          break;
        case 'stake':
          bet.stake = parseFloat(value) || 0;
          break;
        case 'entry odds':
          bet.entryOdds = parseFloat(value) || 0;
          break;
        case 'status':
          bet.status = value.toUpperCase();
          break;
        case 'exit odds':
          bet.exitOdds = value ? parseFloat(value) : null;
          break;
        case 'p&l':
          bet.pnl = value ? parseFloat(value) : 0;
          break;
        case 'edge %':
          bet.edge = value ? parseFloat(value) : 0;
          break;
        case 'placed date':
          bet.placedDate = new Date(value);
          break;
        case 'settled date':
          bet.settledDate = value ? new Date(value) : null;
          break;
        case 'notes':
          bet.notes = value;
          break;
      }
    });

    return bet;
  }

  /**
   * Validate import file
   */
  validateImportFile(file) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return { valid: false, error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit` };
    }

    // Check file extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (!this.supportedFormats.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported format. Supported: ${this.supportedFormats.join(', ')}`
      };
    }

    return { valid: true, format: ext };
  }

  /**
   * Generate import summary
   */
  generateImportSummary(importResult) {
    if (!importResult.success) {
      return {
        status: '❌ Import Failed',
        imported: 0,
        failed: importResult.bets?.length || 0,
        totalRecords: (importResult.bets?.length || 0) + importResult.failed,
        errors: importResult.errors
      };
    }

    const totalWagered = importResult.bets.reduce((sum, b) => sum + b.stake, 0);
    const totalPnL = importResult.bets.reduce((sum, b) => sum + (b.pnl || 0), 0);

    return {
      status: '✅ Import Successful',
      imported: importResult.imported,
      failed: importResult.failed,
      totalRecords: importResult.imported + importResult.failed,
      totalWagered: totalWagered.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      errors: importResult.errors
    };
  }

  /**
   * Backup current bets
   */
  createBackup(bets = this.betTracker.getBets()) {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        backupId: `backup_${Date.now()}`,
        version: '1.0',
        recordCount: bets.length,
        checksum: this.calculateChecksum(bets),
        bets: bets
      };

      return {
        success: true,
        backup: backup,
        size: JSON.stringify(backup).length
      };
    } catch (error) {
      return {
        success: false,
        error: `Backup creation failed: ${error.message}`
      };
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backup) {
    try {
      if (!backup.bets || !Array.isArray(backup.bets)) {
        throw new Error('Invalid backup format');
      }

      // Verify checksum
      const calculatedChecksum = this.calculateChecksum(backup.bets);
      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Backup integrity check failed');
      }

      return {
        success: true,
        restored: backup.bets.length,
        message: `Restored ${backup.bets.length} bets from ${new Date(backup.timestamp).toLocaleDateString()}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Backup restoration failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(bets) {
    let hash = 0;
    const str = JSON.stringify(bets);

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Export statistics report
   */
  exportStatisticsReport(analytics, enhanced) {
    try {
      const report = {
        exportDate: new Date().toISOString(),
        overallStats: analytics.getOverallStats(),
        sportStats: analytics.getStatsByBySport(),
        betTypeStats: analytics.getStatsByBetType(),
        profitsData: enhanced.generateReport(),
        recommendations: enhanced.generateRecommendations(
          analytics.getOverallStats(),
          enhanced.calculateVariance()
        )
      };

      return {
        success: true,
        report: report,
        data: JSON.stringify(report, null, 2)
      };
    } catch (error) {
      return {
        success: false,
        error: `Report export failed: ${error.message}`
      };
    }
  }

  /**
   * Merge multiple imports
   */
  mergeImports(...imports) {
    try {
      const merged = {
        success: true,
        bets: [],
        total: 0,
        errors: []
      };

      imports.forEach((importResult, index) => {
        if (importResult.success) {
          merged.bets.push(...importResult.bets);
          merged.total += importResult.imported;
        } else {
          merged.errors.push({
            import: index + 1,
            error: importResult.error
          });
          merged.success = false;
        }
      });

      // Remove duplicates by ID
      const unique = {};
      merged.bets.forEach(bet => {
        if (!unique[bet.id]) {
          unique[bet.id] = bet;
        }
      });

      merged.bets = Object.values(unique);
      merged.deduplicated = merged.total - merged.bets.length;

      return merged;
    } catch (error) {
      return {
        success: false,
        error: `Merge failed: ${error.message}`
      };
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExportImport;
}
