export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface WelcomeEmailData {
  userName: string;
}

interface WeeklySummaryData {
  userName: string;
  week: number;
  gamesAnalyzed: number;
  topEdges: Array<{ game: string; edge: number; market: string }>;
  accuracy: number;
}

interface GameAlertData {
  userName: string;
  awayTeam: string;
  homeTeam: string;
  market: string;
  modelProbability: number;
  impliedProbability: number;
  edge: number;
  gameId: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const safeName = escapeHtml(data.userName);
  
  return {
    subject: 'Welcome to NFL Analytics Pro',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #013369 0%, #d50a0a 100%); color: white; padding: 32px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">NFL Analytics Pro</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">AI-Powered Sports Prediction</p>
        </div>
        
        <div style="padding: 32px 20px;">
          <h2 style="color: #013369; margin: 0 0 16px 0;">Welcome, ${safeName}!</h2>
          
          <p style="color: #333; line-height: 1.6; margin: 0 0 16px 0;">
            Thank you for joining NFL Analytics Pro. Your account has been verified and you're ready to start exploring AI-powered predictions.
          </p>
          
          <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0;">
            <strong>What's next?</strong><br/>
            • Explore today's game predictions<br/>
            • Track high-value betting edges<br/>
            • Customize your notification preferences
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ai-odds.dynamicaihub.com" style="display: inline-block; background: #d50a0a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Explore Predictions
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
            Questions? Visit your <a href="https://ai-odds.dynamicaihub.com/account" style="color: #d50a0a;">account settings</a> to manage preferences.
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0 0 8px 0;">Powered by Dynamic AI HUB</p>
          <p style="margin: 0;">
            <a href="https://ai-odds.dynamicaihub.com/account" style="color: #d50a0a; text-decoration: none;">Manage Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `Welcome to NFL Analytics Pro!\n\nHi ${safeName},\n\nThank you for joining NFL Analytics Pro. Your account has been verified and you're ready to start exploring AI-powered predictions.\n\nWhat's next?\n• Explore today's game predictions\n• Track high-value betting edges\n• Customize your notification preferences\n\nVisit https://ai-odds.dynamicaihub.com to get started.\n\nQuestions? Manage your account at https://ai-odds.dynamicaihub.com/account\n\nPowered by Dynamic AI HUB`
  };
}

export function generateWeeklySummaryEmail(data: WeeklySummaryData): EmailTemplate {
  const safeName = escapeHtml(data.userName);
  const topEdgesHtml = data.topEdges.slice(0, 5).map(edge => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${escapeHtml(edge.game)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${escapeHtml(edge.market)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; color: #d50a0a; font-weight: 600;">${edge.edge.toFixed(1)}%</td>
    </tr>
  `).join('');

  return {
    subject: `NFL Analytics Pro - Week ${data.week} Summary`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #013369 0%, #d50a0a 100%); color: white; padding: 32px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Week ${data.week} Summary</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">NFL Analytics Pro</p>
        </div>
        
        <div style="padding: 32px 20px;">
          <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0;">
            Hi ${safeName},
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #d50a0a; padding: 16px; margin: 0 0 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #013369;">This Week's Performance</h3>
            <p style="margin: 0; color: #333; font-size: 14px;">
              <strong>Games Analyzed:</strong> ${data.gamesAnalyzed}<br/>
              <strong>Model Accuracy:</strong> ${data.accuracy.toFixed(1)}%
            </p>
          </div>
          
          <h3 style="color: #013369; margin: 0 0 16px 0;">Top High-Value Edges</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Game</th>
                <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Market</th>
                <th style="padding: 12px; text-align: left; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Edge</th>
              </tr>
            </thead>
            <tbody>
              ${topEdgesHtml}
            </tbody>
          </table>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ai-odds.dynamicaihub.com/historical" style="display: inline-block; background: #d50a0a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Full Analysis
            </a>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0 0 8px 0;">Powered by Dynamic AI HUB</p>
          <p style="margin: 0;">
            <a href="https://ai-odds.dynamicaihub.com/account" style="color: #d50a0a; text-decoration: none;">Manage Preferences</a> | 
            <a href="https://ai-odds.dynamicaihub.com/unsubscribe?type=weekly" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `,
    text: `NFL Analytics Pro - Week ${data.week} Summary\n\nHi ${safeName},\n\nThis Week's Performance:\n• Games Analyzed: ${data.gamesAnalyzed}\n• Model Accuracy: ${data.accuracy.toFixed(1)}%\n\nTop High-Value Edges:\n${data.topEdges.slice(0, 5).map(e => `• ${e.game} (${e.market}): ${e.edge.toFixed(1)}% edge`).join('\n')}\n\nView full analysis: https://ai-odds.dynamicaihub.com/historical\n\nManage preferences: https://ai-odds.dynamicaihub.com/account\nUnsubscribe: https://ai-odds.dynamicaihub.com/unsubscribe?type=weekly`
  };
}

export function generateGameAlertEmail(data: GameAlertData): EmailTemplate {
  const safeName = escapeHtml(data.userName);
  const safeAway = escapeHtml(data.awayTeam);
  const safeHome = escapeHtml(data.homeTeam);
  const safeMarket = escapeHtml(data.market);
  
  return {
    subject: `🚨 High-Value Edge Alert: ${data.awayTeam} @ ${data.homeTeam}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #d50a0a 0%, #a00000 100%); color: white; padding: 32px 20px; text-align: center;">
          <div style="font-size: 48px; margin: 0 0 8px 0;">🚨</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">High-Value Edge Alert</h1>
        </div>
        
        <div style="padding: 32px 20px;">
          <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0;">
            Hi ${safeName},
          </p>
          
          <p style="color: #333; line-height: 1.6; margin: 0 0 24px 0;">
            A significant betting edge has been detected for an upcoming game:
          </p>
          
          <div style="background: #f8f9fa; border: 2px solid #d50a0a; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
            <h2 style="margin: 0 0 16px 0; color: #013369; text-align: center;">
              ${safeAway} @ ${safeHome}
            </h2>
            
            <table style="width: 100%; margin: 16px 0 0 0;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Market:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600; text-align: right;">${safeMarket}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Model Probability:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600; text-align: right;">${data.modelProbability.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Implied Probability:</td>
                <td style="padding: 8px 0; color: #333; font-weight: 600; text-align: right;">${data.impliedProbability.toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Edge:</td>
                <td style="padding: 8px 0; color: #d50a0a; font-weight: 700; font-size: 18px; text-align: right;">${data.edge.toFixed(1)}% ⚡</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ai-odds.dynamicaihub.com/game/${data.gameId}" style="display: inline-block; background: #d50a0a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Full Analysis
            </a>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 24px 0 0 0;">
            <p style="margin: 0; color: #856404; font-size: 13px;">
              <strong>Disclaimer:</strong> This is for informational purposes only. Always gamble responsibly.
            </p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0 0 8px 0;">Powered by Dynamic AI HUB</p>
          <p style="margin: 0;">
            <a href="https://ai-odds.dynamicaihub.com/account" style="color: #d50a0a; text-decoration: none;">Manage Preferences</a> | 
            <a href="https://ai-odds.dynamicaihub.com/unsubscribe?type=alerts" style="color: #999; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `,
    text: `🚨 High-Value Edge Alert\n\nHi ${safeName},\n\nA significant betting edge has been detected:\n\nGame: ${data.awayTeam} @ ${data.homeTeam}\nMarket: ${data.market}\nModel Probability: ${data.modelProbability.toFixed(1)}%\nImplied Probability: ${data.impliedProbability.toFixed(1)}%\nEdge: ${data.edge.toFixed(1)}% ⚡\n\nView full analysis: https://ai-odds.dynamicaihub.com/game/${data.gameId}\n\nDisclaimer: This is for informational purposes only. Always gamble responsibly.\n\nManage preferences: https://ai-odds.dynamicaihub.com/account\nUnsubscribe: https://ai-odds.dynamicaihub.com/unsubscribe?type=alerts`
  };
}
