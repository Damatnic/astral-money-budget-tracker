#!/usr/bin/env node

/**
 * Test Coverage Analysis and Reporting Script
 * Generates comprehensive test coverage reports and analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestCoverageReporter {
  constructor() {
    this.projectRoot = process.cwd();
    this.coverageDir = path.join(this.projectRoot, 'coverage');
    this.reportsDir = path.join(this.projectRoot, 'test-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async generateReport() {
    console.log('🧪 Starting comprehensive test coverage analysis...\n');

    try {
      // Ensure directories exist
      this.ensureDirectories();

      // Run tests with coverage
      console.log('📊 Running tests with coverage...');
      await this.runTestsWithCoverage();

      // Parse coverage data
      console.log('📈 Analyzing coverage data...');
      const coverageData = await this.parseCoverageData();

      // Generate detailed analysis
      console.log('🔍 Generating detailed analysis...');
      const analysis = await this.analyzeCoverage(coverageData);

      // Create reports
      console.log('📋 Creating reports...');
      await this.createReports(analysis);

      // Display summary
      this.displaySummary(analysis);

      console.log('\n✅ Test coverage analysis complete!');
      console.log(`📁 Reports saved to: ${this.reportsDir}`);

    } catch (error) {
      console.error('❌ Error generating coverage report:', error.message);
      process.exit(1);
    }
  }

  ensureDirectories() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runTestsWithCoverage() {
    try {
      execSync('npm test -- --coverage --watchAll=false', {
        stdio: 'inherit',
        cwd: this.projectRoot,
      });
    } catch (error) {
      // Tests might fail but we still want coverage data
      console.warn('⚠️  Some tests failed, but continuing with coverage analysis...');
    }
  }

  async parseCoverageData() {
    const coverageFile = path.join(this.coverageDir, 'coverage-final.json');
    
    if (!fs.existsSync(coverageFile)) {
      throw new Error('Coverage data not found. Make sure tests ran successfully.');
    }

    const rawData = fs.readFileSync(coverageFile, 'utf8');
    return JSON.parse(rawData);
  }

  async analyzeCoverage(coverageData) {
    const analysis = {
      summary: {
        totalFiles: 0,
        coveredFiles: 0,
        statements: { covered: 0, total: 0, percentage: 0 },
        branches: { covered: 0, total: 0, percentage: 0 },
        functions: { covered: 0, total: 0, percentage: 0 },
        lines: { covered: 0, total: 0, percentage: 0 },
      },
      fileAnalysis: [],
      categories: {
        components: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
        utils: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
        api: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
        lib: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
        other: { files: [], coverage: { statements: 0, branches: 0, functions: 0, lines: 0 } },
      },
      recommendations: [],
      trends: [],
    };

    // Analyze each file
    for (const [filePath, fileData] of Object.entries(coverageData)) {
      if (filePath.includes('node_modules') || filePath.includes('__tests__')) {
        continue;
      }

      analysis.summary.totalFiles++;

      const fileAnalysis = this.analyzeFile(filePath, fileData);
      analysis.fileAnalysis.push(fileAnalysis);

      // Update summary totals
      analysis.summary.statements.covered += fileData.s ? Object.values(fileData.s).filter(v => v > 0).length : 0;
      analysis.summary.statements.total += fileData.s ? Object.keys(fileData.s).length : 0;
      
      analysis.summary.branches.covered += fileData.b ? Object.values(fileData.b).flat().filter(v => v > 0).length : 0;
      analysis.summary.branches.total += fileData.b ? Object.values(fileData.b).flat().length : 0;
      
      analysis.summary.functions.covered += fileData.f ? Object.values(fileData.f).filter(v => v > 0).length : 0;
      analysis.summary.functions.total += fileData.f ? Object.keys(fileData.f).length : 0;
      
      analysis.summary.lines.covered += fileData.l ? Object.values(fileData.l).filter(v => v > 0).length : 0;
      analysis.summary.lines.total += fileData.l ? Object.keys(fileData.l).length : 0;

      // Categorize file
      this.categorizeFile(filePath, fileAnalysis, analysis.categories);

      // Check if file has any coverage
      if (fileAnalysis.coverage.statements.percentage > 0) {
        analysis.summary.coveredFiles++;
      }
    }

    // Calculate percentages
    analysis.summary.statements.percentage = this.calculatePercentage(
      analysis.summary.statements.covered,
      analysis.summary.statements.total
    );
    analysis.summary.branches.percentage = this.calculatePercentage(
      analysis.summary.branches.covered,
      analysis.summary.branches.total
    );
    analysis.summary.functions.percentage = this.calculatePercentage(
      analysis.summary.functions.covered,
      analysis.summary.functions.total
    );
    analysis.summary.lines.percentage = this.calculatePercentage(
      analysis.summary.lines.covered,
      analysis.summary.lines.total
    );

    // Calculate category averages
    this.calculateCategoryAverages(analysis.categories);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  analyzeFile(filePath, fileData) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    const statements = {
      covered: fileData.s ? Object.values(fileData.s).filter(v => v > 0).length : 0,
      total: fileData.s ? Object.keys(fileData.s).length : 0,
    };
    
    const branches = {
      covered: fileData.b ? Object.values(fileData.b).flat().filter(v => v > 0).length : 0,
      total: fileData.b ? Object.values(fileData.b).flat().length : 0,
    };
    
    const functions = {
      covered: fileData.f ? Object.values(fileData.f).filter(v => v > 0).length : 0,
      total: fileData.f ? Object.keys(fileData.f).length : 0,
    };
    
    const lines = {
      covered: fileData.l ? Object.values(fileData.l).filter(v => v > 0).length : 0,
      total: fileData.l ? Object.keys(fileData.l).length : 0,
    };

    return {
      path: relativePath,
      fullPath: filePath,
      coverage: {
        statements: {
          ...statements,
          percentage: this.calculatePercentage(statements.covered, statements.total),
        },
        branches: {
          ...branches,
          percentage: this.calculatePercentage(branches.covered, branches.total),
        },
        functions: {
          ...functions,
          percentage: this.calculatePercentage(functions.covered, functions.total),
        },
        lines: {
          ...lines,
          percentage: this.calculatePercentage(lines.covered, lines.total),
        },
      },
      uncoveredLines: this.getUncoveredLines(fileData),
      complexity: this.estimateComplexity(fileData),
    };
  }

  categorizeFile(filePath, fileAnalysis, categories) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    if (relativePath.includes('/components/')) {
      categories.components.files.push(fileAnalysis);
    } else if (relativePath.includes('/utils/')) {
      categories.utils.files.push(fileAnalysis);
    } else if (relativePath.includes('/api/')) {
      categories.api.files.push(fileAnalysis);
    } else if (relativePath.includes('/lib/')) {
      categories.lib.files.push(fileAnalysis);
    } else {
      categories.other.files.push(fileAnalysis);
    }
  }

  calculateCategoryAverages(categories) {
    for (const [categoryName, category] of Object.entries(categories)) {
      if (category.files.length === 0) continue;

      const totals = category.files.reduce((acc, file) => {
        acc.statements += file.coverage.statements.percentage;
        acc.branches += file.coverage.branches.percentage;
        acc.functions += file.coverage.functions.percentage;
        acc.lines += file.coverage.lines.percentage;
        return acc;
      }, { statements: 0, branches: 0, functions: 0, lines: 0 });

      category.coverage = {
        statements: Math.round(totals.statements / category.files.length),
        branches: Math.round(totals.branches / category.files.length),
        functions: Math.round(totals.functions / category.files.length),
        lines: Math.round(totals.lines / category.files.length),
      };
    }
  }

  getUncoveredLines(fileData) {
    if (!fileData.l) return [];
    
    return Object.entries(fileData.l)
      .filter(([line, hits]) => hits === 0)
      .map(([line]) => parseInt(line));
  }

  estimateComplexity(fileData) {
    // Simple complexity estimation based on branches and functions
    const branchCount = fileData.b ? Object.keys(fileData.b).length : 0;
    const functionCount = fileData.f ? Object.keys(fileData.f).length : 0;
    
    if (branchCount + functionCount > 20) return 'high';
    if (branchCount + functionCount > 10) return 'medium';
    return 'low';
  }

  calculatePercentage(covered, total) {
    if (total === 0) return 100;
    return Math.round((covered / total) * 100);
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Overall coverage recommendations
    if (analysis.summary.statements.percentage < 80) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `Overall statement coverage is ${analysis.summary.statements.percentage}%. Aim for 80%+ coverage.`,
        action: 'Add more unit tests for core functionality.',
      });
    }

    if (analysis.summary.branches.percentage < 70) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `Branch coverage is ${analysis.summary.branches.percentage}%. Focus on testing edge cases and error conditions.`,
        action: 'Add tests for if/else branches, error handling, and conditional logic.',
      });
    }

    // File-specific recommendations
    const lowCoverageFiles = analysis.fileAnalysis
      .filter(file => file.coverage.statements.percentage < 50)
      .sort((a, b) => a.coverage.statements.percentage - b.coverage.statements.percentage)
      .slice(0, 5);

    lowCoverageFiles.forEach(file => {
      recommendations.push({
        type: 'file',
        priority: file.coverage.statements.percentage < 20 ? 'critical' : 'medium',
        message: `${file.path} has ${file.coverage.statements.percentage}% statement coverage.`,
        action: `Add comprehensive tests for ${file.path}`,
        file: file.path,
      });
    });

    // Complex files with low coverage
    const complexLowCoverageFiles = analysis.fileAnalysis
      .filter(file => file.complexity === 'high' && file.coverage.statements.percentage < 70);

    complexLowCoverageFiles.forEach(file => {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: `${file.path} is complex but has only ${file.coverage.statements.percentage}% coverage.`,
        action: `Prioritize testing for this complex file: ${file.path}`,
        file: file.path,
      });
    });

    // Category-specific recommendations
    Object.entries(analysis.categories).forEach(([category, data]) => {
      if (data.files.length > 0 && data.coverage.statements < 60) {
        recommendations.push({
          type: 'category',
          priority: 'medium',
          message: `${category} category has low coverage (${data.coverage.statements}%).`,
          action: `Focus testing efforts on ${category} files.`,
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async createReports(analysis) {
    // Create JSON report
    await this.createJSONReport(analysis);
    
    // Create HTML report
    await this.createHTMLReport(analysis);
    
    // Create CSV report
    await this.createCSVReport(analysis);
    
    // Create markdown summary
    await this.createMarkdownSummary(analysis);
  }

  async createJSONReport(analysis) {
    const reportPath = path.join(this.reportsDir, `coverage-analysis-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  }

  async createHTMLReport(analysis) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .progress-bar { width: 100px; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; }
        .recommendation { margin-bottom: 10px; padding: 10px; border-left: 4px solid #007bff; background: white; }
        .recommendation.critical { border-left-color: #dc3545; }
        .recommendation.high { border-left-color: #fd7e14; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Test Coverage Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${this.getCoverageClass(analysis.summary.statements.percentage)}">
                    ${analysis.summary.statements.percentage}%
                </div>
                <div class="metric-label">Statement Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getCoverageClass(analysis.summary.branches.percentage)}">
                    ${analysis.summary.branches.percentage}%
                </div>
                <div class="metric-label">Branch Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getCoverageClass(analysis.summary.functions.percentage)}">
                    ${analysis.summary.functions.percentage}%
                </div>
                <div class="metric-label">Function Coverage</div>
            </div>
            <div class="metric">
                <div class="metric-value ${this.getCoverageClass(analysis.summary.lines.percentage)}">
                    ${analysis.summary.lines.percentage}%
                </div>
                <div class="metric-label">Line Coverage</div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Coverage by Category</h2>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Files</th>
                        <th>Statements</th>
                        <th>Branches</th>
                        <th>Functions</th>
                        <th>Lines</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(analysis.categories)
                      .filter(([_, data]) => data.files.length > 0)
                      .map(([category, data]) => `
                        <tr>
                            <td><strong>${category.charAt(0).toUpperCase() + category.slice(1)}</strong></td>
                            <td>${data.files.length}</td>
                            <td>${data.coverage.statements}%</td>
                            <td>${data.coverage.branches}%</td>
                            <td>${data.coverage.functions}%</td>
                            <td>${data.coverage.lines}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🎯 Recommendations</h2>
            <div class="recommendations">
                ${analysis.recommendations.slice(0, 10).map(rec => `
                    <div class="recommendation ${rec.priority}">
                        <strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}
                        <br><em>Action: ${rec.action}</em>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📁 File Coverage Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Statements</th>
                        <th>Branches</th>
                        <th>Functions</th>
                        <th>Lines</th>
                        <th>Complexity</th>
                    </tr>
                </thead>
                <tbody>
                    ${analysis.fileAnalysis
                      .sort((a, b) => a.coverage.statements.percentage - b.coverage.statements.percentage)
                      .slice(0, 20)
                      .map(file => `
                        <tr>
                            <td><code>${file.path}</code></td>
                            <td>${file.coverage.statements.percentage}%</td>
                            <td>${file.coverage.branches.percentage}%</td>
                            <td>${file.coverage.functions.percentage}%</td>
                            <td>${file.coverage.lines.percentage}%</td>
                            <td><span class="complexity-${file.complexity}">${file.complexity}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(this.reportsDir, `coverage-report-${this.timestamp}.html`);
    fs.writeFileSync(reportPath, htmlContent);
  }

  async createCSVReport(analysis) {
    const csvHeaders = 'File,Statements %,Branches %,Functions %,Lines %,Complexity\n';
    const csvRows = analysis.fileAnalysis
      .map(file => [
        file.path,
        file.coverage.statements.percentage,
        file.coverage.branches.percentage,
        file.coverage.functions.percentage,
        file.coverage.lines.percentage,
        file.complexity,
      ].join(','))
      .join('\n');

    const csvContent = csvHeaders + csvRows;
    const reportPath = path.join(this.reportsDir, `coverage-data-${this.timestamp}.csv`);
    fs.writeFileSync(reportPath, csvContent);
  }

  async createMarkdownSummary(analysis) {
    const markdownContent = `# Test Coverage Summary

Generated on: ${new Date().toLocaleString()}

## 📊 Overall Coverage

| Metric | Coverage | Status |
|--------|----------|--------|
| Statements | ${analysis.summary.statements.percentage}% | ${this.getCoverageStatus(analysis.summary.statements.percentage)} |
| Branches | ${analysis.summary.branches.percentage}% | ${this.getCoverageStatus(analysis.summary.branches.percentage)} |
| Functions | ${analysis.summary.functions.percentage}% | ${this.getCoverageStatus(analysis.summary.functions.percentage)} |
| Lines | ${analysis.summary.lines.percentage}% | ${this.getCoverageStatus(analysis.summary.lines.percentage)} |

## 📈 Coverage by Category

| Category | Files | Statements | Branches | Functions | Lines |
|----------|-------|------------|----------|-----------|-------|
${Object.entries(analysis.categories)
  .filter(([_, data]) => data.files.length > 0)
  .map(([category, data]) => 
    `| ${category.charAt(0).toUpperCase() + category.slice(1)} | ${data.files.length} | ${data.coverage.statements}% | ${data.coverage.branches}% | ${data.coverage.functions}% | ${data.coverage.lines}% |`
  ).join('\n')}

## 🎯 Top Recommendations

${analysis.recommendations.slice(0, 5).map((rec, i) => 
  `${i + 1}. **${rec.priority.toUpperCase()}**: ${rec.message}\n   - Action: ${rec.action}\n`
).join('\n')}

## 📁 Files Needing Attention

${analysis.fileAnalysis
  .filter(file => file.coverage.statements.percentage < 50)
  .slice(0, 10)
  .map(file => `- \`${file.path}\` - ${file.coverage.statements.percentage}% coverage`)
  .join('\n')}

---

*Report generated by Astral Money Test Coverage Analyzer*
`;

    const reportPath = path.join(this.reportsDir, `coverage-summary-${this.timestamp}.md`);
    fs.writeFileSync(reportPath, markdownContent);
  }

  getCoverageClass(percentage) {
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'warning';
    return 'danger';
  }

  getCoverageStatus(percentage) {
    if (percentage >= 80) return '✅ Good';
    if (percentage >= 60) return '⚠️ Needs Improvement';
    return '❌ Critical';
  }

  displaySummary(analysis) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST COVERAGE ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n📈 OVERALL COVERAGE:');
    console.log(`  Statements: ${analysis.summary.statements.percentage}% (${analysis.summary.statements.covered}/${analysis.summary.statements.total})`);
    console.log(`  Branches:   ${analysis.summary.branches.percentage}% (${analysis.summary.branches.covered}/${analysis.summary.branches.total})`);
    console.log(`  Functions:  ${analysis.summary.functions.percentage}% (${analysis.summary.functions.covered}/${analysis.summary.functions.total})`);
    console.log(`  Lines:      ${analysis.summary.lines.percentage}% (${analysis.summary.lines.covered}/${analysis.summary.lines.total})`);
    
    console.log('\n📁 FILES:');
    console.log(`  Total files: ${analysis.summary.totalFiles}`);
    console.log(`  Files with coverage: ${analysis.summary.coveredFiles}`);
    console.log(`  Files without coverage: ${analysis.summary.totalFiles - analysis.summary.coveredFiles}`);

    console.log('\n🎯 TOP RECOMMENDATIONS:');
    analysis.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
    });

    console.log('\n' + '='.repeat(60));
  }
}

// Run the coverage reporter
if (require.main === module) {
  const reporter = new TestCoverageReporter();
  reporter.generateReport().catch(error => {
    console.error('Failed to generate coverage report:', error);
    process.exit(1);
  });
}

module.exports = TestCoverageReporter;
