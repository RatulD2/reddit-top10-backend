const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: "Internal server error" });
});

// Enhanced country-specific subreddits mapping with marketing focus
const countrySubreddits = {
  us: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'advertising', 'business', 'entrepreneur', 'smallbusiness',
    'news', 'technology', 'science', 'entertainment', 'sports'
  ],
  uk: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'unitedkingdom', 'ukpolitics', 'casualuk', 'britishproblems',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  ca: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'canada', 'onguardforthee', 'canadapolitics',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  au: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'australia', 'straya', 'auspol',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  in: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'india', 'indiaspeaks', 'indianews',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  de: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'de', 'germany', 'de_politik',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  fr: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'france', 'french', 'france_politique',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  jp: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'japan', 'japanlife', 'newsokur',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  br: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'brasil', 'brasilivre', 'brasildob',
    'business', 'entrepreneur', 'smallbusiness'
  ],
  global: [
    'marketing', 'socialmedia', 'digitalmarketing', 'content_marketing',
    'advertising', 'business', 'entrepreneur', 'smallbusiness',
    'worldnews', 'news', 'technology', 'science', 'entertainment',
    'sports', 'gaming', 'movies', 'todayilearned', 'pics', 'videos',
    'askreddit'
  ]
};

// Content filtering
const NSFW_SUBREDDITS = new Set([
  'nsfw', 'porn', 'gonewild', 'nsfw_gif', 'nsfwhardcore', 'nsfw_videos',
  'adult', 'adultvideos', 'adultgifs', 'adultpics', 'adultcontent'
]);

const NSFW_KEYWORDS = new Set([
  'nsfw', 'porn', 'sex', 'adult', 'nude', 'naked', 'xxx', 'nsfw_gif',
  'gonewild', 'nsfwhardcore', 'nsfw_videos', 'adultvideos', 'adultgifs',
  'adultpics', 'adultcontent'
]);

// Marketing-specific subreddits for different industries
const MARKETING_SUBREDDITS = {
  hiring: ['forhire', 'hireawriter', 'hireaprogrammer', 'hireanartist', 'hireadesigner', 'jobs', 'jobsearch', 'careers', 'recruiting', 'hiring', 'jobpostings', 'jobhunting', 'jobsearching', 'jobopportunities'],
  freelancing: ['freelance', 'freelancers', 'digitalnomad', 'workonline', 'forhire', 'hireawriter', 'slavelabour'],
  marketing: ['marketing', 'socialmedia', 'digitalmarketing', 'content_marketing', 'growthhacking', 'seo', 'ppc', 'advertising', 'branding', 'marketingstrategy', 'marketingtips', 'marketingresearch', 'marketingautomation'],
  business: ['entrepreneur', 'smallbusiness', 'startups', 'business', 'sidehustle', 'entrepreneurship', 'businessstrategy', 'businessdevelopment', 'businessgrowth', 'businessideas'],
  tech: ['technology', 'programming', 'webdev', 'coding', 'software', 'tech', 'gadgets', 'technews', 'techsupport', 'techstartups', 'techbusiness'],
  design: ['design', 'graphic_design', 'web_design', 'ui_design', 'ux_design', 'design_critiques', 'branding', 'logodesign', 'designinspiration', 'designthinking'],
  writing: ['writing', 'writers', 'blogging', 'copywriting', 'contentwriting', 'writingprompts', 'contentmarketing', 'contentstrategy', 'contentcreation', 'contentwriting'],
  finance: ['personalfinance', 'investing', 'financialindependence', 'stocks', 'cryptocurrency', 'fintech', 'financialplanning', 'financialadvice', 'financialfreedom'],
  education: ['learnprogramming', 'education', 'teaching', 'onlinelearning', 'edtech', 'elearning', 'onlineeducation', 'educationtechnology'],
  health: ['fitness', 'nutrition', 'health', 'wellness', 'weightloss', 'fitnessmotivation', 'healthylifestyle', 'healthcare', 'mentalhealth'],
  lifestyle: ['lifestyle', 'productivity', 'selfimprovement', 'motivation', 'getdisciplined', 'personalgrowth', 'selfdevelopment', 'lifetips'],
  socialmedia: ['socialmedia', 'socialmediamarketing', 'socialmediajobs', 'socialmediastrategy', 'socialmediatips', 'socialmediamanagement', 'socialmediacontent', 'socialmediaads'],
  seo: ['seo', 'searchengineoptimization', 'seotools', 'seostrategy', 'seotips', 'seohelp', 'seomarketing', 'seocontent'],
  advertising: ['advertising', 'advertisingstrategy', 'advertisingtips', 'advertisingjobs', 'advertisingideas', 'advertisingcampaigns', 'advertisingdesign'],
  branding: ['branding', 'brandstrategy', 'brandidentity', 'branddesign', 'brandmarketing', 'branddevelopment', 'brandmanagement'],
  ecommerce: ['ecommerce', 'onlineshopping', 'dropshipping', 'shopify', 'amazon', 'ebay', 'onlinestore', 'ecommercestrategy'],
  analytics: ['analytics', 'dataanalysis', 'businessintelligence', 'datascience', 'marketinganalytics', 'webanalytics', 'dataanalytics'],
  email: ['emailmarketing', 'emailcampaigns', 'emailstrategy', 'emaildesign', 'emailautomation', 'emailcopywriting'],
  video: ['videomarketing', 'videoproduction', 'videoediting', 'videocontent', 'videostrategy', 'videocreators'],
  podcast: ['podcasting', 'podcastmarketing', 'podcastpromotion', 'podcastgrowth', 'podcaststrategy', 'podcastcontent'],
  influencer: ['influencermarketing', 'influencerstrategy', 'influenceroutreach', 'influencercontent', 'influencergrowth']
};

// Marketing-specific keywords and their variations
const MARKETING_KEYWORDS = {
  // General Marketing
  marketing: ['marketing', 'marketer', 'marketingstrategy', 'marketingplan', 'marketingcampaign', 'marketingtips', 'marketingideas', 'marketingresearch', 'marketingautomation'],
  
  // Digital Marketing
  digital: ['digital', 'digitalmarketing', 'digitalstrategy', 'digitalcampaign', 'digitalads', 'digitalcontent', 'digitalgrowth', 'digitaltransformation'],
  
  // Social Media
  social: ['social', 'socialmedia', 'socialmarketing', 'socialstrategy', 'socialcampaign', 'socialcontent', 'socialgrowth', 'socialads', 'socialmanagement'],
  
  // Content Marketing
  content: ['content', 'contentmarketing', 'contentstrategy', 'contentcreation', 'contentwriting', 'contentplanning', 'contentcalendar', 'contentdistribution'],
  
  // SEO
  seo: ['seo', 'searchengineoptimization', 'seostrategy', 'seotips', 'seocontent', 'seomarketing', 'seohelp', 'seotools', 'seoanalysis'],
  
  // Advertising
  advertising: ['advertising', 'ads', 'adcampaign', 'adstrategy', 'advertisingideas', 'advertisingtips', 'advertisingdesign', 'advertisingcopy'],
  
  // Branding
  branding: ['branding', 'brand', 'brandstrategy', 'brandidentity', 'branddesign', 'brandmarketing', 'branddevelopment', 'brandmanagement'],
  
  // Email Marketing
  email: ['email', 'emailmarketing', 'emailcampaign', 'emailstrategy', 'emaildesign', 'emailautomation', 'emailcopy', 'emailnewsletter'],
  
  // Video Marketing
  video: ['video', 'videomarketing', 'videocontent', 'videostrategy', 'videoproduction', 'videoediting', 'videocampaign', 'videodistribution'],
  
  // Influencer Marketing
  influencer: ['influencer', 'influencermarketing', 'influencerstrategy', 'influenceroutreach', 'influencercontent', 'influencercampaign', 'influencergrowth'],
  
  // Analytics
  analytics: ['analytics', 'data', 'analysis', 'metrics', 'reporting', 'tracking', 'measurement', 'kpi', 'roi', 'conversion'],
  
  // E-commerce
  ecommerce: ['ecommerce', 'onlineshop', 'onlinestore', 'dropshipping', 'shopify', 'amazon', 'ebay', 'onlinebusiness', 'onlinesales'],
  
  // Growth Hacking
  growth: ['growth', 'growthhacking', 'growthstrategy', 'growthmarketing', 'growthtips', 'growthhacks', 'growthideas', 'growthplanning'],
  
  // Lead Generation
  leads: ['leads', 'leadgeneration', 'leadnurturing', 'leadqualification', 'leadscoring', 'leadmanagement', 'leadstrategy', 'leadcampaign'],
  
  // Conversion
  conversion: ['conversion', 'conversionrate', 'conversionoptimization', 'conversionstrategy', 'conversiontips', 'conversionfunnel', 'conversiontracking'],
  
  // Automation
  automation: ['automation', 'marketingautomation', 'emailautomation', 'socialautomation', 'contentautomation', 'workflowautomation', 'automationtools'],
  
  // Strategy
  strategy: ['strategy', 'marketingstrategy', 'contentstrategy', 'socialstrategy', 'brandstrategy', 'growthstrategy', 'digitalstrategy'],
  
  // Campaign
  campaign: ['campaign', 'marketingcampaign', 'adcampaign', 'socialcampaign', 'emailcampaign', 'contentcampaign', 'brandcampaign'],
  
  // ROI
  roi: ['roi', 'returnoninvestment', 'roianalysis', 'roitracking', 'roimeasurement', 'roioptimization', 'roistrategy'],
  
  // Trends
  trends: ['trends', 'marketingtrends', 'digitaltrends', 'socialtrends', 'contenttrends', 'brandtrends', 'industrytrends'],
  
  // Tools
  tools: ['tools', 'marketingtools', 'seotools', 'analytictools', 'automationtools', 'contenttools', 'socialtools'],
  
  // Case Studies
  casestudy: ['casestudy', 'successstory', 'marketingcase', 'brandcase', 'campaigncase', 'strategycase', 'growthcase'],
  
  // Best Practices
  bestpractices: ['bestpractices', 'marketingbestpractices', 'contentbestpractices', 'socialbestpractices', 'seobestpractices', 'emailbestpractices']
};

// Job-related keywords and their variations
const JOB_KEYWORDS = {
  hiring: ['hiring', 'hire', 'hired', 'hires', 'recruiting', 'recruit', 'recruiter', 'recruitment', 'job', 'jobs', 'career', 'careers', 'employment', 'employ', 'employer', 'employee', 'work', 'working', 'position', 'vacancy', 'vacancies', 'opening', 'openings', 'role', 'roles'],
  remote: ['remote', 'work from home', 'wfh', 'telecommute', 'telecommuting', 'virtual', 'online work', 'digital nomad'],
  freelance: ['freelance', 'freelancer', 'freelancing', 'contract', 'contractor', 'contracting', 'gig', 'gigs', 'project', 'projects'],
  fulltime: ['full time', 'full-time', 'fulltime', 'permanent', 'staff', 'employee', 'employment'],
  parttime: ['part time', 'part-time', 'parttime', 'casual', 'temporary', 'temp']
};

// Function to tokenize and clean text
function tokenizeText(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .split(/\s+/) // Split into words
    .filter(word => word.length > 2) // Remove very short words
    .filter(word => !['the', 'and', 'for', 'are', 'was', 'this', 'that', 'with', 'from', 'has', 'have', 'had', 'but', 'not', 'all', 'any', 'can', 'will', 'just', 'now', 'then', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'whether', 'if', 'because', 'since', 'while', 'though', 'although', 'unless', 'until', 'before', 'after', 'during', 'through', 'under', 'over', 'between', 'among', 'into', 'onto', 'upon', 'within', 'without', 'about', 'against', 'along', 'around', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside', 'over', 'past', 'since', 'through', 'throughout', 'till', 'to', 'toward', 'under', 'underneath', 'until', 'up', 'upon', 'with', 'within', 'without'].includes(word)); // Remove common words and prepositions
}

// Function to check if content is safe
function isContentSafe(title, subreddit) {
  const titleLower = title.toLowerCase();
  const subredditLower = subreddit.toLowerCase();
  
  // Check subreddit
  if (NSFW_SUBREDDITS.has(subredditLower)) {
    return false;
  }
  
  // Check title for NSFW keywords
  for (const keyword of NSFW_KEYWORDS) {
    if (titleLower.includes(keyword)) {
      return false;
    }
  }
  
  return true;
}

// Function to check if a word is a valid match
function isValidWordMatch(queryWord, titleWord) {
  // Exact match
  if (queryWord === titleWord) return true;
  
  // Check if the words are related (e.g., advertise -> advertisement)
  const commonPrefixes = ['ad', 're', 'un', 'in', 'dis', 'pre', 'post', 'sub', 'super'];
  const commonSuffixes = ['ing', 'ed', 's', 'ion', 'ment', 'able', 'ible', 'ful', 'less'];
  
  // Remove common prefixes and suffixes for comparison
  let cleanQueryWord = queryWord;
  let cleanTitleWord = titleWord;
  
  for (const prefix of commonPrefixes) {
    if (cleanQueryWord.startsWith(prefix)) cleanQueryWord = cleanQueryWord.slice(prefix.length);
    if (cleanTitleWord.startsWith(prefix)) cleanTitleWord = cleanTitleWord.slice(prefix.length);
  }
  
  for (const suffix of commonSuffixes) {
    if (cleanQueryWord.endsWith(suffix)) cleanQueryWord = cleanQueryWord.slice(0, -suffix.length);
    if (cleanTitleWord.endsWith(suffix)) cleanTitleWord = cleanTitleWord.slice(0, -suffix.length);
  }
  
  // Check if the cleaned words match
  if (cleanQueryWord === cleanTitleWord) return true;
  
  // Check if one word is contained within the other (but not too short)
  if (cleanQueryWord.length > 3 && cleanTitleWord.length > 3) {
    if (cleanQueryWord.includes(cleanTitleWord) || cleanTitleWord.includes(cleanQueryWord)) {
      // Ensure the match is significant (at least 4 characters)
      return Math.min(cleanQueryWord.length, cleanTitleWord.length) >= 4;
    }
  }
  
  return false;
}

// Function to find relevant marketing subreddits based on keyword
function findRelevantMarketingSubreddits(keyword) {
  const keywordLower = keyword.toLowerCase();
  let relevantSubreddits = new Set();
  
  // Check for job-related keywords first
  for (const [category, keywords] of Object.entries(JOB_KEYWORDS)) {
    if (keywords.some(k => keywordLower.includes(k.toLowerCase()))) {
      MARKETING_SUBREDDITS[category].forEach(sub => relevantSubreddits.add(sub));
    }
  }
  
  // Check for marketing-specific keywords
  for (const [category, keywords] of Object.entries(MARKETING_KEYWORDS)) {
    if (keywords.some(k => keywordLower.includes(k.toLowerCase()))) {
      MARKETING_SUBREDDITS[category]?.forEach(sub => relevantSubreddits.add(sub));
    }
  }
  
  // Check each category
  for (const [category, subreddits] of Object.entries(MARKETING_SUBREDDITS)) {
    if (category.includes(keywordLower) || keywordLower.includes(category)) {
      subreddits.forEach(sub => relevantSubreddits.add(sub));
    }
  }
  
  // Add general marketing subreddits for marketing-related searches
  if (Object.values(MARKETING_KEYWORDS).some(keywords => 
    keywords.some(k => keywordLower.includes(k.toLowerCase())))) {
    relevantSubreddits.add('marketing');
    relevantSubreddits.add('socialmedia');
    relevantSubreddits.add('digitalmarketing');
    relevantSubreddits.add('business');
    relevantSubreddits.add('entrepreneur');
  }
  
  return Array.from(relevantSubreddits);
}

// Function to calculate marketing opportunity score
function calculateMarketingOpportunityScore(thread) {
  const {
    upvotes,
    comments,
    created,
    engagement_rate
  } = thread;
  
  // Calculate time decay (favor recent posts)
  const hoursSinceCreation = (Date.now() / 1000 - created) / 3600;
  const timeDecay = Math.exp(-hoursSinceCreation / 168); // 1 week decay
  
  // Calculate comment velocity (comments per hour)
  const commentVelocity = comments / (hoursSinceCreation + 1);
  
  // Calculate engagement quality (ratio of comments to upvotes)
  const engagementQuality = comments / (upvotes + 1);
  
  // Calculate overall opportunity score
  const opportunityScore = (
    (upvotes * 0.3) + // Base popularity
    (comments * 0.4) + // Discussion activity
    (engagement_rate * 0.2) + // Engagement rate
    (commentVelocity * 0.1) + // Recent activity
    (engagementQuality * 0.2) // Quality of engagement
  ) * timeDecay;
  
  return opportunityScore;
}

// Function to calculate keyword relevance
function calculateKeywordRelevance(title, searchQuery) {
  // First check if content is safe
  if (!isContentSafe(title, '')) {
    return 0;
  }

  const titleTokens = tokenizeText(title);
  const queryTokens = tokenizeText(searchQuery);
  
  if (queryTokens.length === 0) return 0;
  
  // Calculate word match score
  let matchScore = 0;
  let matchedWords = new Set();
  let exactPhraseMatch = false;
  
  // Check for exact phrase match first
  const titleLower = title.toLowerCase();
  const queryLower = searchQuery.toLowerCase();
  if (titleLower.includes(queryLower)) {
    matchScore += 30; // Higher bonus for exact phrase match
    exactPhraseMatch = true;
  }
  
  // Check for marketing-related keywords
  const isMarketingRelated = Object.values(MARKETING_KEYWORDS).some(keywords =>
    keywords.some(k => queryLower.includes(k.toLowerCase()))
  );
  
  if (isMarketingRelated) {
    // Check if title contains marketing-related terms
    const hasMarketingTerms = Object.values(MARKETING_KEYWORDS).some(keywords =>
      keywords.some(k => titleLower.includes(k.toLowerCase()))
    );
    
    if (hasMarketingTerms) {
      matchScore += 15; // Bonus for marketing-related content
    }
  }
  
  // Check for job-related keywords
  const isJobRelated = Object.values(JOB_KEYWORDS).some(keywords =>
    keywords.some(k => queryLower.includes(k.toLowerCase()))
  );
  
  if (isJobRelated) {
    // Check if title contains job-related terms
    const hasJobTerms = Object.values(JOB_KEYWORDS).some(keywords =>
      keywords.some(k => titleLower.includes(k.toLowerCase()))
    );
    
    if (hasJobTerms) {
      matchScore += 15; // Bonus for job-related content
    }
  }
  
  // Check for word matches
  for (const queryWord of queryTokens) {
    let bestMatchScore = 0;
    let bestMatchIndex = -1;
    
    for (let i = 0; i < titleTokens.length; i++) {
      const titleWord = titleTokens[i];
      
      if (isValidWordMatch(queryWord, titleWord)) {
        const positionScore = 1 - (i / titleTokens.length); // Words at the start get higher score
        bestMatchScore = Math.max(bestMatchScore, 12 + positionScore); // Increased base score
        bestMatchIndex = i;
      }
    }
    
    if (bestMatchScore > 0) {
      matchScore += bestMatchScore;
      matchedWords.add(queryWord);
      
      // Bonus for consecutive word matches
      if (bestMatchIndex > 0) {
        const prevWord = titleTokens[bestMatchIndex - 1];
        if (matchedWords.has(prevWord)) {
          matchScore += 5; // Higher bonus for consecutive matches
        }
      }
    }
  }
  
  // Calculate word order relevance
  const titleWords = titleLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  let orderScore = 0;
  
  for (let i = 0; i < titleWords.length - queryWords.length + 1; i++) {
    let matches = 0;
    for (let j = 0; j < queryWords.length; j++) {
      if (isValidWordMatch(queryWords[j], titleWords[i + j])) {
        matches++;
      }
    }
    if (matches === queryWords.length) {
      orderScore += 15; // Higher bonus for maintaining word order
    }
  }
  
  // Calculate word proximity score
  let proximityScore = 0;
  const matchedIndices = [];
  
  for (let i = 0; i < titleWords.length; i++) {
    for (let j = 0; j < queryWords.length; j++) {
      if (isValidWordMatch(queryWords[j], titleWords[i])) {
        matchedIndices.push(i);
        // Check nearby words for other query terms
        for (let k = Math.max(0, i - 2); k <= Math.min(titleWords.length - 1, i + 2); k++) {
          if (k !== i) {
            for (let l = 0; l < queryWords.length; l++) {
              if (l !== j && isValidWordMatch(queryWords[l], titleWords[k])) {
                const distance = Math.abs(k - i);
                proximityScore += 2 / (distance + 1); // Higher score for proximity
              }
            }
          }
        }
      }
    }
  }
  
  // Calculate word density score
  let densityScore = 0;
  if (matchedIndices.length > 1) {
    const totalDistance = matchedIndices[matchedIndices.length - 1] - matchedIndices[0];
    const density = matchedIndices.length / (totalDistance + 1);
    densityScore = density * 6; // Higher bonus for dense matches
  }
  
  // Calculate final relevance score
  const wordMatchRatio = matchedWords.size / queryTokens.length;
  const finalScore = (
    matchScore + 
    orderScore + 
    proximityScore + 
    densityScore
  ) * wordMatchRatio;
  
  // Boost score for exact phrase matches
  if (exactPhraseMatch) {
    return finalScore * 3.5;
  }
  
  return finalScore;
}

// Function to find similar threads
function findSimilarThreads(threads, searchQuery, minRelevance = 0.85) { // Higher minimum relevance
  // Filter out unsafe content first
  const safeThreads = threads.filter(t => isContentSafe(t.title, t.subreddit));
  
  const relevantThreads = safeThreads.filter(t => t.relevance >= minRelevance);
  
  if (relevantThreads.length === 0) {
    // If no relevant threads found, try to find threads with similar topics
    const queryTokens = tokenizeText(searchQuery);
    const similarThreads = safeThreads.map(t => {
      const titleTokens = tokenizeText(t.title);
      const commonWords = queryTokens.filter(qt => 
        titleTokens.some(tt => isValidWordMatch(qt, tt))
      );
      
      // Calculate semantic similarity
      const semanticScore = commonWords.length / queryTokens.length;
      
      // Calculate word overlap
      const titleWords = new Set(titleTokens);
      const queryWords = new Set(queryTokens);
      const intersection = new Set([...titleWords].filter(x => 
        [...queryWords].some(qw => isValidWordMatch(x, qw))
      ));
      const overlapScore = intersection.size / queryWords.size;
      
      return {
        ...t,
        relevance: Math.max(semanticScore, overlapScore)
      };
    }).filter(t => t.relevance > 0.7) // Higher minimum relevance for similar threads
      .sort((a, b) => b.relevance - a.relevance);
    
    return similarThreads;
  }
  
  return relevantThreads;
}

// Fetch top posts from Lemmy community
async function fetchLemmyTopPosts({ community = 'marketing', limit = 10, instance = 'lemmy.world' }) {
  const url = `https://${instance}/api/v3/post/list?community_name=${encodeURIComponent(community)}&type=Top&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lemmy API error: ${res.status}`);
  const data = await res.json();
  return (data.posts || []).map(p => ({
    title: p.post.name,
    url: p.post.url || `https://${instance}/post/${p.post.id}`,
    upvotes: p.post.score,
    comments: p.counts.comments,
    score: p.post.score,
    relevance: 0, // Not available
    subreddit: p.community.name, // Lemmy community
    created: new Date(p.post.published).getTime() / 1000,
    engagement_rate: 0, // Not available
    opportunity_score: 0 // Not available
  }));
}

app.get("/api/reddit", async (req, res) => {
  const { q, subreddit, sort = "top", country = "global" } = req.query;
  try {
    let allThreads = [];
    const searchQuery = q ? q.trim() : '';
    let communitiesToSearch = subreddit ? [subreddit] : countrySubreddits[country] || countrySubreddits.global;
    if (searchQuery && !subreddit) {
      const marketingCommunities = findRelevantMarketingSubreddits(searchQuery);
      const globalCommunities = countrySubreddits.global;
      communitiesToSearch = [...new Set([...communitiesToSearch, ...marketingCommunities, ...globalCommunities])];
    }
    // Fetch from all relevant Lemmy communities
    for (const community of communitiesToSearch) {
      try {
        if (!community || typeof community !== 'string' || !/^[A-Za-z0-9_]+$/.test(community)) continue; // skip invalid names
        const threads = await fetchLemmyTopPosts({ community, limit: 10 });
        allThreads = [...allThreads, ...threads];
      } catch (err) {
        if (err.message.includes('Lemmy API error: 404')) {
          console.warn(`Community not found on Lemmy: ${community}`);
          continue;
        }
        console.error(`Error fetching from Lemmy community ${community}:`, err);
        continue;
      }
    }
    // Remove duplicates based on URL
    const uniqueThreads = Array.from(new Map(allThreads.map(t => [t.url, t])).values());
    // If there's a search query, filter by keyword in title
    let filteredThreads = uniqueThreads;
    if (searchQuery) {
      filteredThreads = uniqueThreads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    res.json(filteredThreads.slice(0, 10));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Failed to fetch from Lemmy" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
