import puppeteer from 'puppeteer';
import { storageService } from './storage.service.js';

interface ReportData {
  title: string;
  projectName: string;
  clientName?: string;
  generatedAt: string;
  content: string; // HTML content
}

export const pdfService = {
  async generatePDF(data: ReportData): Promise<{ buffer: Buffer; filename: string }> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #1a1a1a;
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #3b82f6;
            }
            .header h1 {
              font-size: 24px;
              color: #1a1a1a;
              margin-bottom: 5px;
            }
            .header .subtitle {
              font-size: 14px;
              color: #666;
            }
            .header .meta {
              text-align: right;
              font-size: 11px;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e5e5;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-value {
              font-size: 28px;
              font-weight: 700;
              color: #3b82f6;
            }
            .stat-value.success { color: #22c55e; }
            .stat-value.warning { color: #f59e0b; }
            .stat-value.error { color: #ef4444; }
            .stat-label {
              font-size: 11px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              padding: 10px 12px;
              text-align: left;
              border-bottom: 1px solid #e5e5e5;
            }
            th {
              background: #f8f9fa;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              color: #666;
            }
            .progress-bar {
              height: 8px;
              background: #e5e5e5;
              border-radius: 4px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: #3b82f6;
              border-radius: 4px;
            }
            .progress-fill.success { background: #22c55e; }
            .progress-fill.warning { background: #f59e0b; }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fee2e2; color: #991b1b; }
            .badge-primary { background: #dbeafe; color: #1e40af; }
            .badge-default { background: #f3f4f6; color: #374151; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              font-size: 10px;
              color: #999;
            }
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${data.projectName}</h1>
              <div class="subtitle">${data.title}</div>
              ${data.clientName ? `<div class="subtitle">Client: ${data.clientName}</div>` : ''}
            </div>
            <div class="meta">
              <div>Generated: ${new Date(data.generatedAt).toLocaleDateString()}</div>
              <div>${new Date(data.generatedAt).toLocaleTimeString()}</div>
            </div>
          </div>

          ${data.content}

          <div class="footer">
            Generated by Synax Project Management System
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      const filename = `${data.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      return {
        buffer: Buffer.from(pdfBuffer),
        filename,
      };
    } finally {
      await browser.close();
    }
  },

  async savePDFToStorage(buffer: Buffer, filename: string): Promise<string> {
    const url = await storageService.uploadBuffer(buffer, filename, 'application/pdf', 'reports');
    return url;
  },

  // Generate HTML content for summary report
  generateSummaryHTML(data: any): string {
    return `
      <div class="section">
        <h2 class="section-title">Overall Progress</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value ${data.progress.rooms >= 80 ? 'success' : data.progress.rooms >= 50 ? 'warning' : 'error'}">${data.progress.rooms}%</div>
            <div class="stat-label">Rooms Complete</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.progress.assets >= 80 ? 'success' : data.progress.assets >= 50 ? 'warning' : 'error'}">${data.progress.assets}%</div>
            <div class="stat-label">Assets Verified</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.progress.checklists >= 80 ? 'success' : data.progress.checklists >= 50 ? 'warning' : 'error'}">${data.progress.checklists}%</div>
            <div class="stat-label">Checklists Done</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.progress.issues >= 80 ? 'success' : data.progress.issues >= 50 ? 'warning' : 'error'}">${data.progress.issues}%</div>
            <div class="stat-label">Issues Resolved</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Room Status</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Count</th>
            <th>Progress</th>
          </tr>
          <tr>
            <td>Completed</td>
            <td>${data.stats.rooms.completed}</td>
            <td><div class="progress-bar"><div class="progress-fill success" style="width: ${data.stats.rooms.total > 0 ? (data.stats.rooms.completed / data.stats.rooms.total * 100) : 0}%"></div></div></td>
          </tr>
          <tr>
            <td>In Progress</td>
            <td>${data.stats.rooms.inProgress}</td>
            <td><div class="progress-bar"><div class="progress-fill" style="width: ${data.stats.rooms.total > 0 ? (data.stats.rooms.inProgress / data.stats.rooms.total * 100) : 0}%"></div></div></td>
          </tr>
          <tr>
            <td>Not Started</td>
            <td>${data.stats.rooms.notStarted}</td>
            <td><div class="progress-bar"><div class="progress-fill" style="width: ${data.stats.rooms.total > 0 ? (data.stats.rooms.notStarted / data.stats.rooms.total * 100) : 0}%"></div></div></td>
          </tr>
          <tr>
            <td>Blocked</td>
            <td>${data.stats.rooms.blocked}</td>
            <td><div class="progress-bar"><div class="progress-fill warning" style="width: ${data.stats.rooms.total > 0 ? (data.stats.rooms.blocked / data.stats.rooms.total * 100) : 0}%"></div></div></td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Issues Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.stats.issues.total}</div>
            <div class="stat-label">Total Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-value error">${data.stats.issues.open}</div>
            <div class="stat-label">Open</div>
          </div>
          <div class="stat-card">
            <div class="stat-value warning">${data.stats.issues.inProgress}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">${data.stats.issues.resolved + data.stats.issues.closed}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Inventory Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.stats.inventory.totalItems}</div>
            <div class="stat-label">Item Types</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.inventory.totalReceived}</div>
            <div class="stat-label">Total Received</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.stats.inventory.totalUsed}</div>
            <div class="stat-label">Total Used</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">${data.stats.inventory.totalInStock}</div>
            <div class="stat-label">In Stock</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Project Team</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
          ${data.project.team.map((m: any) => `
            <tr>
              <td>${m.name}</td>
              <td>${m.email}</td>
              <td><span class="badge badge-primary">${m.role}</span></td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  },

  // Generate HTML content for client report
  generateClientHTML(data: any): string {
    return `
      <div class="section">
        <h2 class="section-title">Project Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value ${data.summary.roomCompletionRate >= 80 ? 'success' : data.summary.roomCompletionRate >= 50 ? 'warning' : ''}">${data.summary.roomCompletionRate}%</div>
            <div class="stat-label">Room Completion</div>
            <div class="stat-label">${data.summary.completedRooms}/${data.summary.totalRooms}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.summary.assetCompletionRate >= 80 ? 'success' : data.summary.assetCompletionRate >= 50 ? 'warning' : ''}">${data.summary.assetCompletionRate}%</div>
            <div class="stat-label">Asset Completion</div>
            <div class="stat-label">${data.summary.completedAssets}/${data.summary.totalAssets}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value ${data.summary.openIssues > 0 ? 'warning' : 'success'}">${data.summary.openIssues}</div>
            <div class="stat-label">Open Issues</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.summary.signatureCount}</div>
            <div class="stat-label">Sign-offs</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Progress by Floor</h2>
        <table>
          <tr>
            <th>Floor</th>
            <th>Rooms</th>
            <th>Completed</th>
            <th>Progress</th>
          </tr>
          ${data.floorProgress.map((f: any) => `
            <tr>
              <td>${f.name} (Level ${f.level})</td>
              <td>${f.totalRooms}</td>
              <td>${f.completedRooms}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="progress-bar" style="flex: 1;"><div class="progress-fill ${f.completionRate >= 80 ? 'success' : f.completionRate >= 50 ? 'warning' : ''}" style="width: ${f.completionRate}%"></div></div>
                  <span>${f.completionRate}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Equipment Summary</h2>
        <table>
          <tr>
            <th>Type</th>
            <th>Total</th>
            <th>Completed</th>
            <th>Progress</th>
          </tr>
          ${data.assetsByType.map((a: any) => `
            <tr>
              <td>${a.type}</td>
              <td>${a.total}</td>
              <td>${a.completed}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="progress-bar" style="flex: 1;"><div class="progress-fill ${a.completionRate >= 80 ? 'success' : a.completionRate >= 50 ? 'warning' : ''}" style="width: ${a.completionRate}%"></div></div>
                  <span>${a.completionRate}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>

      ${data.signatures.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Sign-offs</h2>
          <table>
            <tr>
              <th>Signed By</th>
              <th>Location</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
            ${data.signatures.map((s: any) => `
              <tr>
                <td>${s.signedByName}</td>
                <td>${s.location || 'Project Level'}</td>
                <td>${s.type}</td>
                <td>${new Date(s.signedAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}
    `;
  },

  // Generate HTML content for internal report
  generateInternalHTML(data: any): string {
    return `
      <div style="background: #fee2e2; color: #991b1b; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; font-weight: 600;">
        CONFIDENTIAL - Internal Use Only
      </div>

      ${data.technicianStats && data.technicianStats.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Technician Performance</h2>
          <table>
            <tr>
              <th>Technician</th>
              <th>Checklist Items Completed</th>
              <th>Assets Installed</th>
            </tr>
            ${data.technicianStats.map((t: any) => `
              <tr>
                <td>${t.name}</td>
                <td style="text-align: center;">${t.checklistItemsCompleted}</td>
                <td style="text-align: center;">${t.assetsInstalled}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      ${data.issues && data.issues.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Issues (${data.issues.length})</h2>
          <table>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Location</th>
              <th>Created</th>
            </tr>
            ${data.issues.map((i: any) => `
              <tr>
                <td>
                  <strong>${i.title}</strong>
                  ${i.description ? `<br><span style="font-size: 10px; color: #666;">${i.description.substring(0, 100)}${i.description.length > 100 ? '...' : ''}</span>` : ''}
                </td>
                <td><span class="badge ${i.priority === 'CRITICAL' ? 'badge-error' : i.priority === 'HIGH' ? 'badge-warning' : 'badge-default'}">${i.priority}</span></td>
                <td><span class="badge ${i.status === 'OPEN' ? 'badge-error' : i.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-success'}">${i.status.replace('_', ' ')}</span></td>
                <td>${i.location || '-'}</td>
                <td>${new Date(i.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      ${data.inventory && data.inventory.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Material Usage</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Received</th>
              <th>Used</th>
              <th>In Stock</th>
            </tr>
            ${data.inventory.map((item: any) => `
              <tr>
                <td>
                  <strong>${item.itemType}</strong>
                  <br><span style="font-size: 10px; color: #666;">${item.description}</span>
                </td>
                <td style="text-align: center;">${item.received} ${item.unit}</td>
                <td style="text-align: center;">${item.used} ${item.unit}</td>
                <td style="text-align: center;"><span class="${item.inStock <= 0 ? 'badge-error' : item.inStock < 5 ? 'badge-warning' : ''}" style="font-weight: 600;">${item.inStock} ${item.unit}</span></td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      ${data.recentActivity && data.recentActivity.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Recent Activity (Last 20)</h2>
          <table>
            <tr>
              <th>Item</th>
              <th>Asset</th>
              <th>Location</th>
              <th>Completed By</th>
              <th>Date</th>
            </tr>
            ${data.recentActivity.slice(0, 20).map((a: any) => `
              <tr>
                <td>${a.itemName}</td>
                <td>${a.assetName}</td>
                <td>${a.location}</td>
                <td>${a.completedBy || '-'}</td>
                <td>${a.completedAt ? new Date(a.completedAt).toLocaleString() : '-'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      ` : ''}
    `;
  },
};
