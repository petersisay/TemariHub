import mongoose, { Types } from 'mongoose';
import { TrustedSource, ITrustedSource } from '../../models/TrustedSource.js';
import { Opportunity, IOpportunity } from '../../models/Opportunity.js';
import { AuditLog } from '../../models/AuditLog.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';

export interface DiscoveredAnnouncement {
  title: string;
  organizationName: string;
  opportunityType: 'internship' | 'entry_level_job' | 'scholarship' | 'hackathon' | 'fellowship' | 'training';
  description: string;
  location: string;
  deadline: Date;
  originalSourceUrl: string;
  applicationUrl: string;
  eligibleFields?: string[];
  eligibleLevels?: ('undergraduate' | 'postgraduate' | 'phd' | 'tvet' | 'recent_graduate')[];
  requiredSkills?: string[];
  compensation?: {
    type: 'paid' | 'unpaid' | 'stipend' | 'competitive' | 'undisclosed';
    amount?: number;
    currency?: 'ETB' | 'USD';
  };
}

export type SourceFetcherFn = (source: ITrustedSource) => Promise<DiscoveredAnnouncement[]>;

let customFetcher: SourceFetcherFn | null = null;

/**
 * Injects a mock fetcher for automated tests
 */
export function setSourceFetcherForTesting(fetcher: SourceFetcherFn | null): void {
  customFetcher = fetcher;
}

export function resetSourceFetcher(): void {
  customFetcher = null;
}

export function isPrivateOrInternalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (
    lower === 'localhost' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.localhost')
  ) {
    return true;
  }

  // Check IPv4
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata service)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
  }

  // Check IPv6 loopback / unique local / link local
  if (
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80')
  ) {
    return true;
  }

  return false;
}

export function validateSafeUrl(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`SSRF Protection: Invalid URL string: ${urlString}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF Protection: Unsupported protocol '${parsed.protocol}'. Only HTTP/HTTPS permitted.`);
  }

  if (isPrivateOrInternalHost(parsed.hostname)) {
    throw new Error(`SSRF Protection: Access to private, loopback, or metadata host '${parsed.hostname}' is strictly forbidden.`);
  }

  return parsed;
}

export async function safeFetchWithRetry(
  targetUrl: string,
  maxRetries: number = env.SOURCE_MAX_RETRIES || 3,
  timeoutMs: number = env.SOURCE_REQUEST_TIMEOUT_MS || 10000,
  customHeaders?: Record<string, string>
): Promise<{ text: string; status: number; finalUrl: string }> {
  validateSafeUrl(targetUrl);

  let currentUrl = targetUrl;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TemariHub-SourceMonitor/1.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
          ...(customHeaders || {}),
        },
      });

      clearTimeout(timeoutId);

      // Re-validate final URL in case of redirect
      if (response.url) {
        validateSafeUrl(response.url);
      }

      if (response.status === 403 || response.status === 401) {
        throw new Error(
          `Source rejected automated request with HTTP ${response.status} (anti-bot / permissions protection). Recommending manual review.`
        );
      }

      if (!response.ok) {
        throw new Error(`Source responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return { text, status: response.status, finalUrl: response.url || currentUrl };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError') {
        lastError = new Error(`Source request timed out after ${timeoutMs}ms (Attempt ${attempt}/${maxRetries})`);
      }

      if (err.message && err.message.includes('anti-bot')) {
        break; // Do not retry against anti-bot triggers
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch from ${targetUrl} after ${maxRetries} attempts.`);
}

function cleanHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses official DAAD Ethiopia WordPress RSS/Calls feed
 */
export function parseDaadRss(xmlText: string, source: ITrustedSource): DiscoveredAnnouncement[] {
  const announcements: DiscoveredAnnouncement[] = [];
  const itemMatches = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  for (const match of itemMatches) {
    const itemContent = match[1];

    const titleMatch =
      itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      itemContent.match(/<title>(.*?)<\/title>/);
    const linkMatch =
      itemContent.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) ||
      itemContent.match(/<link>(.*?)<\/link>/);
    const descMatch =
      itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      itemContent.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

    if (!titleMatch || !linkMatch) continue;

    const rawTitle = cleanHtml(titleMatch[1]);
    const rawLink = linkMatch[1].trim();
    const rawDesc = descMatch ? cleanHtml(descMatch[1]) : '';
    const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

    // Determine type
    const lowerTitle = rawTitle.toLowerCase();
    let oppType: DiscoveredAnnouncement['opportunityType'] = 'scholarship';
    if (lowerTitle.includes('intern')) oppType = 'internship';
    else if (lowerTitle.includes('fellowship')) oppType = 'fellowship';
    else if (lowerTitle.includes('vaccancy') || lowerTitle.includes('vacancy') || lowerTitle.includes('job')) oppType = 'entry_level_job';
    else if (lowerTitle.includes('training') || lowerTitle.includes('workshop')) oppType = 'training';

    // Calculate deadline (default: 60 days after publication date)
    const deadline = new Date(pubDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    announcements.push({
      title: rawTitle,
      organizationName: 'DAAD German Academic Exchange Service (Ethiopia)',
      opportunityType: oppType,
      description: rawDesc || `Official educational announcement published by DAAD Information Centre Addis Ababa: ${rawTitle}`,
      location: 'Germany / Ethiopia (Hybrid/Regional)',
      deadline,
      originalSourceUrl: rawLink,
      applicationUrl: rawLink,
      eligibleFields: ['All Academic & STEM Disciplines', 'Higher Education'],
      eligibleLevels: ['undergraduate', 'postgraduate', 'phd', 'recent_graduate'],
      compensation: {
        type: oppType === 'scholarship' || oppType === 'fellowship' ? 'stipend' : 'undisclosed',
        currency: 'USD',
      },
    });
  }

  return announcements;
}

/**
 * Parses official Major League Hacking (MLH) events from seasons JSON
 */
export function parseMlhEvents(htmlText: string, source: ITrustedSource): DiscoveredAnnouncement[] {
  const announcements: DiscoveredAnnouncement[] = [];

  // 1. Look for Inertia.js app script tag containing structured props
  const scriptMatch = htmlText.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      const pageData = JSON.parse(scriptMatch[1]);
      const upcoming = pageData.props?.upcomingEvents || [];

      for (const ev of upcoming) {
        if (!ev.name || ev.status === 'ended') continue;

        const eventStartDate = ev.startsAt ? new Date(ev.startsAt) : new Date();
        // If event has already passed, skip it
        if (eventStartDate.getTime() < Date.now()) continue;

        const isDigital = ev.formatType === 'digital' || !ev.location || ev.location.toLowerCase().includes('digital');
        const locationStr = isDigital ? 'Remote / Digital Hackathon' : `${ev.location || 'Global'}, Worldwide`;
        const appUrl = ev.websiteUrl || (ev.url ? `https://www.mlh.com${ev.url}` : 'https://www.mlh.com');

        announcements.push({
          title: ev.name,
          organizationName: 'Major League Hacking (MLH)',
          opportunityType: 'hackathon',
          description: `Official student hackathon organized under the MLH Member Season. Open to student developers, designers, and innovators worldwide.`,
          location: locationStr,
          deadline: eventStartDate,
          originalSourceUrl: appUrl,
          applicationUrl: appUrl,
          eligibleFields: ['Computer Science', 'Software Engineering', 'Information Technology', 'All STEM Disciplines'],
          eligibleLevels: ['undergraduate', 'recent_graduate'],
          requiredSkills: ['Programming', 'Hackathons', 'Team Collaboration', 'Git'],
          compensation: { type: 'unpaid' },
        });
      }

      if (announcements.length > 0) {
        return announcements;
      }
    } catch {
      // Fallback to HTML card parsing
    }
  }

  // 2. Fallback HTML event cards
  const eventCardMatches = [...htmlText.matchAll(/class="event-wrapper"[\s\S]*?<h3[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?href="([^"]*)"/g)];
  for (const match of eventCardMatches) {
    const rawTitle = cleanHtml(match[1]);
    const link = match[2];
    if (rawTitle) {
      announcements.push({
        title: rawTitle,
        organizationName: 'Major League Hacking (MLH)',
        opportunityType: 'hackathon',
        description: `Official collegiate hackathon listed in the MLH season directory.`,
        location: 'Remote / Global',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalSourceUrl: link.startsWith('http') ? link : `https://www.mlh.com${link}`,
        applicationUrl: link.startsWith('http') ? link : `https://www.mlh.com${link}`,
      });
    }
  }

  return announcements;
}

/**
 * Parses official ASTU announcements/vacancies
 */
export function parseAstuAnnouncements(htmlText: string, source: ITrustedSource): DiscoveredAnnouncement[] {
  const announcements: DiscoveredAnnouncement[] = [];
  const linkMatches = [...htmlText.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];

  for (const match of linkMatches) {
    const href = match[1];
    const rawText = cleanHtml(match[2]);
    const lower = rawText.toLowerCase();

    if (
      (lower.includes('vacancy') || lower.includes('recruitment') || lower.includes('fellowship') || lower.includes('announcement')) &&
      rawText.length > 8 &&
      !lower.startsWith('detail') &&
      !lower.startsWith('download')
    ) {
      const fullUrl = href.startsWith('http')
        ? href
        : `https://www.astu.edu.et${href.startsWith('/') ? '' : '/'}${href}`;

      announcements.push({
        title: `ASTU Announcement: ${rawText}`,
        organizationName: 'Adama Science and Technology University (ASTU)',
        opportunityType: lower.includes('fellowship') ? 'fellowship' : 'internship',
        description: `Official institutional vacancy and academic opportunity published on the ASTU portal: ${rawText}`,
        location: 'Adama, Ethiopia',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        originalSourceUrl: fullUrl,
        applicationUrl: fullUrl,
        eligibleFields: ['Engineering', 'Applied Natural Sciences', 'Computer Science & Engineering', 'All STEM Disciplines'],
        eligibleLevels: ['undergraduate', 'postgraduate', 'recent_graduate'],
      });
    }
  }

  return announcements;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base || 'opp'}-${randomSuffix}`;
}

export class SourceMonitorService {
  private static isJobRunning = false;

  /**
   * Executes source monitoring check for a single source.
   */
  static async checkSource(sourceId: string | Types.ObjectId): Promise<{
    source: ITrustedSource;
    newDiscovered: number;
    updated: number;
    errors?: string;
  }> {
    const source = await TrustedSource.findById(sourceId);
    if (!source) {
      throw new Error(`Trusted source with ID ${sourceId} not found`);
    }

    if (source.verificationStatus === 'disabled') {
      return { source, newDiscovered: 0, updated: 0 };
    }

    try {
      const announcements = await this.fetchAnnouncements(source);
      let newDiscovered = 0;
      let updatedCount = 0;

      // Find system / admin user for submission attribution
      const adminUser = await User.findOne({ role: 'admin' });
      const systemSubmitterId = adminUser?._id || new mongoose.Types.ObjectId();

      for (const ann of announcements) {
        const normalizedSourceUrl = normalizeUrl(ann.originalSourceUrl);
        const normalizedAppUrl = normalizeUrl(ann.applicationUrl);

        // Duplicate / existing record check: match by normalized source url or exact title + organization
        const existing = await Opportunity.findOne({
          $or: [
            { originalSourceUrl: ann.originalSourceUrl },
            { applicationUrl: ann.applicationUrl },
            {
              title: new RegExp(`^${ann.title.trim()}$`, 'i'),
              'organization.name': new RegExp(`^${ann.organizationName.trim()}$`, 'i'),
            },
          ],
        });

        if (existing) {
          // Check for material changes (e.g. deadline extension or details change)
          let hasMaterialChange = false;
          const oldDeadline = existing.deadline?.toISOString();
          const newDeadline = ann.deadline?.toISOString();

          if (newDeadline && oldDeadline && oldDeadline !== newDeadline) {
            existing.changeHistory.push({
              date: new Date(),
              fieldChanged: 'deadline',
              oldValue: oldDeadline,
              newValue: newDeadline,
              reason: 'Source announced updated application deadline',
              sourceEvidence: ann.originalSourceUrl,
            });
            existing.deadline = ann.deadline;
            hasMaterialChange = true;
          }

          if (ann.description && ann.description.length > existing.description.length + 50) {
            existing.changeHistory.push({
              date: new Date(),
              fieldChanged: 'description',
              oldValue: `${existing.description.slice(0, 100)}...`,
              newValue: `${ann.description.slice(0, 100)}...`,
              reason: 'Source published extended opportunity details',
              sourceEvidence: ann.originalSourceUrl,
            });
            existing.description = ann.description;
            hasMaterialChange = true;
          }

          if (hasMaterialChange) {
            existing.isMateriallyUpdated = true;
            existing.lastCheckedDate = new Date();
            // If it was expired but got an extended deadline, mark NEEDS_RECHECK or PENDING_REVIEW
            if (existing.verificationStatus === 'EXPIRED' && ann.deadline > new Date()) {
              existing.verificationStatus = 'NEEDS_RECHECK';
            }
            await existing.save();
            updatedCount++;
          } else {
            existing.lastCheckedDate = new Date();
            await existing.save();
          }
        } else {
          // Newly discovered opportunity:
          // Invariant: New discovery from approved source enters PENDING_REVIEW. Never auto-VERIFIED blindly.
          const slug = generateSlug(ann.title);
          const newOpp = await Opportunity.create({
            title: ann.title,
            slug,
            organization: {
              name: ann.organizationName,
              isVerified: true,
            },
            opportunityType: ann.opportunityType,
            description: ann.description,
            eligibleFields: ann.eligibleFields || ['All STEM Disciplines'],
            eligibleLevels: ann.eligibleLevels || ['undergraduate', 'recent_graduate'],
            requiredSkills: ann.requiredSkills || [],
            location: ann.location,
            workArrangement: 'hybrid',
            deadline: ann.deadline,
            isRollingDeadline: false,
            compensation: ann.compensation || { type: 'undisclosed' },
            originalSourceUrl: ann.originalSourceUrl,
            applicationUrl: ann.applicationUrl,
            sourceNotes: `Discovered automatically from approved source: ${source.name}`,
            moderationStatus: 'pending',
            publicationStatus: 'draft',
            verificationStatus: 'PENDING_REVIEW',
            trustedSourceId: source._id,
            sourceName: source.name,
            sourceType: 'automated_feed',
            verificationEvidence: `Official portal announcement link: ${ann.originalSourceUrl}`,
            lastCheckedDate: new Date(),
            submittedBy: systemSubmitterId,
          });

          await AuditLog.create({
            actorId: systemSubmitterId,
            targetId: newOpp._id,
            targetType: 'opportunity',
            action: 'opportunity_discovered',
            metadata: {
              sourceName: source.name,
              sourceId: source._id.toString(),
              opportunityTitle: newOpp.title,
              verificationStatus: 'PENDING_REVIEW',
            },
          });

          newDiscovered++;
        }
      }

      source.lastSuccessfulCheck = new Date();
      if (newDiscovered > 0) {
        source.lastDiscoveredOpportunityTime = new Date();
        source.opportunitiesDiscoveredCount += newDiscovered;
      }
      source.monitoringStatus = 'healthy';
      source.lastErrorMessage = undefined;
      source.failureCount = 0;
      await source.save();

      return { source, newDiscovered, updated: updatedCount };
    } catch (err: any) {
      source.failureCount += 1;
      source.lastErrorMessage = err.message || 'Unknown source monitoring error';
      source.monitoringStatus = 'failing';
      await source.save();

      return {
        source,
        newDiscovered: 0,
        updated: 0,
        errors: err.message,
      };
    }
  }

  /**
   * Sweeps all approved trusted sources. Prevents overlapping runs.
   */
  static async checkAllSources(): Promise<{
    sourcesChecked: number;
    totalDiscovered: number;
    totalUpdated: number;
    failingSources: number;
  }> {
    if (this.isJobRunning) {
      console.warn('[SourceMonitor] Job already running. Skipping overlap.');
      return { sourcesChecked: 0, totalDiscovered: 0, totalUpdated: 0, failingSources: 0 };
    }

    this.isJobRunning = true;
    try {
      const sources = await TrustedSource.find({ verificationStatus: 'approved' });
      let totalDiscovered = 0;
      let totalUpdated = 0;
      let failingSources = 0;

      for (const source of sources) {
        const res = await this.checkSource(source._id);
        totalDiscovered += res.newDiscovered;
        totalUpdated += res.updated;
        if (res.errors) {
          failingSources++;
        }
      }

      // Automatically sweep expired opportunities
      await this.sweepExpiredOpportunities();

      return {
        sourcesChecked: sources.length,
        totalDiscovered,
        totalUpdated,
        failingSources,
      };
    } finally {
      this.isJobRunning = false;
    }
  }

  /**
   * Automatically transitions past-deadline opportunities to EXPIRED.
   */
  static async sweepExpiredOpportunities(): Promise<number> {
    const now = new Date();
    const result = await Opportunity.updateMany(
      {
        deadline: { $lt: now },
        isRollingDeadline: false,
        verificationStatus: { $in: ['VERIFIED', 'PENDING_REVIEW', 'NEEDS_RECHECK'] },
      },
      {
        $set: {
          verificationStatus: 'EXPIRED',
          publicationStatus: 'expired',
          lastCheckedDate: now,
        },
      }
    );
    return result.modifiedCount;
  }

  /**
   * Internal dispatcher for fetching source data with real adapters & security protections.
   */
  private static async fetchAnnouncements(
    source: ITrustedSource
  ): Promise<DiscoveredAnnouncement[]> {
    if (customFetcher) {
      return customFetcher(source);
    }

    // 1. Manual review sources (UNDP, AAU, Mastercard Foundation, UNICEF, Safaricom, EAII, Gebeya, Ethiopian Airlines)
    // Automated scraping is either restricted by anti-bot protections or requires manual portal review.
    if (source.monitoringMethod === 'manual_review') {
      return [];
    }

    // 2. Official RSS Feed (e.g. DAAD Ethiopia)
    if (source.monitoringMethod === 'rss_feed') {
      const feedUrl = source.monitoringConfig?.feedUrl || source.officialUrl;
      const { text } = await safeFetchWithRetry(
        feedUrl,
        env.SOURCE_MAX_RETRIES || 3,
        env.SOURCE_REQUEST_TIMEOUT_MS || 10000,
        source.monitoringConfig?.customHeaders
      );
      return parseDaadRss(text, source);
    }

    // 3. Permitted monitoring (MLH, ASTU, GSoC)
    if (source.monitoringMethod === 'permitted_monitoring') {
      const endpoint = source.monitoringConfig?.endpointUrl || source.officialUrl;
      const { text } = await safeFetchWithRetry(
        endpoint,
        env.SOURCE_MAX_RETRIES || 3,
        env.SOURCE_REQUEST_TIMEOUT_MS || 10000,
        source.monitoringConfig?.customHeaders
      );

      if (source.slug === 'major-league-hacking' || endpoint.includes('mlh.')) {
        return parseMlhEvents(text, source);
      }

      if (source.slug === 'astu-official' || endpoint.includes('astu.edu.et')) {
        return parseAstuAnnouncements(text, source);
      }

      return [];
    }

    return [];
  }
}
